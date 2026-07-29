import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bmsdsjcwnicjhdszmddw.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_QU4kfA4v87ZyvK8kLngQtA_3fCXihNf';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
