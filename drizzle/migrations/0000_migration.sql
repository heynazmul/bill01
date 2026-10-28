CREATE TABLE public.house_settings (
  user_id uuid PRIMARY KEY,
  tenant_name text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  house_rent numeric(12,2) NOT NULL DEFAULT 0,
  gas_bill numeric(12,2) NOT NULL DEFAULT 0,
  electricity_rate numeric(10,4) NOT NULL DEFAULT 0,
  water_bill numeric(12,2) NOT NULL DEFAULT 0,
  other_charges numeric(12,2) NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.house_settings TO authenticated;
GRANT ALL ON public.house_settings TO service_role;
ALTER TABLE public.house_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own settings select" ON public.house_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own settings insert" ON public.house_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own settings update" ON public.house_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  bill_no serial,
  bill_year int NOT NULL CHECK (bill_year BETWEEN 2000 AND 2100),
  bill_month int NOT NULL CHECK (bill_month BETWEEN 1 AND 12),
  previous_reading numeric(12,2) NOT NULL CHECK (previous_reading >= 0),
  current_reading numeric(12,2) NOT NULL,
  units numeric(12,2) NOT NULL,
  electricity_rate numeric(10,4) NOT NULL,
  electricity_bill numeric(12,2) NOT NULL,
  house_rent numeric(12,2) NOT NULL DEFAULT 0,
  gas_bill numeric(12,2) NOT NULL DEFAULT 0,
  water_bill numeric(12,2) NOT NULL DEFAULT 0,
  other_charges numeric(12,2) NOT NULL DEFAULT 0,
  previous_due numeric(12,2) NOT NULL DEFAULT 0,
  discount numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL,
  amount_paid numeric(12,2) NOT NULL DEFAULT 0,
  due numeric(12,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reading_order CHECK (current_reading >= previous_reading),
  CONSTRAINT one_bill_per_month UNIQUE (user_id, bill_year, bill_month)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bills TO authenticated;
GRANT USAGE ON SEQUENCE public.bills_bill_no_seq TO authenticated;
GRANT ALL ON public.bills TO service_role;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own bills select" ON public.bills FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own bills insert" ON public.bills FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own bills update" ON public.bills FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own bills delete" ON public.bills FOR DELETE TO authenticated USING (auth.uid() = user_id);