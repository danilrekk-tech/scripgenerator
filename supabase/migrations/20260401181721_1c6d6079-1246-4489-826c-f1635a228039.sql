CREATE TABLE public.user_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data_type text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX idx_user_data_unique ON public.user_data(user_id, data_type);
ALTER TABLE public.user_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own data" ON public.user_data FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own data" ON public.user_data FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own data" ON public.user_data FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own data" ON public.user_data FOR DELETE TO authenticated USING (auth.uid() = user_id);