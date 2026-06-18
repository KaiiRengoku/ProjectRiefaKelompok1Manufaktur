import { createMiddleware } from 'hono/factory'
import { supabaseAdmin } from '../lib/supabase.js'

export type AuthEnv = {
  Variables: {
    userId: string
    userRole: string
  }
}

export const authMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
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
})