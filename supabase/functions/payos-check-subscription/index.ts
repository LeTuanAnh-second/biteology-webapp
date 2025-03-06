
// Deno edge function to check user subscription status

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

// Set up the Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
const supabase = createClient(supabaseUrl, supabaseKey);

// Set CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function checkSubscription(userId: string) {
  try {
    console.log(`Checking subscription for user: ${userId}`);
    
    // Get current date in ISO format
    const now = new Date().toISOString();
    
    // Check for active subscription
    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        plan:plan_id (
          name,
          duration_days
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .gte('end_date', now)
      .order('end_date', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error) {
      console.error('Error checking subscription:', error);
      return { 
        isPremium: false,
        error: error.message
      };
    }
    
    if (!subscription) {
      console.log('No active subscription found for user:', userId);
      return { isPremium: false };
    }
    
    console.log('Found active subscription:', subscription);
    
    // Calculate remaining days
    const endDate = new Date(subscription.end_date);
    const currentDate = new Date();
    const remainingDays = Math.ceil((endDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Update the user's profile to ensure the is_premium flag is set
    await supabase
      .from('profiles')
      .update({ is_premium: true })
      .eq('id', userId);
    
    return {
      isPremium: true,
      subscription: {
        planName: subscription.plan?.name || 'Premium',
        endDate: subscription.end_date,
        remainingDays: remainingDays
      }
    };
    
  } catch (error) {
    console.error('Error checking subscription:', error);
    return { 
      isPremium: false,
      error: String(error)
    };
  }
}

serve(async (req) => {
  console.log("Received request:", req.method, req.url);
  
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    console.log("Responding to OPTIONS request with CORS headers");
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  
  try {
    // Check for Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(
        JSON.stringify({ code: 401, message: 'Missing authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }
    
    // Validate JWT token
    try {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        console.error("Invalid token:", error);
        return new Response(
          JSON.stringify({ code: 401, message: 'Invalid authorization token' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }
      
      console.log("Authenticated user:", user.id);
    } catch (error) {
      console.error("Error validating token:", error);
      return new Response(
        JSON.stringify({ code: 401, message: 'Invalid authorization token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }
    
    // Extract userId from query params
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing userId parameter' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    const result = await checkSubscription(userId);
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
