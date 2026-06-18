import { Hono } from 'hono'
import { supabaseAdmin } from '../lib/supabase.js'
import { authMiddleware, type AuthEnv } from '../middleware/auth.js'

const skills = new Hono<AuthEnv>()
skills.use('/*', authMiddleware)

skills.get('/', async (c) => {
  const { data } = await supabaseAdmin.from('master_skills').select('id, name').order('name', { ascending: true })
  return c.json({ skills: data ?? [] })
})

skills.post('/', async (c) => {
  const { name } = await c.req.json() as any
  const cleaned = (name ?? '').trim()
  if (!cleaned) return c.json({ error: 'Nama skill tidak boleh kosong' }, 400)
  const { data: existing } = await supabaseAdmin.from('master_skills').select('id').ilike('name', cleaned).maybeSingle()
  if (existing) return c.json({ error: 'Nama skill sudah terdaftar' }, 409)
  const { data, error } = await supabaseAdmin.from('master_skills').insert({ name: cleaned }).select('id, name').single()
  if (error) return c.json({ error: 'Gagal menyimpan skill' }, 500)
  return c.json({ skill: data })
})

skills.put('/:id', async (c) => {
  const id = c.req.param('id')
  const { name } = await c.req.json() as any
  const cleaned = (name ?? '').trim()
  if (!cleaned) return c.json({ error: 'Nama skill tidak boleh kosong' }, 400)
  const { data: original } = await supabaseAdmin.from('master_skills').select('name').eq('id', id).single()
  if (original && original.name.toLowerCase() !== cleaned.toLowerCase()) {
    const { data: dup } = await supabaseAdmin.from('master_skills').select('id').ilike('name', cleaned).maybeSingle()
    if (dup) return c.json({ error: 'Nama skill sudah digunakan' }, 409)
  }
  const { error } = await supabaseAdmin.from('master_skills').update({ name: cleaned }).eq('id', id)
  if (error) return c.json({ error: 'Gagal memperbarui skill' }, 500)
  return c.json({ ok: true })
})

skills.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const { error } = await supabaseAdmin.from('master_skills').delete().eq('id', id)
  if (error) return c.json({ error: 'Gagal menghapus skill' }, 500)
  return c.json({ ok: true })
})

export { skills }