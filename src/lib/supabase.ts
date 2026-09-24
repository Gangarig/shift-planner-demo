import { createClient } from '@supabase/supabase-js'
const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()
export const configured = Boolean(url && /^https?:\/\//.test(url) && key)
// The setup screen prevents requests until the app is configured.
export const supabase = createClient(
  configured ? url! : 'https://configuration-required.invalid',
  key || 'configuration-required',
)
