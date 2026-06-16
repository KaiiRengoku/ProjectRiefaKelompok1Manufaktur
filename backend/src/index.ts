import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { auth } from './routes/auth.js'
import { products } from './routes/products.js'
import { orders } from './routes/orders.js'
import { skills } from './routes/skills.js'
import { categories } from './routes/categories.js'
import { locations } from './routes/locations.js'
import { users } from './routes/users.js'

const app = new Hono()

app.use('/*', cors({
  origin: ['http://localhost:8080', 'http://localhost:5173', 'http://127.0.0.1:8080'],
  credentials: true,
}))

app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

app.route('/api/auth', auth)
app.route('/api/products', products)
app.route('/api/orders', orders)
app.route('/api/skills', skills)
app.route('/api/categories', categories)
app.route('/api/locations', locations)
app.route('/api/users', users)

const PORT = parseInt(process.env.PORT ?? '3001', 10)

serve({
  fetch: app.fetch,
  port: PORT,
})

console.log(`🚀 Prodify backend running on http://localhost:${PORT}`)
