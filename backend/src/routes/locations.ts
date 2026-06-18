import { Hono } from 'hono'
import { supabaseAdmin } from '../lib/supabase.js'
import { authMiddleware, type AuthEnv } from '../middleware/auth.js'

const locations = new Hono<AuthEnv>()
locations.use('/*', authMiddleware)

const newId = (prefix: string) => `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`

locations.get('/', async (c) => {
  const { data } = await supabaseAdmin.from('locations').select('*').order('name', { ascending: true })
  return c.json({ locations: data ?? [] })
})

locations.post('/', async (c) => {
  const { name } = await c.req.json() as any
  const cleaned = (name ?? '').trim()
  if (!cleaned) return c.json({ error: 'Nama toko tidak boleh kosong' }, 400)
  if (cleaned.length > 100) return c.json({ error: 'Nama toko maksimal 100 karakter' }, 400)
  const { data: existing } = await supabaseAdmin.from('locations')
    .select('id').ilike('name', cleaned).maybeSingle()
  if (existing) return c.json({ error: 'Nama toko sudah ada di database' }, 409)
  const id = newId('loc')
  const { error } = await supabaseAdmin.from('locations').insert({ id, name: cleaned })
  if (error) return c.json({ error: 'Gagal menyimpan toko baru' }, 500)
  return c.json({ location: { id, name: cleaned } })
})

locations.put('/:id', async (c) => {
  const id = c.req.param('id')
  const { name } = await c.req.json() as any
  const cleaned = (name ?? '').trim()
  if (!cleaned) return c.json({ error: 'Nama toko tidak boleh kosong' }, 400)
  if (cleaned.length > 100) return c.json({ error: 'Nama toko maksimal 100 karakter' }, 400)

  const { data: location } = await supabaseAdmin.from('locations').select('id').eq('id', id).maybeSingle()
  if (!location) return c.json({ error: 'Toko tidak ditemukan' }, 404)

  const { data: duplicate } = await supabaseAdmin.from('locations')
    .select('id').ilike('name', cleaned).neq('id', id).maybeSingle()
  if (duplicate) return c.json({ error: 'Nama toko sudah ada di database' }, 409)

  const { error } = await supabaseAdmin.from('locations').update({ name: cleaned }).eq('id', id)
  if (error) return c.json({ error: 'Gagal memperbarui nama toko' }, 500)
  return c.json({ location: { id, name: cleaned } })
})

locations.delete('/:id', async (c) => {
  const id = c.req.param('id')
  await supabaseAdmin.from('product_stocks').delete().eq('location_id', id)
  const { error } = await supabaseAdmin.from('locations').delete().eq('id', id)
  if (error) return c.json({ error: 'Gagal menghapus toko' }, 500)
  return c.json({ ok: true })
})

export { locations }
