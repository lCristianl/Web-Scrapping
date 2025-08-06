import { chromium } from "playwright"
import fetch from "node-fetch"
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs"
import { DatabaseOperations, Collections } from '../Models/database.js'

// Función auxiliar para extraer texto de PDF usando pdfjs-dist
async function extractTextFromPDF(buffer) {
  const data = new Uint8Array(buffer)
  const pdf = await pdfjs.getDocument({ data }).promise
  let fullText = ""
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const pageText = textContent.items.map(item => item.str).join(" ")
    fullText += pageText + " "
  }
  
  return fullText
}

export const obtenerDatosCertificadoIESS = async (cedula, fechaNacimiento) => {
  const browser = await chromium.launch({ headless: false})
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/115.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 720 }
  })
  const page = await context.newPage()

  try {
    await page.goto("https://app.iess.gob.ec/gestion-empleador-certificado-web", {
      waitUntil: "domcontentloaded"
    })
    await page.waitForTimeout(2000)
    // Rellenamos el campo de cedula
    await page.type("#j_idt9\\:txtCedula", cedula, { delay: 200 })
    await page.waitForTimeout(2000)
    
    // Hacer click repetidamente hasta obtener una respuesta
    let estado = null
    let intentos = 0
    const maxIntentos = 30 // Máximo 30 intentos (1 minuto)
    
    while (!estado && intentos < maxIntentos) {
      try {
        intentos++
        
        // Hacer click en el botón
        const boton = await page.$("#j_idt9\\:btnIngresarLogin")
        await boton.hover()
        await page.waitForTimeout(500)
        await boton.click()
        
        // Esperar 2 segundos
        await page.waitForTimeout(2000)
        
        // Verificar si aparece alguno de los resultados (con timeout corto)
        try {
          estado = await Promise.race([
            page.waitForSelector('.ui-messages-error-icon', { timeout: 3000 }).then(() => 'cedula_invalida'),
            page.waitForSelector('#j_idt9\\:calFechaNacimiento_input', { timeout: 3000 }).then(() => 'ingresar_fecha_nacimiento'),
            page.waitForSelector('#dg_reporte', { timeout: 3000 }).then(() => 'ok'),
          ])
          
          break // Salir del bucle si obtuvimos respuesta
          
        } catch (timeoutError) {
          // No apareció ningún resultado, continuar con el siguiente intento
          console.log(`continuando...`)
        }
        
      } catch (clickError) {
        console.log(`❌ Error en intento ${intentos}: ${clickError.message}`)
      }
    }
    
    if (!estado) {
      throw new Error(`No se obtuvo respuesta después de ${maxIntentos} intentos`)
    }

    if (estado === 'cedula_invalida') {
      console.log(`❌ La cédula ${cedula} es inválida o no está registrada en el IESS`)
      return {
        cedula,
        nombre: null,
        registradoComoEmpleador: false,
        estadoActividad: null,
        error: 'cedula_invalida',
        fechaConsulta: new Date()
      }
    } 
    
    if (estado === 'ingresar_fecha_nacimiento') {
      // Rellenamos el campo de fecha de nacimiento
      await page.type("#j_idt9\\:calFechaNacimiento_input", fechaNacimiento)
      await page.waitForTimeout(1000)
      
      // Nuevo bucle para hacer click después de ingresar la fecha
      let estadoFecha = null
      let intentosFecha = 0
      const maxIntentosFecha = 30
      
      while (!estadoFecha && intentosFecha < maxIntentosFecha) {
        try {
          intentosFecha++
          
          // Hacer click en el botón de buscar
          await page.click("#j_idt9\\:btnIngresarLogin")
          
          // Esperar 2 segundos
          await page.waitForTimeout(2000)
          
          // Verificar si aparece el PDF o mensaje de error de fecha
          try {
            estadoFecha = await Promise.race([
              page.waitForSelector('#dg_reporte', { timeout: 3000 }).then(() => 'ok'),
              page.waitForSelector('#frmPopMensajes', { timeout: 3000 }).then(() => 'fecha_incorrecta'),
            ])

            break // Salir del bucle si obtuvimos respuesta
            
          } catch (timeoutError) {
            // No apareció ningún resultado, continuar con el siguiente intento
            console.log(`continuando...`)
          }
          
        } catch (clickError) {
          console.log(`❌ Error en intento ${intentosFecha}: ${clickError.message}`)
        }
      }
      
      if (!estadoFecha) {
        throw new Error(`No se obtuvo respuesta después de ${maxIntentosFecha} intentos con fecha`)
      }
      
      if (estadoFecha === 'fecha_incorrecta') {
        console.log(`❌ La fecha de nacimiento ${fechaNacimiento} es incorrecta para la cédula ${cedula}`)
        return {
          cedula,
          fechaNacimiento,
          nombre: null,
          registradoComoEmpleador: false,
          estadoActividad: null,
          error: 'fecha_incorrecta',
          fechaConsulta: new Date()
        }
      }
    }

    // Esperar a que cargue el iframe del PDF
    console.log(`📄 Esperando carga del PDF...`)
    await page.waitForSelector("iframe#j_idt20", { timeout: 30000 })

    // Obtener la URL del PDF desde el atributo src del iframe
    const iframeSrc = await page.$eval("iframe#j_idt20", el => el.getAttribute("src"))
    const baseURL = "https://app.iess.gob.ec"
    const urlParams = new URLSearchParams(iframeSrc.split("?")[1])
    const encodedFilePath = urlParams.get("file")
    const pdfURL = baseURL + decodeURIComponent(encodedFilePath)

    // Obtener las cookies de sesión
    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join("; ")

    // Descargar el PDF
    console.log(`⬇️ Descargando y procesando PDF...`)
    const response = await fetch(pdfURL, {
      headers: { "Cookie": cookieHeader }
    })
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Leer el PDF
    const texto = await extractTextFromPDF(buffer)

    // Extraer información del PDF
    let nombreMatch = texto.match(/certifica que:\s+(.+?)\s+con cédula/)
    if (!nombreMatch) {
      nombreMatch = texto.match(/\(IESS\)\s+certifica\s+que:\s+(.+?)\s+con\s+cédula/)
    }
    const nombre = nombreMatch ? nombreMatch[1].trim() : "El usuario"

    const textoNormalizado = texto.replace(/\s+/g, ' ').toLowerCase()
    
    const noRegistrado = textoNormalizado.includes("no se encuentra registrado como empleador")
    const siRegistrado = textoNormalizado.includes("si se encuentra registrado como empleador")
    
    let registradoComoEmpleador = false
    let estadoActividad = null
    let mensaje = ""
    
    if (noRegistrado) {
      registradoComoEmpleador = false
      mensaje = `${nombre} NO se encuentra registrado como empleador`
      console.log(`❌ ${mensaje}`)
    } else if (siRegistrado) {
      registradoComoEmpleador = true
      const estadoMatch = textoNormalizado.match(/su estado actual es:\s*(\w+)/)
      estadoActividad = estadoMatch ? estadoMatch[1].trim() : "No especificado"
      
      if (estadoActividad.toLowerCase() === 'activo') {
        mensaje = `${nombre} SÍ está registrado como empleador y está ACTIVO`
        console.log(`✅ ${mensaje}`)
      } else if (estadoActividad.toLowerCase() === 'inactivo') {
        mensaje = `${nombre} SÍ está registrado como empleador pero está INACTIVO`
        console.log(`⚠️ ${mensaje}`)
      } else {
        mensaje = `${nombre} SÍ está registrado como empleador. Estado: ${estadoActividad}`
        console.log(`✅ ${mensaje}`)
      }
    } else {
      mensaje = `${nombre} - No se pudo determinar el estado del empleador`
      console.log(`❓ ${mensaje}`)
    }

    const datosAGuardar = {
      cedula,
      fechaNacimiento,
      nombre,
      registradoComoEmpleador,
      estadoActividad,
      mensaje,
      fechaConsulta: new Date(),
      estado: 'exitoso'
    }

    // Guardar en base de datos
    await DatabaseOperations.upsert(
      Collections.CERTIFICADOS_IESS,
      { cedula },
      datosAGuardar
    )
    
    console.log(`💾 Datos guardados/actualizados para la cédula ${cedula}`)

    return datosAGuardar

  } catch (error) {
    console.error(`❌ Error en certificado IESS:`, error.message)
    throw new Error(`Error al consultar certificado IESS: ${error.message}`)
  } finally {
    await browser.close()
  }
}