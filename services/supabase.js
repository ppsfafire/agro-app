import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jqrjcnxwdsrojflxtiii.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impxcmpjbnh3ZHNyb2pmbHh0aWlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwOTcwMjEsImV4cCI6MjA2NjY3MzAyMX0.wXxAc1aVH_xF3rbhbGXo2bOy2M5jmmXQnZgEyLcb50U';

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 