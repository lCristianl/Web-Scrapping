import { chromium } from "playwright"
import { MongoClient } from "mongodb"

// Parámetros de conexión
const uri = "mongodb://localhost:27017"
const dbName = "webScraping"
const collectionName = "senescyt"

// Datos simulados
const cedula = "1102961867"

export const obtenerDatos = async (cedula) => {
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()

  await page.goto("https://www.senescyt.gob.ec/consulta-titulos-web/faces/vista/consulta/consulta.xhtml", {
    waitUntil: "domcontentloaded"
  })

  try {

    await page.type("#formPrincipal\\:identificacion", cedula) 

    //Espera hasta que aparezca la tabla en la pagina (Cuando ya se muestra la tabla se cierra la ventana)
    await page.waitForSelector("tbody[id$='tablaAplicaciones_data']", { timeout: 60000 })

    //Recorro las filas de la tabla y obtengo los datos
    const resultados = await page.$$eval("tbody[id$='tablaAplicaciones_data'] tr", (filas) => {
      return filas.map((fila) => {
        const columnas = fila.querySelectorAll("td")
        return {
          titulo: columnas[0]?.innerText.trim(),
          institucion: columnas[1]?.innerText.trim(),
          tipo: columnas[2]?.innerText.trim(),
          fechaRegistro: columnas[5]?.innerText.trim(),
          area: columnas[6]?.innerText.trim(),
        }
      })
    })

    console.log("\nTítulos encontrados:")
    console.log(resultados)

    if (resultados.length !== 0) {
      // Conectar con MongoDB
      const client = new MongoClient(uri)
      await client.connect()
      const db = client.db(dbName)
      const collection = db.collection(collectionName)

      // Buscar por cédula
      const existente = await collection.findOne({ cedula })

      if (!existente) {
        // No existe: insertar directamente
        await collection.insertOne({ cedula, titulos: resultados })
        console.log(`✅ Datos guardados correctamente para la cédula ${cedula}`)
      } else {
        const titulosActuales = existente.titulos || []
        const titulosAGuardar = []

        for (const nuevo of resultados) {
          const yaExiste = titulosActuales.some(t =>
            t.titulo === nuevo.titulo &&
            t.institucion === nuevo.institucion &&
            t.fechaRegistro === nuevo.fechaRegistro
          )

          if (!yaExiste) {
            titulosAGuardar.push(nuevo)
          }
        }

        if (titulosAGuardar.length > 0) {
          // Agrega los nuevos títulos al array existente
          await collection.updateOne(
            { cedula },
            { $push: { titulos: { $each: titulosAGuardar } } }
          )
          console.log(`✅ Se agregaron ${titulosAGuardar.length} nuevo(s) título(s) para la cédula ${cedula}`)
        } else {
          console.log(`⚠️ Ya extisten los datos en la base de datos para la cédula ${cedula}`)
        }
      }

      await client.close()
    } else {
      console.log("❌ No se encontraron resultados.")
    }
    
  } catch (error) {
    console.error("\n❌ No se encontraron resultados. Verifica que los datos ingresados fueron correctos.")
  } finally {
    await browser.close()
    process.exit(0) 
  }
}

obtenerDatos(cedula)