import { MongoClient } from 'mongodb'

// Configuración de la base de datos
const config = {
  uri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017",
  dbName: process.env.DB_NAME || "webScraping",
  options: {
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  }
}

// Cliente MongoDB
let client = null
let db = null

// Conexión a la base de datos
export const connectDB = async () => {
  try {
    if (!client) {
      client = new MongoClient(config.uri, config.options)
      await client.connect()
      db = client.db(config.dbName)
      console.log(`✅ Conectado a MongoDB: ${config.dbName}`)
    }
    return db
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error)
    throw error
  }
}

// Cerrar conexión
export const closeDB = async () => {
  try {
    if (client) {
      await client.close()
      client = null
      db = null
      console.log('🔌 Conexión a MongoDB cerrada')
    }
  } catch (error) {
    console.error('❌ Error cerrando conexión MongoDB:', error)
  }
}

// Obtener la instancia de la base de datos
export const getDB = () => {
  if (!db) {
    throw new Error('Base de datos no conectada. Llama a connectDB() primero.')
  }
  return db
}

// Obtener una colección específica
export const getCollection = (collectionName) => {
  const database = getDB()
  return database.collection(collectionName)
}

// Modelos/Esquemas para las colecciones
export const Collections = {
  ANTECEDENTES_PENALES: 'antecedentesPenales',
  CERTIFICADOS_IESS: 'certificadosIESS',
  CITACIONES_ANT: 'citacionesANT',
  CITACIONES_JUDICIALES: 'citacionesJudiciales',
  CONSEJO_JUDICATURA: 'consejoJudicatura',
  DATOS_SRI: 'datosSRI',
  IMPEDIMENTOS_CARGOS_PUBLICOS: 'impedimentosCargosPublicos',
  PENSION_ALIMENTICIA: 'pensionAlimenticia',
  PROCESOS_JUDICIALES: 'procesosJudiciales',
  SENESCYT: 'senescyt',
  SRI_DEUDAS: 'sri_deudas'
}

// Funciones auxiliares para operaciones comunes
export const DatabaseOperations = {
  
  // Buscar un documento por cédula
  async findByCedula(collectionName, cedula) {
    const collection = getCollection(collectionName)
    return await collection.findOne({ cedula })
  },

  // Buscar un documento por RUC
  async findByRuc(collectionName, ruc) {
    const collection = getCollection(collectionName)
    return await collection.findOne({ ruc })
  },

  // Insertar un nuevo documento
  async insertOne(collectionName, document) {
    const collection = getCollection(collectionName)
    const documentWithTimestamp = {
      ...document,
      fechaCreacion: new Date(),
      fechaActualizacion: new Date()
    }
    return await collection.insertOne(documentWithTimestamp)
  },

  // Actualizar un documento existente
  async updateOne(collectionName, filter, update) {
    const collection = getCollection(collectionName)
    const updateWithTimestamp = {
      ...update,
      $set: {
        ...update.$set,
        fechaActualizacion: new Date()
      }
    }
    return await collection.updateOne(filter, updateWithTimestamp)
  },

  // Buscar o crear un documento (upsert)
  async upsert(collectionName, filter, document) {
    const collection = getCollection(collectionName)
    const documentWithTimestamp = {
      ...document,
      fechaActualizacion: new Date()
    }
    
    return await collection.updateOne(
      filter,
      { 
        $set: documentWithTimestamp,
        $setOnInsert: { fechaCreacion: new Date() }
      },
      { upsert: true }
    )
  },

  // Agregar elementos a un array sin duplicados
  async addToArrayNoDuplicates(collectionName, filter, arrayField, newItems, uniqueFields = []) {
    const collection = getCollection(collectionName)
    
    // Si no hay campos únicos especificados, agregar directamente
    if (uniqueFields.length === 0) {
      return await collection.updateOne(
        filter,
        { 
          $push: { [arrayField]: { $each: newItems } },
          $set: { fechaActualizacion: new Date() }
        }
      )
    }

    // Verificar duplicados basados en campos únicos
    const existingDoc = await collection.findOne(filter)
    if (!existingDoc || !existingDoc[arrayField]) {
      return await collection.updateOne(
        filter,
        { 
          $set: { 
            [arrayField]: newItems,
            fechaActualizacion: new Date()
          }
        },
        { upsert: true }
      )
    }

    const existingItems = existingDoc[arrayField] || []
    const itemsToAdd = newItems.filter(newItem => 
      !existingItems.some(existingItem => 
        uniqueFields.every(field => 
          existingItem[field] === newItem[field]
        )
      )
    )

    if (itemsToAdd.length > 0) {
      return await collection.updateOne(
        filter,
        { 
          $push: { [arrayField]: { $each: itemsToAdd } },
          $set: { fechaActualizacion: new Date() }
        }
      )
    }

    return { matchedCount: 1, modifiedCount: 0 } // No se agregó nada nuevo
  },

  // Obtener estadísticas de una colección
  async getStats(collectionName) {
    const collection = getCollection(collectionName)
    const stats = await collection.stats()
    const count = await collection.countDocuments()
    
    return {
      collectionName,
      documentCount: count,
      storageSize: stats.storageSize,
      avgObjSize: stats.avgObjSize,
      indexCount: stats.nindexes
    }
  },

  // Crear índices para optimizar consultas
  async createIndexes() {
    try {
      // Índices para consultas por cédula
      const cedulaCollections = [
        Collections.ANTECEDENTES_PENALES,
        Collections.CERTIFICADOS_IESS,
        Collections.CITACIONES_ANT,
        Collections.CITACIONES_JUDICIALES,
        Collections.PENSION_ALIMENTICIA,
        Collections.PROCESOS_JUDICIALES,
        Collections.SENESCYT
      ]

      for (const collectionName of cedulaCollections) {
        const collection = getCollection(collectionName)
        await collection.createIndex({ cedula: 1 }, { unique: true })
        await collection.createIndex({ fechaActualizacion: -1 })
      }

      // Índice para RUC en datos SRI
      const sriCollection = getCollection(Collections.DATOS_SRI)
      await sriCollection.createIndex({ ruc: 1 }, { unique: true })
      await sriCollection.createIndex({ fechaActualizacion: -1 })

      // Índice para impedimentos (no requiere cédula)
      const impedimentosCollection = getCollection(Collections.IMPEDIMENTOS_CARGOS_PUBLICOS)
      await impedimentosCollection.createIndex({ tipo: 1 }, { unique: true })
      await impedimentosCollection.createIndex({ fechaActualizacion: -1 })

      // Índice para consejo de judicatura
      const consejoCollection = getCollection(Collections.CONSEJO_JUDICATURA)
      await consejoCollection.createIndex({ tipo: 1 })
      await consejoCollection.createIndex({ fechaActualizacion: -1 })

      console.log('✅ Índices de base de datos creados exitosamente')
    } catch (error) {
      console.error('❌ Error creando índices:', error)
    }
  },

  // Limpiar datos antiguos (opcional)
  async cleanOldData(collectionName, daysOld = 30) {
    const collection = getCollection(collectionName)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    const result = await collection.deleteMany({
      fechaActualizacion: { $lt: cutoffDate }
    })

    console.log(`🧹 Eliminados ${result.deletedCount} documentos antiguos de ${collectionName}`)
    return result
  }
}

// Funciones específicas para cada tipo de datos
export const AntecedentesPenalesModel = {
  async save(cedula, antecedentes) {
    return await DatabaseOperations.upsert(
      Collections.ANTECEDENTES_PENALES,
      { cedula },
      { cedula, antecedentes }
    )
  },

  async findByCedula(cedula) {
    return await DatabaseOperations.findByCedula(Collections.ANTECEDENTES_PENALES, cedula)
  }
}

export const PensionAlimenticiaModel = {
  async save(cedula, pensiones) {
    return await DatabaseOperations.addToArrayNoDuplicates(
      Collections.PENSION_ALIMENTICIA,
      { cedula },
      'pensiones',
      pensiones,
      ['codigo', 'numProcesoJudicial']
    )
  },

  async findByCedula(cedula) {
    return await DatabaseOperations.findByCedula(Collections.PENSION_ALIMENTICIA, cedula)
  }
}

export const SRIModel = {
  async save(ruc, datosContribuyente, establecimientos) {
    const collection = getCollection(Collections.DATOS_SRI)
    const existingDoc = await collection.findOne({ ruc })

    if (!existingDoc) {
      return await DatabaseOperations.insertOne(Collections.DATOS_SRI, {
        ruc,
        datosContribuyente,
        establecimientos
      })
    }

    // Actualizar datos del contribuyente si han cambiado
    let updateOperations = {}
    if (JSON.stringify(existingDoc.datosContribuyente) !== JSON.stringify(datosContribuyente)) {
      updateOperations.datosContribuyente = datosContribuyente
    }

    // Agregar nuevos establecimientos
    const result = await DatabaseOperations.addToArrayNoDuplicates(
      Collections.DATOS_SRI,
      { ruc },
      'establecimientos',
      establecimientos,
      ['numEstablecimiento', 'nombre', 'ubicacion']
    )

    // Actualizar datos del contribuyente si es necesario
    if (Object.keys(updateOperations).length > 0) {
      await DatabaseOperations.updateOne(
        Collections.DATOS_SRI,
        { ruc },
        { $set: updateOperations }
      )
    }

    return result
  },

  async findByRuc(ruc) {
    return await DatabaseOperations.findByRuc(Collections.DATOS_SRI, ruc)
  }
}

// Inicialización automática de la base de datos
export const initializeDatabase = async () => {
  try {
    await connectDB()
    await DatabaseOperations.createIndexes()
    console.log('🚀 Base de datos inicializada correctamente')
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error)
    throw error
  }
}

// Manejo de cierre graceful
process.on('SIGINT', async () => {
  console.log('\n🛑 Cerrando aplicación...')
  await closeDB()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\n🛑 Cerrando aplicación...')
  await closeDB()
  process.exit(0)
})
