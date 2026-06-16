CREATE TABLE public.categories (
  id text PRIMARY KEY,
  name text UNIQUE NOT NULL
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_all_select" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories_all_insert" ON public.categories FOR INSERT WITH CHECK (true);
CREATE POLICY "categories_all_update" ON public.categories FOR UPDATE USING (true);
CREATE POLICY "categories_all_delete" ON public.categories FOR DELETE USING (true);

INSERT INTO public.categories (id, name) VALUES
  ('cat_Boneka', 'Boneka'),
  ('cat_Tas', 'Tas'),
  ('cat_Gantungan_Kunci', 'Gantungan Kunci'),
  ('cat_Aksesoris', 'Aksesoris');
