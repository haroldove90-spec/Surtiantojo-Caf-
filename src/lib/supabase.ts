import { createClient } from '@supabase/supabase-js';

const rawUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://kwumqqselehgrbppuoyu.supabase.co';
const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3dW1xcXNlbGVoZ3JicHB1b3l1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMzM2MzksImV4cCI6MjA5NjYwOTYzOX0.LqXwIXQn2J7ku5c31kWHZsEp_zcEEHqUbWP8biU0pp8';

// Clean standard rest/v1 suffixes from the URL if present for compatibility
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '');

export const supabase = createClient(supabaseUrl, supabaseKey);
