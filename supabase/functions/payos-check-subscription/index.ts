
// Deno edge function to check user's premium subscription status

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
    console.log(`Checking subscription for user ${userId}`);
    
    const now = new Date().toISOString();
    
    // Query for active subscription
    const { data: subscription, error: subscriptionError } = await supabase
      .from('premium_subscriptions')
      .select(`
        *,
        plans:plan_id (
          name
        )
      `)
      .eq('user_id', userId)
      .gte('end_date', now)
      .order('end_date', { ascending: false })
      .limit(1)
      .single();
    
    if (subscriptionError) {
      // No active subscription found
      if (subscriptionError.code === 'PGRST116') {
        return { isPremium: false };
      }
      
      console.error('Error checking subscription:', subscriptionError);
      return { isPremium: false };
    }
    
    if (!subscription) {
      return { isPremium: false };
    }
    
    // Calculate remaining days
    const endDate = new Date(subscription.end_date);
    const currentDate = new Date();
    const diffTime = Math.abs(endDate.getTime() - currentDate.getTime());
    const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return {
      isPremium: true,
      subscription: {
        planName: subscription.plans?.name || "Premium",
        endDate: subscription.end_date,
        remainingDays: remainingDays
      }
    };
    
  } catch (error) {
    console.error('Error checking subscription:', error);
    return { isPremium: false };
  }
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing user ID' }),
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
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
