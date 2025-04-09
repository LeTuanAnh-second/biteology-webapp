
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ijvtkufzaweqzwczpvgr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqdnRrdWZ6YXdlcXp3Y3pwdmdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyMDgwNTQsImV4cCI6MjA1NTc4NDA1NH0.8gM3geZe6RvOIUTOcTfwxDTmD1r78rZVHVovxYCr7Wg';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storage: localStorage,
    flowType: 'pkce',
  },
});
