import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { v4 as uuidv4 } from 'https://esm.sh/uuid@9.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
        order_id: orderId, // Ensure order_id is set
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

    // Using the production PayOS API URL
    const payosApiUrl = 'https://api.payos.vn/v2/payment-requests'

    // Retry mechanism for API calls
    let payosData = null;
    let payosError = null;
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts && !payosData) {
      attempts++;
      console.log(`PayOS API call attempt ${attempts}`)

      try {
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
          
          payosError = `PayOS API error: ${payosResponse.status} ${payosResponse.statusText} - ${errorText}`;
          
          // If we have more attempts, continue to next iteration
          if (attempts < maxAttempts) continue;
          
          // Otherwise handle the error below
        } else {
          // Success case - parse response and exit loop
          payosData = await payosResponse.json();
          console.log('PayOS response:', payosData);
          break;
        }
      } catch (fetchError) {
        console.error(`Fetch error on attempt ${attempts}:`, fetchError);
        payosError = `Network error: ${fetchError.message}`;
        
        // If we have more attempts, continue to next iteration
        if (attempts < maxAttempts) {
          // Short delay before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
      }
    }

    // If we couldn't get payosData after all attempts
    if (!payosData) {
      // Create a simulated response for development/testing
      // This is a fallback when the actual PayOS API is unreachable
      if (Deno.env.get('ENVIRONMENT') === 'development') {
        console.log('Using simulated PayOS response for development');
        payosData = {
          code: "00",
          desc: "Success (Simulated)",
          checkoutUrl: `https://sandbox.payos.vn/web-payment?token=simulated_${orderId}`,
          qrCode: "https://cdn.payos.vn/img/payos-logo.png", // Placeholder QR image
        };
      } else {
        return new Response(
          JSON.stringify({
            success: false,
            error: payosError || "Failed to connect to PayOS after multiple attempts",
            details: "Please try again later"
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

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
