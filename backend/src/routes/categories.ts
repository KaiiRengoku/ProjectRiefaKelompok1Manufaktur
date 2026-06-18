import { Hono } from 'hono'
import { supabaseAdmin } from '../lib/supabase.js'
import { authMiddleware, type AuthEnv } from '../middleware/auth.js'

const categories = new Hono<AuthEnv>()
categories.use('/*', authMiddleware)

const newId = (prefix: string) => `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`

categories.get('/', async (c) => {
  const { data } = await supabaseAdmin.from('categories').select('*').order('name', { ascending: true })
  return c.json({ categories: data ?? [] })
})

categories.post('/', async (c) => {
  const { name } = await c.req.json() as any
  const cleaned = (name ?? '').trim()
  if (!cleaned) return c.json({ error: 'Nama kategori tidak boleh kosong' }, 400)
  if (cleaned.length > 100) return c.json({ error: 'Nama kategori maksimal 100 karakter' }, 400)
  const { data: existing } = await supabaseAdmin.from('categories')
    .select('id').ilike('name', cleaned).maybeSingle()
  if (existing) return c.json({ error: 'Nama kategori sudah terdaftar' }, 409)
  const id = newId('cat')
  const { error } = await supabaseAdmin.from('categories').insert({ id, name: cleaned })
  if (error) return c.json({ error: 'Gagal menyimpan kategori' }, 500)
  return c.json({ category: { id, name: cleaned } })
})

categories.put('/:id', async (c) => {
  const id = c.req.param('id')
  const { name } = await c.req.json() as any
  const cleaned = (name ?? '').trim()
  if (!cleaned) return c.json({ error: 'Nama kategori tidak boleh kosong' }, 400)
  const { data: original } = await supabaseAdmin.from('categories').select('name').eq('id', id).single()
  if (original && original.name.toLowerCase() !== cleaned.toLowerCase()) {
    const { data: dup } = await supabaseAdmin.from('categories').select('id').ilike('name', cleaned).maybeSingle()
    if (dup) return c.json({ error: 'Nama kategori sudah digunakan' }, 409)
  }
  const { error } = await supabaseAdmin.from('categories').update({ name: cleaned }).eq('id', id)
  if (error) return c.json({ error: 'Gagal memperbarui kategori' }, 500)
  return c.json({ ok: true })
})

categories.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const { error } = await supabaseAdmin.from('categories').delete().eq('id', id)
  if (error) return c.json({ error: 'Gagal menghapus kategori' }, 500)
  return c.json({ ok: true })
})

export { categories }
