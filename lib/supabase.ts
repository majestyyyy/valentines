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
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'sb-auth-token',
  }
}))

// CRITICAL SECURITY FIX: Service role key should NEVER be used in client-side code!
// Admin operations should be moved to server-side API routes.
// Removing supabaseAdmin client from client-side code.
// 
// If you need admin operations:
// 1. Create API routes in app/api/admin/
// 2. Use service role key ONLY in server-side code
// 3. Implement proper authentication checks
//
// Example: app/api/admin/users/route.ts
// import { createClient } from '@supabase/supabase-js'
// const supabaseAdmin = createClient(
//   process.env.SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_ROLE_KEY!  // No NEXT_PUBLIC_ prefix!
// )

