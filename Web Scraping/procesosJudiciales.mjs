import { chromium } from "playwright"
import { MongoClient } from "mongodb"

// Parámetros de conexión
const uri = "mongodb://localhost:27017"
const dbName = "webScraping"
const collectionName = "procesosJudiciales"

//DATOS SIMULADOS
const cedula = "1150334017"
const tipoConsulta = "actor" // Puede ser "actor/ofendido" o "demandado/procesado"

export const obtenerProcesos = async (cedula, tipoConsulta) => {
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()
  try {
    await page.goto("https://procesosjudiciales.funcionjudicial.gob.ec/busqueda-filtros", {
      waitUntil: "domcontentloaded"
    })

    //Si el tipo de consulta es por el número de cedula del actor o del ofendido
    if (["actor", "ofendido"].includes(tipoConsulta.toLowerCase())) {
      // Rellenamos el campo de cédula
      await page.type('input[formcontrolname="cedulaActor"]', cedula)    
      // Se le da click al botón de buscar
      await page.waitForSelector('.boton-buscar:not([disabled])', { timeout: 5000 })
      await page.click('.boton-buscar')
      
      // Espera hasta que aparezca la primera etiqueta que tiene la clase cuerpo o la que tiene la clase mat-mdc-simple-snack-bar
      const estado = await Promise.race([
        page.waitForSelector('.mat-mdc-simple-snack-bar.ng-star-inserted', { timeout: 60000 }).then(() => 'no_resultados'),
        page.waitForSelector('.cuerpo', { timeout: 60000 }).then(() => 'ok'),
      ])

      //Si se ecnontró la etiqueta que tiene la clase mat-mdc-simple-snack-bar PRIMERO (No se encontraron resultados)
      if (estado === 'no_resultados') {
        console.log(`ℹ️ No hay procesos judiciales registrados para la cédula ${cedula} como ${tipoConsulta}`)
      } else {
        await extraerDatos(page) //Funcion para extraer los datos de la página
      }
      //Si el tipo de consulta es por el número de cedula del demandado o procesado
    } else if (["demandado", "procesado"].includes(tipoConsulta.toLowerCase())) {
      // Rellenamos el campo de cédula
      await page.fill('input[formcontrolname="cedulaDemandado"]', cedula)
      // Se le da click al botón de buscar
      await page.waitForSelector('.boton-buscar:not([disabled])', { timeout: 5000 })
      await page.click('.boton-buscar')

      // Espera hasta que aparezca la primera etiqueta que tiene la clase cuerpo o la que tiene la clase mat-mdc-simple-snack-bar
      const estado = await Promise.race([
        page.waitForSelector('.mat-mdc-simple-snack-bar.ng-star-inserted', { timeout: 60000 }).then(() => 'no_resultados'),
        page.waitForSelector('.cuerpo', { timeout: 60000 }).then(() => 'ok'),
      ])

      //Si se ecnontró la etiqueta que tiene la clase mat-mdc-simple-snack-bar PRIMERO (No se encontraron resultados)
      if (estado === 'no_resultados') {
        console.log(`ℹ️ No hay procesos judiciales registrados para la cédula ${cedula} como ${tipoConsulta}`)
      } else {
        await extraerDatos(page) //Funcion para extraer los datos de la página
      }

    } else {
      throw new Error("Tipo de consulta no válido. Debe ser 'actor/ofendido' o 'demandado/procesado'.")
    }
    
    await browser.close()

  } catch (error) {
    console.error("\n❌ Error:", error.message)
  } finally{
    await browser.close()
    process.exit(0) 
  }
}

async function extraerDatos(page) {
  let resultados = []
  try {
      //Recorro los elementos que tiene la clase causa-individual y obtengo los datos
      resultados = await page.$$eval(".causa-individual", (elementos) => {
          return elementos.map((el) => {
              return {
                  id: el.querySelector(".id")?.innerText.trim() || "",
                  fecha: el.querySelector(".fecha")?.innerText.trim() || "",
                  numeroProceso: el.querySelector(".numero-proceso")?.innerText.trim() || "",
                  accionInfraccion: el.querySelector(".accion-infraccion")?.innerText.trim() || ""
              }
          })
      })

      console.log("\nRegistros encontrados:")
      console.log(resultados)

    //============GUADAR DATOS EN MONGODB==============
    if (resultados.length !== 0) {
      // Conectar a MongoDB y guardar
      const client = new MongoClient(uri)
      await client.connect()
      const db = client.db(dbName)
      const collection = db.collection(collectionName)

      const doc = await collection.findOne({ cedula })
      const campo = tipoConsulta.toLowerCase()

      if (!doc) {
        // Nuevo documento
        await collection.insertOne({ cedula, [campo]: resultados })
        console.log(`✅ Se insertaron ${resultados.length} procesos nuevos para ${campo}.`)
      } else {
        const existentes = doc[campo] || []
        const nuevos = resultados.filter(n =>
          !existentes.some(e => e.numeroProceso === n.numeroProceso)
        )

        if (nuevos.length > 0) {
          await collection.updateOne(
            { cedula },
            { $push: { [campo]: { $each: nuevos } } }
          )
          console.log(`✅ Se agregaron ${nuevos.length} nuevos procesos a la cedula: ${cedula}.`)
        } else {
          console.log(`⚠️ Ya extisten los datos en la base de datos para la cédula ${cedula}`)
        }
      }
      await client.close()
    }

  } catch (error) {
    console.error("\n❌ No se encontraron resultados. Verifica que los datos ingresados fueron correctos.", error.message)
  }
}

// Llamada a la función con el número de cédula
obtenerProcesos(cedula, tipoConsulta).catch(console.error)