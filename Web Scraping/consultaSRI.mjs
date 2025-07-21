import { chromium } from "playwright"
import { MongoClient } from "mongodb"

// Parámetros de conexión
const uri = "mongodb://localhost:27017"
const dbName = "webScraping"
const collectionName = "datosSRI"

// Datos simulados
const ruc = "1713449831001" 

export const obtenerDatosRuc = async (ruc) => {
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()

  await page.goto("https://srienlinea.sri.gob.ec/sri-en-linea/SriRucWeb/ConsultaRuc/Consultas/consultaRuc", {
    waitUntil: "domcontentloaded"
  })

  try {
    // Rellenamos el campo de RUC
    await page.type('input[formcontrolname="inputRuc"]', ruc)
    // Se le da click al botón de buscar
    await page.click('.ui-button.ui-widget.ui-state-default.ui-corner-all.ui-button-text-only.cyan-btn')
    
    //Espera hasta que aparaezca la etiqueta que tiene la clase row
    await page.waitForSelector("sri-mostrar-contribuyente", { timeout: 60000 })
    await page.click(".ui-button.cyan-btn.ui-widget.ui-state-default.ui-corner-all.ui-button-text-only")
    await page.waitForSelector("sri-listar-establecimientos", { timeout: 60000 })

    // Se extraen los datos del RUC
    const estado = await page.$$eval("sri-mostrar-contribuyente", (elementos) => {
        return elementos.map((el) => {
          const estadoSpan = el.querySelector(".col-sm-8.alineacion-texto-centro.titulo-consultas-1.tamano-defecto-campos.alinear-izquierda.ng-star-inserted span")
          const tds = el.querySelectorAll(".col-sm-12.centrar-texto-tabla td")

            return {
                  estado: estadoSpan?.innerText.trim() || "",
                  tipoContribuyente: tds[0]?.innerText.trim() || "",
                  regimen: tds[1]?.innerText.trim() || "",
            }
        })
    })

    // Se extraen los datos de los establecimientos registrados
    const establecimientos = await page.$$eval(".ui-datatable-data.ui-widget-content tr", (filas) => {
        return filas.map((fila) => {
              const columnas = fila.querySelectorAll("td")
              return {
                  numEstablecimiento: columnas[0]?.innerText.trim() || "",
                  nombre: columnas[1]?.innerText.trim() || "",
                  ubicacion: columnas[2]?.innerText.trim() || "",
                  estado: columnas[3]?.innerText.trim() || "",
              }
          })
      })

    console.log("\nRegistros encontrados:")
    console.log(estado)
    console.log("\nEstablecimientos encontrados:")
    console.log(establecimientos)

    // Verificar si se encontraron datos
    if (estado.length === 0 && establecimientos.length === 0) {
      console.log(`ℹ️ No se encontraron datos para el RUC ${ruc}.`)
      return
    } else {
      // Conectar a MongoDB
      const client = new MongoClient(uri)
      await client.connect()
      const db = client.db(dbName)
      const collection = db.collection(collectionName)

      // Verificar si ya existen registros para este RUC
      const doc = await collection.findOne({ ruc })

      if (!doc) {
        // Insertar nuevo documento
        await collection.insertOne({ 
          ruc, 
          fechaActualizacion: new Date(),
          datosContribuyente: estado[0] || {},
          establecimientos: establecimientos 
        })
        console.log(`✅ Se guardaron los datos del RUC ${ruc} en la base de datos.`)
        console.log(`   - Datos del contribuyente: ${estado.length > 0 ? 'Guardado' : 'No encontrado'}`)
        console.log(`   - Establecimientos: ${establecimientos.length} guardados`)
      } else {
        let actualizaciones = {}
        let cambios = false

        // Verificar cambios en datos del contribuyente
        const datosActuales = estado[0] || {}
        const datosExistentes = doc.datosContribuyente || {}
        
        if (JSON.stringify(datosActuales) !== JSON.stringify(datosExistentes)) {
          actualizaciones.datosContribuyente = datosActuales
          cambios = true
        }

        // Verificar nuevos establecimientos
        const establecimientosExistentes = doc.establecimientos || []
        const nuevosEstablecimientos = establecimientos.filter(nuevo =>
          !establecimientosExistentes.some(existente => 
            existente.numEstablecimiento === nuevo.numEstablecimiento &&
            existente.nombre === nuevo.nombre &&
            existente.ubicacion === nuevo.ubicacion &&
            existente.estado === nuevo.estado
          )
        )

        if (nuevosEstablecimientos.length > 0) {
          // Agregar solo los nuevos establecimientos
          await collection.updateOne(
            { ruc },
            { 
              $push: { establecimientos: { $each: nuevosEstablecimientos } },
              $set: { fechaActualizacion: new Date() }
            }
          )
          cambios = true
          console.log(`✅ Se agregaron ${nuevosEstablecimientos.length} nuevos establecimientos al RUC ${ruc}.`)
        }

        // Actualizar datos del contribuyente si cambiaron
        if (actualizaciones.datosContribuyente) {
          await collection.updateOne(
            { ruc },
            { 
              $set: { 
                datosContribuyente: actualizaciones.datosContribuyente,
                fechaActualizacion: new Date()
              }
            }
          )
          console.log(`✅ Se actualizaron los datos del contribuyente para el RUC ${ruc}.`)
        }

        if (!cambios) {
          console.log(`⚠️ Ya existen todos los datos guardados para el RUC ${ruc}.`)
        }
      }

      await client.close()
    }

  } catch (error) {
    console.error("\n❌ Error: ", error)
  } finally {
    await browser.close()
  }
}

obtenerDatosRuc(ruc)