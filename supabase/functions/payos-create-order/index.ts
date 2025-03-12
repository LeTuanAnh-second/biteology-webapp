
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { v4 as uuidv4 } from 'https://esm.sh/uuid@9.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Set to true to always return simulated data (for development)
const FORCE_DEV_MODE = true;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get the request body
    const { planId } = await req.json()
    
    // Get the JWT token from the request header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) {
      console.error('Auth error:', authError)
      throw new Error('Unauthorized')
    }

    // Get plan details
    const { data: plan, error: planError } = await supabaseClient
      .from('premium_plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (planError || !plan) {
      console.error('Error fetching plan:', planError)
      throw new Error('Plan not found')
    }

    const orderId = uuidv4()
    const amount = Math.round(plan.price)
    const description = `Nâng cấp tài khoản lên gói ${plan.name}`
    
    console.log('Creating payment request with params:', {
      orderId,
      amount,
      description,
      planId,
      userId: user.id
    })

    const PAYOS_CLIENT_ID = Deno.env.get('PAYOS_CLIENT_ID')
    const PAYOS_API_KEY = Deno.env.get('PAYOS_API_KEY')
    const PUBLIC_SITE_URL = Deno.env.get('PUBLIC_SITE_URL') || 'https://biteology-webapp.lovable.app'

    if (!PAYOS_CLIENT_ID || !PAYOS_API_KEY) {
      console.error('Missing PayOS configuration')
      throw new Error('PayOS configuration is missing')
    }

    // Store transaction in database first (before API call)
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
      })

    if (transactionError) {
      console.error('Error creating transaction:', transactionError)
      throw new Error('Failed to create transaction record')
    }

    // Check if we should use development mode (either forced or detected environment)
    const isDevelopment = FORCE_DEV_MODE || Deno.env.get('ENVIRONMENT') === 'development';
    
    // If in development mode, return simulated response
    if (isDevelopment) {
      console.log('Using simulated PayOS response for development');
      
      const simulatedResponse = {
        success: true,
        checkoutUrl: `https://sandbox.payos.vn/web-payment?token=simulated_${orderId}`,
        qrCode: "https://cdn.payos.vn/img/qrcode-example.png", // Example QR image
        orderId: orderId
      };
      
      // Add short delay to simulate network request
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return new Response(
        JSON.stringify(simulatedResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Production mode - attempt to call real PayOS API
    try {
      // Using the production PayOS API URL
      const payosApiUrl = 'https://api.payos.vn/v2/payment-requests'

      console.log('Calling PayOS API at:', payosApiUrl);
      
      // Create payment request to PayOS
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
        
        throw new Error(`PayOS API error: ${payosResponse.status} ${payosResponse.statusText}`);
      }
      
      const payosData = await payosResponse.json();
      console.log('PayOS response:', payosData);

      // Return the payment URLs
      return new Response(
        JSON.stringify({
          success: true,
          checkoutUrl: payosData.checkoutUrl,
          qrCode: payosData.qrCode,
          orderId: orderId
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
      
    } catch (apiError) {
      console.error('Error sending request to PayOS:', apiError);
      throw new Error(`Error sending request to PayOS: ${apiError.message}`);
    }
  } catch (error) {
    console.error('Error in payos-create-order:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      }),
      { 
        status: 400, // Return 400 instead of 500 to avoid non-2xx status code error
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
