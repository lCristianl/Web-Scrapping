import { chromium } from "playwright"
import Tesseract from 'tesseract.js'
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { MongoClient } from "mongodb"

// Parámetros de conexión
const uri = "mongodb://localhost:27017"
const dbName = "webScraping"
const collectionName = "senescyt"

// Datos simulados
const cedula = "1150334017" //"1102961867"

// Crear directorio para archivos de Tesseract
const tesseractDir = "./Tesseract"
if (!fs.existsSync(tesseractDir)) {
  fs.mkdirSync(tesseractDir, { recursive: true })
}

export const obtenerDatos = async (cedula) => {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  try {
    await page.goto("https://www.senescyt.gob.ec/consulta-titulos-web/faces/vista/consulta/consulta.xhtml", {
      waitUntil: "domcontentloaded"
    })

    let estado = ""
    while (true) {
      // Esperar a que cargue el captcha
      await page.waitForSelector('img[src*="Captcha.jpg"]');
    
      // Definir rutas de archivos dentro de la carpeta tesseract
      const captchaPath = path.join(tesseractDir, 'captcha.png')
      const processedPath = path.join(tesseractDir, 'captcha_processed.png')
      
      // Capturar el captcha en una imagen
      const captchaElement = await page.$('img[src*="Captcha.jpg"]');
      await captchaElement.screenshot({ path: captchaPath });
    
      // Preprocesar la imagen con sharp
      await sharp(captchaPath)
        .normalize()
        .grayscale()                  // convierte a blanco y negro
        .modulate({ brightness: 2, contrast: 1.5 })  // mejora visibilidad de caracteres
        .sharpen()  // resalta bordes   
        .threshold(50)           
        .resize(400, 100)                // agrandar si es muy pequeño
        .toFile(processedPath);
    
      // OCR con Tesseract - especificar la carpeta para los archivos de entrenamiento
      const { data: { text } } = await Tesseract.recognize(processedPath, 'eng', {
        cachePath: tesseractDir,  // Los archivos .traineddata se guardarán aquí
        langPath: tesseractDir    // Buscar archivos de idioma en esta carpeta
      });
    
      const captchaText = text.trim();
      
      // Limpiar campos antes de escribir (por si hay contenido previo)
      await page.fill("#formPrincipal\\:identificacion", "")
      await page.fill("#formPrincipal\\:captchaSellerInput", "")
      
      // Rellenamos el campo de cédula
      await page.type("#formPrincipal\\:identificacion", cedula) 
      // Rellenamos el campo de captcha
      await page.type("#formPrincipal\\:captchaSellerInput", captchaText) 
      //Se le da click al botón de buscar
      await page.click("#formPrincipal\\:boton-buscar")
      //Espera 2 segundos para que carge de nuevo la pagina
      await page.waitForTimeout(2000)
      
      // Espera hasta que aparezca la primera etiqueta que aparezca
      estado = await Promise.race([
        page.waitForSelector('.msg-rojo', { timeout: 60000 }).then(() => 'no_resultados'),
        page.waitForSelector("tbody[id$='tablaAplicaciones_data']", { timeout: 60000 }).then(() => 'ok'),
        page.waitForSelector(".ui-messages-error.ui-corner-all", { timeout: 60000 }).then(() => 'captcha_incorrecto'),
      ])

      if (estado === 'no_resultados') {
        console.log(`ℹ️ No hay títulos registrados para la cédula ${cedula}`)
        break
      } else if (estado === 'ok') {
        console.log(`✅ Captcha correcto, procesando resultados...`)
        break
      } else if (estado === 'captcha_incorrecto') {
        console.log(`❌ Captcha incorrecto, intentando de nuevo...`)
        // El bucle continuará para intentar con un nuevo captcha
      }
    }

    let resultados = []
    if (estado === 'ok') {
      //Recorro las filas de la tabla y obtengo los datos
      resultados = await page.$$eval("tbody[id$='tablaAplicaciones_data'] tr", (filas) => {
        return filas.map((fila) => {
          const columnas = fila.querySelectorAll("td")
          return {
            titulo: columnas[0]?.innerText.trim() || "",
            institucion: columnas[1]?.innerText.trim() || "",
            tipo: columnas[2]?.innerText.trim() || "",
            fechaRegistro: columnas[5]?.innerText.trim() || "",
            area: columnas[6]?.innerText.trim() || "",
          }
        })
      })

      console.log("\nTítulos encontrados:")
      console.log(resultados)
    }

    if (resultados.length > 0) {
      // Conectar con MongoDB
      const client = new MongoClient(uri)
      await client.connect()
      const db = client.db(dbName)
      const collection = db.collection(collectionName)

      // Buscar por cédula
      const existente = await collection.findOne({ cedula })

      if (!existente) {
        // No existe: insertar directamente
        await collection.insertOne({ 
          cedula, 
          fechaActualizacion: new Date(),
          titulos: resultados 
        })
        console.log(`✅ Se guardaron ${resultados.length} títulos para la cédula ${cedula}`)
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
            { 
              $push: { titulos: { $each: titulosAGuardar } },
              $set: { fechaActualizacion: new Date() }
            }
          )
          console.log(`✅ Se agregaron ${titulosAGuardar.length} nuevo(s) título(s) para la cédula ${cedula}`)
        } else {
          console.log(`⚠️ Ya existen todos los datos en la base de datos para la cédula ${cedula}`)
        }
      }

      await client.close()
    }
    
  } catch (error) {
    console.error("\n❌ Error: ", error.message)
  } finally {
    await browser.close()
    
    // Limpiar archivos temporales de captcha (opcional)
    try {
      const captchaPath = path.join(tesseractDir, 'captcha.png')
      const processedPath = path.join(tesseractDir, 'captcha_processed.png')
      
      if (fs.existsSync(captchaPath)) {
        fs.unlinkSync(captchaPath)
      }
      if (fs.existsSync(processedPath)) {
        fs.unlinkSync(processedPath)
      }
    } catch (err) {
      // Si no se pueden eliminar, no es crítico
    }
  }
}

obtenerDatos(cedula)