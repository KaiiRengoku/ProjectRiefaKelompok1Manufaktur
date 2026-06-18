ALTER TABLE public.orders ADD COLUMN is_online boolean NOT NULL DEFAULT true;

UPDATE public.orders SET is_online = false WHERE source = 'Offline';
