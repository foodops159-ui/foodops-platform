-- ══════════════════════════════════════════════════
-- Food Ops Next.js — Supabase Tables
-- شغّل هذا في: Supabase → SQL Editor
-- ══════════════════════════════════════════════════

-- ① المطاعم
CREATE TABLE IF NOT EXISTS restaurants (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  type          text DEFAULT 'مطعم',
  is_active     boolean DEFAULT true,
  plan          text DEFAULT 'monthly',
  plan_expires  date,
  created_at    timestamptz DEFAULT now()
);

-- ② ربط المستخدمين بالمطاعم
CREATE TABLE IF NOT EXISTS restaurant_users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  role          text DEFAULT 'staff',
  created_at    timestamptz DEFAULT now(),
  UNIQUE(user_id, restaurant_id)
);

-- ③ طلبات الاشتراك
CREATE TABLE IF NOT EXISTS signup_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid,
  email           text,
  restaurant_name text,
  restaurant_type text,
  status          text DEFAULT 'pending',
  created_at      timestamptz DEFAULT now()
);

-- ④ الإيرادات
CREATE TABLE IF NOT EXISTS revenues (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  date          date NOT NULL DEFAULT CURRENT_DATE,
  shift         text,
  cash          numeric DEFAULT 0,
  pos           numeric DEFAULT 0,
  app           numeric DEFAULT 0,
  total         numeric DEFAULT 0,
  customers     int DEFAULT 0,
  note          text,
  created_at    timestamptz DEFAULT now()
);

-- ⑤ المصروفات
CREATE TABLE IF NOT EXISTS expenses (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  date          date NOT NULL DEFAULT CURRENT_DATE,
  cat           text,
  vendor        text,
  amount        numeric DEFAULT 0,
  note          text,
  created_at    timestamptz DEFAULT now()
);

-- ⑥ الموظفون
CREATE TABLE IF NOT EXISTS employees (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  name          text NOT NULL,
  title         text,
  email         text,
  phone         text,
  salary        numeric DEFAULT 0,
  is_active     boolean DEFAULT true,
  created_at    timestamptz DEFAULT now()
);

-- ⑦ المستودع
CREATE TABLE IF NOT EXISTS wms_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  name          text NOT NULL,
  unit          text DEFAULT 'وحدة',
  stock         numeric DEFAULT 0,
  min_stock     numeric DEFAULT 5,
  cost          numeric DEFAULT 0,
  barcode       text,
  is_active     boolean DEFAULT true,
  created_at    timestamptz DEFAULT now()
);

-- ⑧ الحضور
CREATE TABLE IF NOT EXISTS attendance (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  employee_id   uuid REFERENCES employees(id),
  emp_name      text,
  date          date NOT NULL DEFAULT CURRENT_DATE,
  status        text DEFAULT 'حاضر',
  time_in       time,
  time_out      time,
  created_at    timestamptz DEFAULT now()
);

-- ══════════════════════════════════════════════════
-- Row Level Security
-- ══════════════════════════════════════════════════
ALTER TABLE restaurants      ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE signup_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenues         ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses         ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees        ENABLE ROW LEVEL SECURITY;
ALTER TABLE wms_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance       ENABLE ROW LEVEL SECURITY;

-- السماح للمستخدم بقراءة بيانات مطعمه فقط
CREATE POLICY "own_restaurant" ON revenues
  FOR ALL USING (
    restaurant_id IN (
      SELECT restaurant_id FROM restaurant_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "own_restaurant" ON expenses
  FOR ALL USING (
    restaurant_id IN (
      SELECT restaurant_id FROM restaurant_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "own_restaurant" ON employees
  FOR ALL USING (
    restaurant_id IN (
      SELECT restaurant_id FROM restaurant_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "own_restaurant" ON wms_items
  FOR ALL USING (
    restaurant_id IN (
      SELECT restaurant_id FROM restaurant_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "own_restaurant" ON attendance
  FOR ALL USING (
    restaurant_id IN (
      SELECT restaurant_id FROM restaurant_users WHERE user_id = auth.uid()
    )
  );

-- restaurant_users — المستخدم يرى سجله فقط
CREATE POLICY "own_record" ON restaurant_users
  FOR ALL USING (user_id = auth.uid());

-- restaurants — المستخدم يرى مطعمه فقط
CREATE POLICY "own_restaurant_info" ON restaurants
  FOR SELECT USING (
    id IN (SELECT restaurant_id FROM restaurant_users WHERE user_id = auth.uid())
  );

-- signup_requests — مفتوح للإدراج
CREATE POLICY "insert_request" ON signup_requests
  FOR INSERT WITH CHECK (true);
CREATE POLICY "read_own_request" ON signup_requests
  FOR SELECT USING (user_id = auth.uid());

-- ══════════════════════════════════════════════════
-- Indexes
-- ══════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_rev_rest ON revenues(restaurant_id, date);
CREATE INDEX IF NOT EXISTS idx_exp_rest ON expenses(restaurant_id, date);
CREATE INDEX IF NOT EXISTS idx_emp_rest ON employees(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_wms_rest ON wms_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_ru_user  ON restaurant_users(user_id);
