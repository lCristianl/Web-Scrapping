import express from 'express'
import cors from 'cors'
import { initializeDatabase } from './Models/database.js'
import apiRoutes from './Routes/api.js'

// ============================================
// POLYFILL PARA DOCKER - APIs del navegador
// ============================================
import { JSDOM } from 'jsdom'

// Configurar el entorno DOM global para pdfjs-dist
const { window } = new JSDOM('<!DOCTYPE html><html><body></body></html>')
global.window = window
global.document = window.document
global.navigator = window.navigator

// Polyfill para DOMMatrix (requerido por pdfjs-dist)
global.DOMMatrix = window.DOMMatrix || class DOMMatrix {
  constructor(init) {
    // Valores por defecto para matriz identidad
    this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0
    
    if (init) {
      if (typeof init === 'string') {
        this.parseTransform(init)
      } else if (Array.isArray(init) && init.length >= 6) {
        [this.a, this.b, this.c, this.d, this.e, this.f] = init
      }
    }
  }
  
  parseTransform(transform) {
    const match = transform.match(/matrix\((.*?)\)/)
    if (match) {
      const values = match[1].split(',').map(v => parseFloat(v.trim()))
      if (values.length >= 6) {
        [this.a, this.b, this.c, this.d, this.e, this.f] = values
      }
    }
  }
  
  multiply(other) {
    const result = new DOMMatrix()
    result.a = this.a * other.a + this.c * other.b
    result.b = this.b * other.a + this.d * other.b
    result.c = this.a * other.c + this.c * other.d
    result.d = this.b * other.c + this.d * other.d
    result.e = this.a * other.e + this.c * other.f + this.e
    result.f = this.b * other.e + this.d * other.f + this.f
    return result
  }
  
  scale(scaleX, scaleY = scaleX) {
    return this.multiply(new DOMMatrix([scaleX, 0, 0, scaleY, 0, 0]))
  }
  
  translate(tx, ty = 0) {
    return this.multiply(new DOMMatrix([1, 0, 0, 1, tx, ty]))
  }
}

// Otros polyfills que podría necesitar pdfjs-dist
global.btoa = (str) => Buffer.from(str, 'binary').toString('base64')
global.atob = (str) => Buffer.from(str, 'base64').toString('binary')

console.log('✅ Polyfills para Docker configurados correctamente')

// ============================================
// CONFIGURACIÓN DE EXPRESS
// ============================================
const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use('/api', apiRoutes)

// Inicializar base de datos y servidor
async function startServer() {
  try {
    console.log('🔄 Conectando a la base de datos...')
    await initializeDatabase()
    
    app.listen(PORT, () => {
      console.log(`🚀 Servidor backend ejecutándose en http://localhost:${PORT}`)
      console.log(`📄 API Health: http://localhost:${PORT}/api/health`)
      console.log(`💾 Base de datos conectada correctamente`)
    })
  } catch (error) {
    console.error('❌ Error al inicializar el servidor:', error)
    process.exit(1)
  }
}

startServer()