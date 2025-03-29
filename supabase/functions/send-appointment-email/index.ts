
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AppointmentDetails {
  expertId: number;
  expertName: string;
  expertEmail: string;
  date: string;
  time: string;
  reason: string;
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body: AppointmentDetails = await req.json();
    const { expertName, expertEmail, date, time, reason } = body;
    
    // Get the current user's email from the authorization header
    const authHeader = req.headers.get("Authorization")?.split("Bearer ")[1];
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(authHeader);

    if (userError || !user) {
      throw new Error("Error getting user: " + (userError?.message || "User not found"));
    }

    // Get user profile to get their name
    const { data: profileData } = await supabaseClient
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const userName = profileData?.full_name || "Người dùng";
    
    // Create email content for the expert
    const emailSubject = `Yêu cầu tư vấn từ ${userName} - B!teology`;
    const emailContent = `
      <h1>Xin chào ${expertName},</h1>
      <p>Bạn có một yêu cầu tư vấn mới từ ${userName} (${user.email}) thông qua nền tảng B!teology.</p>
      <h2>Chi tiết cuộc hẹn:</h2>
      <ul>
        <li><strong>Ngày:</strong> ${date}</li>
        <li><strong>Giờ:</strong> ${time}</li>
        <li><strong>Lý do tư vấn:</strong> ${reason}</li>
      </ul>
      <p>Vui lòng phản hồi email này để xác nhận lịch hẹn hoặc đề xuất thời gian khác nếu cần.</p>
      <p>Trân trọng,<br>Đội ngũ B!teology</p>
    `;

    // Send email using the send-email Edge Function
    const { error: emailError } = await supabaseClient.functions.invoke("send-email", {
      body: {
        to: expertEmail,
        subject: emailSubject,
        html: emailContent,
        from: "Biteology <no-reply@biteology.com>"
      }
    });

    if (emailError) throw emailError;

    // Send confirmation email to user
    const userEmailSubject = `Xác nhận đặt lịch tư vấn - B!teology`;
    const userEmailContent = `
      <h1>Xin chào ${userName},</h1>
      <p>Cảm ơn bạn đã đặt lịch tư vấn với chuyên gia ${expertName} của B!teology.</p>
      <h2>Chi tiết cuộc hẹn:</h2>
      <ul>
        <li><strong>Chuyên gia:</strong> ${expertName}</li>
        <li><strong>Ngày:</strong> ${date}</li>
        <li><strong>Giờ:</strong> ${time}</li>
        <li><strong>Lý do tư vấn:</strong> ${reason}</li>
      </ul>
      <p>Chuyên gia sẽ liên hệ với bạn sớm để xác nhận lịch hẹn. Nếu bạn cần thay đổi lịch hẹn, vui lòng liên hệ với chúng tôi.</p>
      <p>Trân trọng,<br>Đội ngũ B!teology</p>
    `;

    await supabaseClient.functions.invoke("send-email", {
      body: {
        to: user.email,
        subject: userEmailSubject,
        html: userEmailContent,
        from: "Biteology <no-reply@biteology.com>"
      }
    });

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
