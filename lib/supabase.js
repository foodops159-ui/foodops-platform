import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nhuxvfaxcfqlitkenewz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5odXh2ZmF4Y2ZxbGl0a2VuZXd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2NjUyMzYsImV4cCI6MjA5NTI0MTIzNn0._AOYBpppVP-R-TAyab8wnNYFrcWYj5oMaEncvVstBQk'

export const supabase = createClient(supabaseUrl, supabaseKey)

export async function getRestaurantId() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('restaurant_users')
    .select('restaurant_id')
    .eq('user_id', user.id)
    .single()
  return data?.restaurant_id || null
}

export async function fetchData(table) {
  const restaurantId = await getRestaurantId()
  if (!restaurantId) return []
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false })
  if (error) return []
  return data || []
}

export async function saveData(table, record) {
  const restaurantId = await getRestaurantId()
  if (!restaurantId) throw new Error('No restaurant')
  const { data, error } = await supabase
    .from(table)
    .upsert({ ...record, restaurant_id: restaurantId })
    .select()
    .single()
  if (error) throw error
  return data
}
