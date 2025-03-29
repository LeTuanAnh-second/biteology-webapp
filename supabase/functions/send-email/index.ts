
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, html, from } = await req.json();

    if (!to || !subject || !html) {
      throw new Error("Missing required fields: to, subject, or html");
    }

    // Log email details instead of sending via SMTP
    console.log(`Would send email to ${to} with subject "${subject}"`);
    console.log(`From: ${from || "Biteology <no-reply@biteology.com>"}`);
    console.log(`Content: ${html}`);
    
    // For development, pretend the email was sent successfully
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email logged for development (SMTP not configured)",
        data: { to, subject }
      }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 400,
      }
    );
  }
});
