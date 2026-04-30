import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsForm from './SettingsForm'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: firm } = await supabase.from('firms').select('*').eq('user_id', user.id).single()
  if (!firm) redirect('/login')
  return <SettingsForm firm={firm} email={user.email || ''} />
}
