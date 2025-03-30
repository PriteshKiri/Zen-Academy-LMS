import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type User = {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
}

export type Module = {
  id: string
  title: string
}

export type Chapter = {
  id: string
  title: string
  module_id: string
  youtube_link: string
  status: 'draft' | 'live'
}