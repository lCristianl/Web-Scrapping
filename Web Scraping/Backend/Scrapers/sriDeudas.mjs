import { chromium } from 'playwright'
import { DatabaseOperations, Collections } from '../Models/database.js'

export const obtenerSRIdeudas = async (ruc) => {
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()

  try {
    await page.goto('https://srienlinea.sri.gob.ec/sri-en-linea/SriPagosWeb/ConsultaDeudasFirmesImpugnadas/Consultas/consultaDeudasFirmesImpugnadas', {
      waitUntil: 'domcontentloaded'
    })

    await page.waitForSelector('#busquedaRucId', { timeout: 0 })
    await page.fill('#busquedaRucId', ruc)
    await page.click('.ui-button-secondary')

    await page.waitForSelector('span.titulo-consultas-1.tamano-defecto-campos', { timeout: 0 })

    // Extraer textos (si no existen los selectores lanzará error que manejamos abajo)
    const rucObtenida = (await page.textContent('text=RUC / cédula >> xpath=../../..//span'))?.trim() || ''
    const fechaCorte = (await page.textContent('text=Fecha de corte >> xpath=../../..//span'))?.trim() || ''
    const razonSocial = (await page.textContent('text=Razón social / Apellidos y nombres >> xpath=../../..//span'))?.trim() || ''

    let estadoDeuda = 'NO DETERMINADO'
    const mensajeDeuda = page.locator('.tamano-ya-pago span').first()
    if (await mensajeDeuda.count()) {
      estadoDeuda = (await mensajeDeuda.textContent())?.trim() || estadoDeuda
    }

    const resultado = {
      ruc: ruc.trim(),
      rucObtenida,
      fechaCorte,
      razonSocial,
      estadoDeuda,
      fechaConsulta: new Date()
    }

    // Guardar/actualizar en DB: usa Collections.DATOS_SRI o crea colección propia si prefieres
    // Aquí uso DATOS_SRI (consistente con el esquema del proyecto)
    await DatabaseOperations.upsert(
      Collections.SRI_DEUDAS,
      { ruc: resultado.ruc },
      resultado
    )

    return { success: true, data: resultado, estado: 'exitoso' }

  } catch (error) {
    console.error('❌ Error en obtenerSRIdeudas:', error.message)
    throw new Error(`Error al consultar SRI deudas: ${error.message}`)
  } finally {
    await browser.close()
  }
}
