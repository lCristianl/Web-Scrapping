import { chromium } from "playwright"
import { MongoClient } from "mongodb"

// Parámetros de conexión
const uri = "mongodb://localhost:27017"
const dbName = "webScraping"
const collectionName = "citacionesJudiciales"

const cedula = "1101160032"

export const obtenerCitacionesJudiciales = async (cedula) => {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  await page.goto("https://consultas.funcionjudicial.gob.ec/informacionjudicial/public/informacionCitaciones.jsf", {
    waitUntil: "domcontentloaded"
  })

  try {
    // Rellenamos el campo de cedula
    await page.type("#form1\\:txtDemandadoCedula", cedula)

    let noResultados = false
    while(true) {
      // Se le da click al botón de buscar
      await page.click("#form1\\:butBuscarJuicios")
      await page.waitForTimeout(1000)

      // Verificar el estado de los resultados
      const estadoResultados = await page.$$eval("#form1\\:dataTableJuicios2_data tr", (filas) => {
        if (filas.length === 0) {
          return { tipo: 'sin_filas', columnas: 0 }
        }

        const primeraFila = filas[0]
        const columnas = primeraFila.querySelectorAll("td")
        
        // Verificar si es el mensaje de "No se encuentran resultados"
        if (columnas.length > 0 && columnas[0]?.innerText.trim() === "No se encuentran resultados.") {
          return { tipo: 'no_resultados', columnas: columnas.length }
        }
        
        // Si hay más de 1 columna, significa que hay resultados
        if (columnas.length > 1) {
          return { tipo: 'resultados_encontrados', columnas: columnas.length }
        }
        
        return { tipo: 'cargando', columnas: columnas.length }
      })

      if (estadoResultados.tipo === 'no_resultados') {
        console.log(`ℹ️ No se encontraron resultados para la cédula ${cedula}.`)
        noResultados = true
        break
      } else if (estadoResultados.tipo === 'resultados_encontrados') {
        console.log(`✅ Se encontraron resultados para la cédula ${cedula}.`)
        break
      } 
    }

    let resultados = []
    
    if (!noResultados) {
      //Recorro las filas de la tabla y obtengo los datos
      resultados = await page.$$eval("#form1\\:dataTableJuicios2_data tr", (filas) => {
        return filas.map((fila) => {
          const columnas = fila.querySelectorAll("td")
          
          // Solo procesar filas que no sean el mensaje de "No se encuentran resultados"
          if (columnas.length > 1 && columnas[0]?.innerText.trim() !== "No se encuentran resultados.") {
            return {
              provincia: columnas[0]?.innerText.trim() || '',
              canton: columnas[1]?.innerText.trim() || '',
              judicatura: columnas[2]?.innerText.trim() || '',
              numeroCausa: columnas[3]?.innerText.trim() || '',
              demandado: columnas[4]?.innerText.trim() || '',
              proceso: columnas[5]?.innerText.trim() || '', // Corregido: era columnas[5] duplicado
              fechaRazonCopias: columnas[6]?.innerText.trim() || '',
              fechaRazonEnvio: columnas[7]?.innerText.trim() || '',
              fechaBoletasRecibidas: columnas[8]?.innerText.trim() || '',
              fechaDevolucion: columnas[9]?.innerText.trim() || '',
              fechaAsignacionCitado: columnas[10]?.innerText.trim() || '',
              estado: columnas[11]?.innerText.trim() || '',
              fechaActaCitacion: columnas[12]?.innerText.trim() || '',
              tiposCitacion: columnas[13]?.innerText.trim() || '',
            }
          }
          return null // Para filas que no cumplen las condiciones
        }).filter(item => item !== null) // Filtrar elementos null
      })

      console.log("\nDatos Citación:")
      console.log(resultados)

      // Guardar en MongoDB si hay resultados
      if (resultados.length > 0) {
        const client = new MongoClient(uri)
        await client.connect()
        const db = client.db(dbName)
        const collection = db.collection(collectionName)

        // Verificar si ya existen registros para esta cédula
        const doc = await collection.findOne({ cedula })

        if (!doc) {
          // Insertar nuevo documento
          await collection.insertOne({ 
            cedula, 
            fechaActualizacion: new Date(),
            citaciones: resultados 
          })
          console.log(`✅ Se guardaron ${resultados.length} citaciones para la cédula ${cedula}`)
        } else {
          // Evitar duplicados
          const existentes = doc.citaciones || []
          const nuevas = resultados.filter(nueva =>
            !existentes.some(existente => 
              existente.numeroCausa === nueva.numeroCausa &&
              existente.judicatura === nueva.judicatura
            )
          )

          if (nuevas.length > 0) {
            await collection.updateOne(
              { cedula },
              { 
                $push: { citaciones: { $each: nuevas } },
                $set: { fechaActualizacion: new Date() }
              }
            )
            console.log(`✅ Se agregaron ${nuevas.length} nuevas citaciones para la cédula ${cedula}`)
          } else {
            console.log(`⚠️ Ya existen todas las citaciones para la cédula ${cedula}`)
          }
        }

        await client.close()
      }
    }

  } catch (error) {
    console.error("\n❌ Error:", error.message)
  } finally {
    await browser.close()
  }
}

obtenerCitacionesJudiciales(cedula)