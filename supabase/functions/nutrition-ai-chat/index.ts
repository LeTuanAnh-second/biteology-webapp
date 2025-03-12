
// Follow this setup guide to integrate the Deno runtime and the Edge library:
// https://supabase.com/docs/guides/functions/getting-started

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Create a Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const openAIApiKey = Deno.env.get('OPENAI_API_KEY') ?? ''
const supabase = createClient(supabaseUrl, supabaseKey)

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  try {
    // Get request body
    const { message, userId } = await req.json()
    console.log(`Processing nutrition chat request for user ${userId}`)

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Validate user is premium
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('is_premium')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return new Response(JSON.stringify({ error: 'Error verifying premium status' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!profileData.is_premium) {
      return new Response(JSON.stringify({ error: 'Premium subscription required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!openAIApiKey) {
      console.error('OpenAI API key is missing')
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Call OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `
              Bạn là một chuyên gia dinh dưỡng AI của ứng dụng B!teology, chuyên cung cấp lời khuyên dinh dưỡng cá nhân hóa.
              
              Nguyên tắc khi trả lời:
              1. Luôn đưa ra lời khuyên dựa trên khoa học và sự thật.
              2. Trả lời bằng tiếng Việt, thân thiện và dễ hiểu.
              3. Không đưa ra lời khuyên y tế mà chỉ tập trung vào dinh dưỡng.
              4. Khi người dùng hỏi về chế độ ăn cho bệnh lý cụ thể, nhắc họ tham khảo ý kiến bác sĩ.
              5. Khuyến khích lối sống lành mạnh, đặc biệt là chế độ ăn cân bằng và đa dạng.
            `
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('OpenAI API error:', errorData)
      throw new Error('Failed to get response from AI service')
    }

    const data = await response.json()
    const answer = data.choices[0].message.content

    // Log chat for analysis
    await supabase
      .from('nutrition_chat_logs')
      .insert({
        user_id: userId,
        user_message: message,
        ai_response: answer
      })
      .select()

    return new Response(JSON.stringify({ answer }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error in nutrition-ai-chat function:', error)
    return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
