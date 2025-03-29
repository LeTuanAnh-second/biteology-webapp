
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

    console.log(`Would send email to ${to} with subject "${subject}"`);
    console.log(`From: ${from || "Biteology <no-reply@biteology.com>"}`);
    console.log(`Content: ${html}`);

    // Use Resend to send the email
    const { data, error } = await resend.emails.send({
      from: from || "Biteology <no-reply@biteology.com>",
      to: [to],
      subject: subject,
      html: html,
    });

    if (error) {
      console.error("Resend API error:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log("Email sent successfully:", data);
    
    return new Response(
      JSON.stringify({ success: true, data }),
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
