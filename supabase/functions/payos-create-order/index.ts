
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { v4 as uuidv4 } from 'https://esm.sh/uuid@9.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Set to true to always return simulated data (for development)
// TỪ KHI BẠN CHUYỂN SANG MÔI TRƯỜNG SẢN XUẤT, HÃY ĐẶT GIÁ TRỊ NÀY THÀNH FALSE
const FORCE_DEV_MODE = true;

// Hàm tiện ích để tạo phản hồi cho lỗi
const createErrorResponse = (error: unknown, status = 400) => {
  console.error('Error in payos-create-order:', error);
  const errorMessage = error instanceof Error 
    ? error.message 
    : 'Internal server error';
  
  return new Response(
    JSON.stringify({
      success: false,
      error: errorMessage,
      details: error instanceof Error ? error.stack : null
    }),
    { 
      status: status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
};

// Hàm tiện ích để mô phỏng trễ mạng
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get the request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (error) {
      return createErrorResponse(new Error('Invalid JSON in request body'), 400);
    }
    
    const { planId } = requestBody;
    
    if (!planId) {
      return createErrorResponse(new Error('Missing required field: planId'), 400);
    }
    
    // Get the JWT token from the request header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return createErrorResponse(new Error('Missing authorization header'), 401);
    }

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      console.error('Auth error:', authError);
      return createErrorResponse(new Error('Unauthorized'), 401);
    }

    // Get plan details
    const { data: plan, error: planError } = await supabaseClient
      .from('premium_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      console.error('Error fetching plan:', planError);
      return createErrorResponse(new Error('Plan not found'), 404);
    }

    const orderId = uuidv4();
    const amount = Math.round(plan.price);
    const description = `Nâng cấp tài khoản lên gói ${plan.name}`;
    
    console.log('Creating payment request with params:', {
      orderId,
      amount,
      description,
      planId,
      userId: user.id
    });

    // Store transaction in database first (before API call)
    try {
      const { error: transactionError } = await supabaseClient
        .from('payment_transactions')
        .insert({
          id: orderId,
          order_id: orderId,
          user_id: user.id,
          plan_id: planId,
          amount: amount,
          payment_method: 'payos',
          status: 'pending'
        });

      if (transactionError) {
        console.error('Error creating transaction:', transactionError);
        return createErrorResponse(new Error('Failed to create transaction record'), 500);
      }
    } catch (dbError) {
      console.error('Database error while creating transaction:', dbError);
      return createErrorResponse(new Error('Database error during transaction creation'), 500);
    }

    // Luôn sử dụng chế độ giả lập khi FORCE_DEV_MODE = true
    if (FORCE_DEV_MODE) {
      console.log('Using simulated PayOS response for development');
      
      // Mô phỏng phản hồi từ PayOS
      const simulatedResponse = {
        success: true,
        checkoutUrl: `https://sandbox.payos.vn/web-payment?token=simulated_${orderId}`,
        qrCode: "https://cdn.payos.vn/img/qrcode-example.png", // Ví dụ QR code
        orderId: orderId,
        isDevMode: true
      };
      
      // Thêm độ trễ để mô phỏng yêu cầu mạng
      await delay(500);
      
      return new Response(
        JSON.stringify(simulatedResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Môi trường sản xuất - cố gắng gọi API PayOS thực tế
    try {
      const PAYOS_CLIENT_ID = Deno.env.get('PAYOS_CLIENT_ID');
      const PAYOS_API_KEY = Deno.env.get('PAYOS_API_KEY');
      const PUBLIC_SITE_URL = Deno.env.get('PUBLIC_SITE_URL') || 'https://biteology-webapp.lovable.app';

      if (!PAYOS_CLIENT_ID || !PAYOS_API_KEY) {
        console.error('Missing PayOS configuration');
        return createErrorResponse(new Error('PayOS configuration is missing'), 500);
      }
      
      // Sử dụng URL API PayOS
      const payosApiUrl = 'https://api.payos.vn/v2/payment-requests';

      console.log('Calling PayOS API at:', payosApiUrl);
      
      // Tạo yêu cầu thanh toán đến PayOS
      const payosResponse = await fetch(payosApiUrl, {
        method: 'POST',
        headers: {
          'x-client-id': PAYOS_CLIENT_ID,
          'x-api-key': PAYOS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderCode: orderId,
          amount,
          description,
          cancelUrl: `${PUBLIC_SITE_URL}/premium`,
          returnUrl: `${PUBLIC_SITE_URL}/payment-result?orderCode=${orderId}`,
        }),
      });

      if (!payosResponse.ok) {
        const errorText = await payosResponse.text();
        console.error('PayOS API error:', {
          status: payosResponse.status,
          statusText: payosResponse.statusText,
          body: errorText
        });
        
        // Ghi nhận lỗi chi tiết
        console.error(`PayOS API error: ${payosResponse.status} ${payosResponse.statusText}`);
        return createErrorResponse(new Error(`PayOS API error: ${payosResponse.status} ${errorText.substring(0, 100)}`), 502);
      }
      
      const payosData = await payosResponse.json();
      console.log('PayOS response:', payosData);

      // Trả về URL thanh toán
      return new Response(
        JSON.stringify({
          success: true,
          checkoutUrl: payosData.checkoutUrl,
          qrCode: payosData.qrCode,
          orderId: orderId,
          isDevMode: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
      
    } catch (apiError) {
      console.error('Error sending request to PayOS:', apiError);
      return createErrorResponse(new Error(`Error sending request to PayOS: ${apiError instanceof Error ? apiError.message : String(apiError)}`), 502);
    }
  } catch (error) {
    return createErrorResponse(error, 500);
  }
});
