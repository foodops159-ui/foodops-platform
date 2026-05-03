import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// Get restaurant by slug
export async function getRestaurant(slug) {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()
  return { data, error }
}

// Get all employees for a restaurant
export async function getEmployees(restaurantId) {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('is_active', true)
    .order('name')
  return { data, error }
}

// Save revenue
export async function saveRevenue(restaurantId, record) {
  const { data, error } = await supabase
    .from('revenues')
    .insert({ ...record, restaurant_id: restaurantId })
  return { data, error }
}

// Save expense
export async function saveExpense(restaurantId, record) {
  const { data, error } = await supabase
    .from('expenses')
    .insert({ ...record, restaurant_id: restaurantId })
  return { data, error }
}

// Save attendance
export async function saveAttendance(restaurantId, record) {
  const { data, error } = await supabase
    .from('attendance')
    .upsert({
      ...record,
      restaurant_id: restaurantId
    }, { onConflict: 'restaurant_id,employee_id,date' })
  return { data, error }
}

// Get today's revenues
export async function getTodayRevenues(restaurantId) {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('revenues')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('date', today)
    .order('created_at', { ascending: false })
  return { data, error }
}

// Get today's expenses
export async function getTodayExpenses(restaurantId) {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('date', today)
    .order('created_at', { ascending: false })
  return { data, error }
}

// WMS
export async function getWMSItems(restaurantId) {
  const { data, error } = await supabase
    .from('wms_items')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('name')
  return { data, error }
}

export async function updateWMSItem(id, updates) {
  const { data, error } = await supabase
    .from('wms_items')
    .update(updates)
    .eq('id', id)
  return { data, error }
}

// Pay Orders
export async function getPayOrders(restaurantId) {
  const { data, error } = await supabase
    .from('pay_orders')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false })
  return { data, error }
}

// Employee Requests
export async function getEmpRequests(restaurantId) {
  const { data, error } = await supabase
    .from('emp_requests')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false })
  return { data, error }
}

// Supplier Accounts
export async function getSupplierAccounts(restaurantId) {
  const { data, error } = await supabase
    .from('supplier_accounts')
    .select('*, supplier_transactions(*)')
    .eq('restaurant_id', restaurantId)
    .order('name')
  return { data, error }
}
