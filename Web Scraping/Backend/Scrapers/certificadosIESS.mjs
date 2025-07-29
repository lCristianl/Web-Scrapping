import { chromium } from "playwright"
import fetch from "node-fetch"
import pdfParse from "pdf-parse"
import { MongoClient } from "mongodb"

// Parámetros de conexión
const uri = "mongodb://localhost:27017"
const dbName = "webScraping"
const collectionName = "certificadosIESS"

//DATOS SIMULADOS
const cedula = "1102961867"

export const obtenerDatos = async (cedula) => {
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()

  await page.goto("https://app.iess.gob.ec/gestion-empleador-certificado-web", {
    waitUntil: "domcontentloaded"
  })

  try {
    await page.waitForTimeout(1000)
    // Rellenamos el campo de cedula
    await page.type("#j_idt9\\:txtCedula", cedula)
    await page.waitForTimeout(1000)
    // Se le da click al botón de buscar
    await page.click("#j_idt9\\:btnIngresarLogin")

    // Espera hasta que aparezca la primera etiqueta
    const estado = await Promise.race([
        page.waitForSelector('.ui-messages-error-icon', { timeout: 60000 }).then(() => 'cedula_invalida'),
        page.waitForSelector('#dg_reporte', { timeout: 60000 }).then(() => 'ok'),
    ])

    if (estado === 'cedula_invalida') {
        console.log(`ℹ️ La cédula ${cedula} es inválida o no está registrada en el IESS.`)
        return
    }

    // Esperar a que cargue el iframe del PDF
    await page.waitForSelector("iframe#j_idt20", { timeout: 30000 })

    // Obtener la URL del PDF desde el atributo src del iframe
    const iframeSrc = await page.$eval("iframe#j_idt20", el => el.getAttribute("src"))

    // Obtener la parte del parámetro ?file= (que está url-encoded)
    const baseURL = "https://app.iess.gob.ec"
    const urlParams = new URLSearchParams(iframeSrc.split("?")[1])
    const encodedFilePath = urlParams.get("file")

    // Construir la URL completa al PDF
    const pdfURL = baseURL + decodeURIComponent(encodedFilePath)

    // Obtener las cookies de sesión para hacer la solicitud del PDF autenticada
    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join("; ")

    // Descargar el PDF con cookies incluidas
    const response = await fetch(pdfURL, {
      headers: {
        "Cookie": cookieHeader,
      }
    })
    const buffer = await response.buffer()

    // Leer el PDF
    const pdfData = await pdfParse(buffer)
    const texto = pdfData.text

    // Buscar si contiene la frase clave
    const nombreMatch = texto.match(/certifica que:\s+(.+?)\s+con cédula/)
    const nombre = nombreMatch ? nombreMatch[1].trim() : "El usuario"

    if (texto.includes("NO se encuentra registrado como empleador")) {
      console.log(`❌ ${nombre} no se encuentra registrado como empleador.`)
    } else {
      console.log(`✅ ${nombre} SÍ está registrado como empleador.`)
    }

    // // Guardar en MongoDB
    // const client = new MongoClient(uri)
    // await client.connect()
    // const db = client.db(dbName)
    // const collection = db.collection(collectionName)

    // // Verificar si ya existe el registro
    // const doc = await collection.findOne({ cedula })

    // const datosAGuardar = {
    //     cedula,
    //     nombre,
    //     estadoEmpleador,
    //     fechaConsulta: new Date(),
    //     textoCompleto: texto
    // }

    // if (!doc) {
    //     await collection.insertOne(datosAGuardar)
    //     console.log(`✅ Se guardó el certificado IESS para la cédula ${cedula}`)
    // } else {
    //     await collection.updateOne(
    //         { cedula },
    //         { $set: datosAGuardar }
    //     )
    //     console.log(`✅ Se actualizó el certificado IESS para la cédula ${cedula}`)
    // }

    // await client.close()

  } catch (error) {
    console.error("\n❌ Error:", error.message)
  } finally {
    await browser.close()
  }
}

obtenerDatos(cedula)