import { chromium } from "playwright"
import { DatabaseOperations, Collections } from '../Models/database.js'

export const obtenerAntecedentesPenales = async (cedula) => {
  let browserVisible = null
  let browser = null
  
  try {
    console.log(`🔍 Iniciando consulta de antecedentes penales para cédula: ${cedula}`)

    // Browser visible para manejar cookies
    browserVisible = await chromium.launch({ headless: false })
    const contextVisible = await browserVisible.newContext()
    const pageVisible = await contextVisible.newPage()

    await pageVisible.goto('https://certificados.ministeriodelinterior.gob.ec/gestorcertificados/antecedentes/', {
      waitUntil: 'domcontentloaded'
    })
    
    await pageVisible.waitForSelector('.cc-btn.cc-dismiss', { timeout: 0 })
    await pageVisible.click('.cc-btn.cc-dismiss')

    // Obtener estado de storage después de manejar cookies
    const storage = await contextVisible.storageState()
    await browserVisible.close()

    // Browser headless con cookies guardadas
    browser = await chromium.launch({ headless: true })
    const context = await browser.newContext({ storageState: storage })
    const page = await context.newPage()

    await page.goto('https://certificados.ministeriodelinterior.gob.ec/gestorcertificados/antecedentes/', {
      waitUntil: 'domcontentloaded'
    })

    // Aceptar términos
    await page.waitForSelector('button.ui-button-text-only >> text=Aceptar', { timeout: 10000 })
    await page.click('button.ui-button-text-only >> text=Aceptar')

    // Llenar cédula
    await page.waitForSelector('#txtCi', { visible: false })
    await page.fill('#txtCi', cedula)
    await page.click('#btnSig1')

    // Llenar motivo
    await page.waitForSelector('#txtMotivo', { timeout: 30000 })
    await page.fill('#txtMotivo', 'Consulta Personal')
    await page.waitForSelector('#btnSig2', { timeout: 20000 })
    await page.click('#btnSig2')

    // Obtener resultados
    await page.waitForSelector('#dvAntecedent1', { timeout: 20000 })

    const resultado = await page.textContent('#dvAntecedent1')
    const nombre = await page.textContent('#dvName1')

    const resultadoFormateado = resultado.trim().toUpperCase() === 'NO'
      ? 'No tiene antecedentes penales'
      : 'Tiene antecedentes penales'

    const tieneAntecedentes = resultado.trim().toUpperCase() !== 'NO'

    const datosAntecedentes = {
      cedula,
      nombre: nombre.trim(),
      resultado: resultadoFormateado,
      tieneAntecedentes,
      fechaConsulta: new Date(),
      estado: 'exitoso'
    }

    console.log(`✅ Consulta completada para ${nombre.trim()}: ${resultadoFormateado}`)

    // Guardar en base de datos usando el modelo
    await DatabaseOperations.upsert(
      Collections.ANTECEDENTES_PENALES,
      { cedula },
      datosAntecedentes
    )

    console.log(`Datos guardados en base de datos para la cédula ${cedula}`)

    return datosAntecedentes

  } catch (error) {
    console.error("\nError en obtenerAntecedentesPenales:", error.message)
    throw new Error(`Error al consultar antecedentes penales: ${error.message}`)
  } finally {
    if (browserVisible) {
      await browserVisible.close()
    }
    if (browser) {
      await browser.close()
    }
  }
}