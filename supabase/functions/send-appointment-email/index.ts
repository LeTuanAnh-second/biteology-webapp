
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

interface AppointmentDetails {
  expertId: number;
  expertName: string;
  expertEmail: string;
  userName: string;
  userEmail: string;
  date: string;
  time: string;
  reason: string;
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      headers: corsHeaders,
      status: 200
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body: AppointmentDetails = await req.json();
    const { expertName, expertEmail, userName, userEmail, date, time, reason } = body;
    
    // No need to get the user from auth header as we're passing the user info in the body
    
    // Create email content for the expert
    const emailSubject = `Yêu cầu tư vấn từ ${userName} - B!teology`;
    const emailContent = `
      <h1>Xin chào ${expertName},</h1>
      <p>Bạn có một yêu cầu tư vấn mới từ ${userName} (${userEmail}) thông qua nền tảng B!teology.</p>
      <h2>Chi tiết cuộc hẹn:</h2>
      <ul>
        <li><strong>Ngày:</strong> ${date}</li>
        <li><strong>Giờ:</strong> ${time}</li>
        <li><strong>Lý do tư vấn:</strong> ${reason}</li>
      </ul>
      <p>Vui lòng phản hồi email này để xác nhận lịch hẹn hoặc đề xuất thời gian khác nếu cần.</p>
      <p>Trân trọng,<br>Đội ngũ B!teology</p>
    `;

    // Simulate sending the email (in production, this would call a real email service)
    console.log("Would send email to:", expertEmail);
    console.log("Subject:", emailSubject);
    console.log("Content:", emailContent);

    // Send email using Supabase Email service (via an Edge Function)
    try {
      const { error: emailError } = await supabaseClient.functions.invoke("send-email", {
        body: {
          to: expertEmail,
          subject: emailSubject,
          html: emailContent,
          from: "no-reply@biteology.com"
        }
      });

      if (emailError) throw emailError;
    } catch (emailError) {
      console.error("Email service error:", emailError);
      // Continue execution even if email fails - we'll log the error but return success to the client
    }

    return new Response(
      JSON.stringify({ success: true }),
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
