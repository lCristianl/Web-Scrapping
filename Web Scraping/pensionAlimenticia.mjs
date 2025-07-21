import { chromium } from "playwright"
import { MongoClient } from "mongodb"

// Parámetros de conexión
const uri = "mongodb://localhost:27017"
const dbName = "webScraping"
const collectionName = "pensionAlimenticia"

//DATOS SIMULADOS
const cedula = "1102961867"

export const obtenerPensiones = async (cedula) => {

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  await page.goto("https://supa.funcionjudicial.gob.ec/pensiones/publico/consulta.jsf", {
    waitUntil: "domcontentloaded"
  })

  try {
    // Rellenamos el campo de cédula
    await page.type("#form\\:t_texto_cedula", cedula) 

    //Espera hasta que se le de click al botón de buscar (Cuando se le da click se cierra la ventana)
    await page.click("#form\\:b_buscar_cedula")

    //Espera 2 segundos para que se cargue la tabla de pensiones alimenticias
    await page.waitForTimeout(2000)

    //Recorro las filas de la tabla y obtengo los datos
    const resultados = await page.$$eval("#form\\:j_idt57_data > tr", (filas) => {
        return filas.map((fila) => {
          const todasColumnas = Array.from(fila.querySelectorAll("td"))
          
          // Verificar si es el mensaje de "No se encuentra resultados"
          if (todasColumnas[0]?.innerText.trim() === "No se encuentra resultados.") {
            return {
              codigo: "No se encuentra resultados.",
              numProcesoJudicial: "",
              dependenciaJurisdiccional: "",
              tipoPension: "",
              intervinientes: {},
            }
          }

          // Tabla anidada de intervinientes dentro de la columna 4
          const tablaAnidada = todasColumnas[4]?.querySelector("table");
          let intervinientes = {};

          if (tablaAnidada) {
            const filasAnidadas = tablaAnidada.querySelectorAll("tr");

            const fila0 = filasAnidadas[0]?.querySelectorAll("td") || [];
            const fila3 = filasAnidadas[3]?.querySelectorAll("td") || [];
            intervinientes = {
              RepresentanteLegal: fila0[1]?.innerText.trim() || "",
              obligadoPrincipal: fila3[1]?.innerText.trim() || ""
            };
          }

        return {
            codigo: todasColumnas[0]?.innerText.trim(),
            numProcesoJudicial: todasColumnas[1]?.innerText.trim(),
            dependenciaJurisdiccional: todasColumnas[2]?.innerText.trim(),
            tipoPension: todasColumnas[3]?.innerText.trim(),
            intervinientes: intervinientes,
        }
      })
    })

    console.log("\nPensiones encontradas:")
    console.log(resultados)

    if (resultados[0].codigo === "No se encuentra resultados.") {
      console.log(`ℹ️ No se encontraron pensiones alimenticias para la cédula ${cedula}.`)
      return
    } else {
      // Conectar a MongoDB
      const client = new MongoClient(uri)
      await client.connect()
      const db = client.db(dbName)
      const collection = db.collection(collectionName)

      // Verificar si ya existen registros para esta cédula
      const doc = await collection.findOne({ cedula })

      if (!doc) {
        // Insertar nuevo documento
        await collection.insertOne({ cedula, pensiones: resultados })
        console.log(`✅ Se guardaron ${resultados.length} pensiones nuevas en la base de datos.`)
      } else {
        // Evitar duplicados
        const existentes = doc.pensiones || []
        const nuevos = resultados.filter(n =>
          !existentes.some(e => e.codigo === n.codigo && e.numProcesoJudicial === n.numProcesoJudicial)
        )

        if (nuevos.length > 0) {
          await collection.updateOne(
            { cedula },
            { $push: { pensiones: { $each: nuevos } } }
          )
          console.log(`✅ Se agregaron ${nuevos.length} nuevas pensiones a la cédula: ${cedula}.`)
        } else {
          console.log(`⚠️ Ya existen los datos en la base para la cédula ${cedula}.`)
        }
      }

      await client.close()
    }

  } catch (error) {
    console.error("\n❌ Error: ", error)
  } finally {
    await browser.close()
    process.exit(0)
  }
}

obtenerPensiones(cedula)