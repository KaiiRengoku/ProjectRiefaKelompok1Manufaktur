import { Hono } from 'hono'
import { z } from 'zod'
import { supabaseAdmin } from '../lib/supabase.js'

const auth = new Hono()

async function requireAuth(c: any, next: any) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  const token = authHeader.slice(7)
  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data.user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  c.set('userId', data.user.id)
  c.set('userRole', data.user.app_metadata?.role ?? 'pengrajin')
  await next()
}

function mapUser(u: any) {
  return {
    id: u.id,
    username: u.username,
    name: u.name,
    role: u.role,
    active: u.active ?? true,
    avatar: u.avatar ?? null,
    capacity: u.capacity ?? 0,
    specializations: u.specializations ?? [],
  }
}

auth.post('/login', async (c) => {
  const { username, password } = await c.req.json() as any
  if (!username || !password) {
    return c.json({ error: 'Username dan password harus diisi' }, 400)
  }

  const email = `${username.trim().toLowerCase()}@prodify.local`

  const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  })

  if (authError || !authData.session) {
    return c.json({ error: 'Username atau Password salah!' }, 401)
  }

  const { data: userData } = await supabaseAdmin
    .from('users_app')
    .select('*')
    .eq('username', username.trim().toLowerCase())
    .single()

  if (!userData || userData.active === false) {
    return c.json({ error: 'Akun tidak aktif atau tidak ditemukan' }, 403)
  }

  return c.json({
    token: authData.session.access_token,
    refreshToken: authData.session.refresh_token,
    user: mapUser(userData),
  })
})

auth.post('/register', requireAuth, async (c) => {
  const body = await c.req.json() as any
  const { username, password, name, role, specializations, capacity } = body

  if (!username || !password) {
    return c.json({ error: 'Username dan password harus diisi' }, 400)
  }
  if (password.length < 3) {
    return c.json({ error: 'Password minimal 3 karakter' }, 400)
  }

  const finalUsername = username.trim().toLowerCase()
  const email = `${finalUsername}@prodify.local`

  const { data: existingUser } = await supabaseAdmin
    .from('users_app')
    .select('username')
    .eq('username', finalUsername)
    .maybeSingle()

  if (existingUser) {
    return c.json({ error: 'Username sudah terdaftar' }, 409)
  }

  const { data: { users: authUsers }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
  if (listError) return c.json({ error: 'Gagal memeriksa user auth' }, 500)

  const staleAuthUser = authUsers?.find((u: any) => u.email === email)

  if (staleAuthUser) {
    const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(staleAuthUser.id)
    if (delErr) {
      return c.json({ error: 'Username sudah terdaftar' }, 409)
    }
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username: finalUsername, role: role || 'pengrajin' },
  })

  if (authError) {
    return c.json({ error: 'Gagal mendaftarkan user: ' + authError.message }, 500)
  }

  const newUser = {
    id: authData.user?.id ?? '',
    username: finalUsername,
    password: password,
    name: name || finalUsername,
    role: role || 'pengrajin',
    active: true,
    avatar: null,
    capacity: capacity ?? 0,
    specializations: specializations ?? [],
  }

  const { error: dbError } = await supabaseAdmin.from('users_app').insert(newUser)
  if (dbError) {
    await supabaseAdmin.auth.admin.deleteUser(authData.user!.id)
    return c.json({ error: 'Gagal menyimpan user ke database: ' + dbError.message }, 500)
  }

  return c.json({ ok: true, user: { ...newUser } })
})

auth.post('/change-password', requireAuth, async (c) => {
  const body = await c.req.json() as any
  const { userId, password } = body

  if (!userId || !password) {
    return c.json({ error: 'User ID dan password harus diisi' }, 400)
  }

  if (password.length < 3) {
    return c.json({ error: 'Password minimal 3 karakter' }, 400)
  }

  const { data: userData } = await supabaseAdmin
    .from('users_app')
    .select('username')
    .eq('id', userId)
    .single()

  if (!userData) {
    return c.json({ error: 'User tidak ditemukan di database' }, 404)
  }

  const email = `${userData.username.trim().toLowerCase()}@prodify.local`

  const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
  if (listError) return c.json({ error: 'Gagal mencari user auth' }, 500)

  const authUser = users?.find((u: any) => u.email === email)

  if (authUser) {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, { password })
    if (error) return c.json({ error: 'Gagal mengubah password: ' + error.message }, 500)
  } else {
    const { error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username: userData.username },
    })
    if (createError) return c.json({ error: 'Gagal membuat user auth: ' + createError.message }, 500)
  }

  return c.json({ ok: true })
})

auth.post('/unregister', requireAuth, async (c) => {
  const { id } = await c.req.json() as any
  if (!id) return c.json({ error: 'User ID harus diisi' }, 400)

  await supabaseAdmin.from('point_entries').delete().eq('user_id', id)
  await supabaseAdmin.from('subtasks').update({ assigned_to: null }).eq('assigned_to', id)

  let authDeleted = false
  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id)
    if (error && error.status !== 404) {
      console.warn('Gagal menghapus user auth:', error.message)
    } else {
      authDeleted = true
    }
  } catch (e: any) {
    console.warn('Gagal menghapus user auth (bukan UUID):', e.message)
  }

  await supabaseAdmin.from('users_app').delete().eq('id', id)

  if (!authDeleted) {
    console.warn('User auth mungkin masih ada, tetapi users_app sudah dihapus')
  }

  return c.json({ ok: true })
})

export { auth }
