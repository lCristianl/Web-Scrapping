import { chromium } from "playwright"
import Tesseract from 'tesseract.js'
// import sharp from 'sharp' // Comentado temporalmente
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { DatabaseOperations, Collections } from '../Models/database.js'

// Obtener directorio actual para ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Crear directorio para archivos de Tesseract (relativo al backend)
const tesseractDir = path.join(__dirname, "..", "Utils", "Tesseract")
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
    let resultados = []
    let intentosCaptcha = 0
    const maxIntentos = 10 // Limitar intentos para evitar bucles infinitos
    
    while (intentosCaptcha < maxIntentos) {
      intentosCaptcha++
      console.log(`🔄 Intento ${intentosCaptcha}/${maxIntentos} de resolver captcha`)
      
      // Esperar a que cargue el captcha
      await page.waitForSelector('img[src*="Captcha.jpg"]');
    
      // Definir rutas de archivos dentro de la carpeta tesseract
      const captchaPath = path.join(tesseractDir, 'captcha.png')
      const processedPath = path.join(tesseractDir, 'captcha_processed.png')
      
      // Capturar el captcha en una imagen
      const captchaElement = await page.$('img[src*="Captcha.jpg"]');
      await captchaElement.screenshot({ path: captchaPath });
    
      // Usar la imagen directamente sin preprocesamiento (Sharp comentado temporalmente)
      // await sharp(captchaPath)
      //   .normalize()
      //   .grayscale()
      //   .modulate({ brightness: 2, contrast: 1.5 })
      //   .sharpen()
      //   .threshold(50)
      //   .resize(400, 100)
      //   .toFile(processedPath);
    
      // OCR con Tesseract usando la imagen original
      const { data: { text } } = await Tesseract.recognize(captchaPath, 'eng', {
        cachePath: tesseractDir,
        langPath: tesseractDir,
        logger: m => console.log(`🔍 Tesseract: ${m.status} - ${m.progress}`)
      });
    
      const captchaText = text.trim();
      console.log(`🔎 Captcha detectado: ${captchaText}`)
      
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

    // Si se alcanzó el máximo de intentos sin éxito
    if (intentosCaptcha >= maxIntentos && estado !== 'ok' && estado !== 'no_resultados') {
      console.log(`⚠️ Se alcanzó el máximo de ${maxIntentos} intentos para resolver el captcha`)
      estado = 'captcha_fallido'
    }

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

      console.log(`✅ Se encontraron ${resultados.length} títulos para la cédula ${cedula}`)
    }

    // Guardar en base de datos usando el modelo
    if (resultados.length > 0) {
      await DatabaseOperations.addToArrayNoDuplicates(
        Collections.SENESCYT,
        { cedula },
        'titulos',
        resultados,
        ['titulo', 'institucion', 'fechaRegistro']
      )
      console.log(`💾 Datos guardados en base de datos para la cédula ${cedula}`)
    }

    // Retornar datos para el controller
    return {
      cedula,
      titulos: resultados,
      totalTitulos: resultados.length,
      fechaConsulta: new Date(),
      estado: estado === 'ok' ? 'exitoso' : 
              estado === 'no_resultados' ? 'sin_datos' : 
              estado === 'captcha_fallido' ? 'captcha_no_resuelto' : 'error',
      intentosCaptcha: intentosCaptcha
    }
    
  } catch (error) {
    console.error("\n❌ Error en obtenerDatos:", error.message)
    throw new Error(`Error al consultar SENESCYT: ${error.message}`)
  } finally {
    await browser.close()
    
    // Limpiar archivos temporales de captcha
    try {
      const captchaPath = path.join(tesseractDir, 'captcha.png')
      // const processedPath = path.join(tesseractDir, 'captcha_processed.png') // Comentado temporalmente
      
      if (fs.existsSync(captchaPath)) {
        fs.unlinkSync(captchaPath)
      }
      // if (fs.existsSync(processedPath)) {
      //   fs.unlinkSync(processedPath)
      // }
    } catch (err) {
      console.warn('⚠️ No se pudieron limpiar archivos temporales:', err.message)
    }
  }
}