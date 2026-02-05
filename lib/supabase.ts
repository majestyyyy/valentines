import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Singleton instance to avoid multiple client warnings
let supabaseInstance: SupabaseClient<Database> | null = null
let supabaseAdminInstance: SupabaseClient<Database> | null = null

export const supabase = supabaseInstance || (supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'sb-auth-token',
  }
}))

// Admin client with service_role key for bypassing RLS
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
export const supabaseAdmin = supabaseAdminInstance || (supabaseAdminInstance = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
}))

