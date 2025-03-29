
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

    console.log(`Sending email to ${to} with subject "${subject}"`);
    console.log(`From: ${from || "Biteology <anhltse170584@fpt.edu.vn>"}`);

    // Use Supabase's built-in SMTP for sending emails
    const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/auth/v1/admin/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
      },
      body: JSON.stringify({
        email: to,
        subject: subject,
        template_data: {
          html_body: html,
        },
        email_template: "custom",
        email_from: from || "Biteology <anhltse170584@fpt.edu.vn>",
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Supabase SMTP API error:", errorData);
      throw new Error(`Failed to send email: ${errorData}`);
    }

    const data = await response.json();
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
