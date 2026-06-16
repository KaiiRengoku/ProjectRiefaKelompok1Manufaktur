import { Hono } from 'hono'
import { z } from 'zod'
import { supabaseAdmin } from '../lib/supabase.js'
import { authMiddleware, type AuthEnv } from '../middleware/auth.js'

const products = new Hono<AuthEnv>()
products.use('/*', authMiddleware)

const newId = (prefix: string) => `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`

const productSchema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  type: z.string().optional(),
  image: z.string().optional(),
  basePrice: z.number().optional(),
  minStock: z.number().optional(),
  parts: z.array(z.object({ name: z.string(), point: z.number().optional() })).optional(),
})

products.get('/', async (c) => {
  const { data: productData } = await supabaseAdmin.from('products').select('*').order('name', { ascending: true })
  const { data: stockData } = await supabaseAdmin.from('product_stocks').select('*')
  const stocksByProduct: Record<string, any> = {}
  for (const s of stockData ?? []) {
    if (!stocksByProduct[s.product_id]) stocksByProduct[s.product_id] = {}
    stocksByProduct[s.product_id][s.location_id] = s.stock ?? 0
  }
  const result = (productData ?? []).map((p: any) => ({
    id: p.id, name: p.name, category: p.category ?? undefined, type: p.type ?? undefined,
    image: p.image ?? undefined, basePrice: p.base_price ?? undefined,
    minStock: p.min_stock ?? 0, parts: p.parts ?? [],
    stock: stocksByProduct[p.id] ?? {}, createdAt: p.created_at,
  }))
  return c.json({ products: result })
})

products.post('/', async (c) => {
  const body = await c.req.json()
  const parsed = productSchema.parse(body)
  const id = newId('p')
  const now = new Date().toISOString()
  const { error } = await supabaseAdmin.from('products').insert({
    id, name: parsed.name, category: parsed.category ?? null, type: parsed.type ?? null,
    image: parsed.image ?? null, base_price: parsed.basePrice ?? null,
    min_stock: parsed.minStock ?? 0, parts: parsed.parts ?? [],
    created_at: now, updated_at: now,
  })
  if (error) return c.json({ error: 'Gagal membuat produk: ' + error.message }, 500)

  const stock = body.stock ?? {}
  const stockEntries = Object.entries(stock).map(([locationId, qty]) => ({
    product_id: id,
    location_id: locationId,
    stock: Number(qty) || 0,
    created_at: now,
    updated_at: now
  }))
  if (stockEntries.length > 0) {
    const { error: insertErr } = await supabaseAdmin.from('product_stocks').insert(stockEntries)
    if (insertErr) {
      console.error('Error inserting stock entries in POST /api/products:', insertErr.message, insertErr.details)
    }
  }

  return c.json({ id })
})

products.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const parsed = productSchema.partial().parse(body)
  const now = new Date().toISOString()
  const dbPatch: Record<string, any> = { updated_at: now }
  if (parsed.name !== undefined) dbPatch.name = parsed.name
  if (parsed.category !== undefined) dbPatch.category = parsed.category ?? null
  if (parsed.type !== undefined) dbPatch.type = parsed.type ?? null
  if (parsed.image !== undefined) dbPatch.image = parsed.image ?? null
  if (parsed.basePrice !== undefined) dbPatch.base_price = parsed.basePrice ?? null
  if (parsed.minStock !== undefined) dbPatch.min_stock = parsed.minStock ?? 0
  if (parsed.parts !== undefined) dbPatch.parts = parsed.parts
  const { error } = await supabaseAdmin.from('products').update(dbPatch).eq('id', id)
  if (error) return c.json({ error: 'Gagal memperbarui produk: ' + error.message }, 500)

  const stock = body.stock ?? {}
  const stockEntries = Object.entries(stock).map(([locationId, qty]) => ({
    product_id: id,
    location_id: locationId,
    stock: Number(qty) || 0,
  }))
  for (const entry of stockEntries) {
    const { data: existing } = await supabaseAdmin.from('product_stocks')
      .select('id')
      .eq('product_id', entry.product_id)
      .eq('location_id', entry.location_id)
      .maybeSingle()
    if (existing) {
      await supabaseAdmin.from('product_stocks')
        .update({ stock: entry.stock, updated_at: now })
        .eq('id', existing.id)
    } else {
      const { error: insertErr } = await supabaseAdmin.from('product_stocks')
        .insert({
          product_id: entry.product_id,
          location_id: entry.location_id,
          stock: entry.stock,
          created_at: now,
          updated_at: now
        })
      if (insertErr) {
        console.error('Error inserting stock entry in PUT /api/products/:id:', insertErr.message, insertErr.details)
      }
    }
  }

  return c.json({ ok: true })
})

products.delete('/:id', async (c) => {
  const id = c.req.param('id')

  const { data: product } = await supabaseAdmin.from('products').select('id').eq('id', id).single()
  if (!product) return c.json({ error: 'Produk tidak ditemukan' }, 404)

  const { data: referencingOrders, count } = await supabaseAdmin
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', id)

  if (count && count > 0) {
    return c.json({ error: `Produk tidak bisa dihapus karena masih digunakan di ${count} pesanan` }, 400)
  }

  await supabaseAdmin.from('product_stocks').delete().eq('product_id', id)
  const { error } = await supabaseAdmin.from('products').delete().eq('id', id)
  if (error) return c.json({ error: 'Gagal menghapus produk' }, 500)
  return c.json({ ok: true })
})

export { products }
