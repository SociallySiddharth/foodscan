import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nvcpaguiekqbijgybdct.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Ensure we have a valid Supabase client
if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test the connection
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    console.log('Supabase connection successful:', data)
    return true
  } catch (error) {
    console.error('Supabase connection error:', error)
    return false
  }
}
