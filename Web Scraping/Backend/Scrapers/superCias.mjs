import { chromium } from 'playwright'
import { DatabaseOperations, Collections } from '../Models/database.js'

// Función para determinar si es persona natural
function esPersonaNatural(ruc) {
  if (!ruc || typeof ruc !== 'string') return false
  if (ruc.length === 10) return true
  if (ruc.length === 13 && /^[0-9]{10}001$/.test(ruc)) {
    const tercerDigito = parseInt(ruc[2])
    return tercerDigito >= 0 && tercerDigito <= 5
  }
  return false
}

export const obtenerSuperciasEmpresas = async (documento) => {
  // Validar el documento antes de proceder
  if (!documento || typeof documento !== 'string') {
    throw new Error('Documento inválido o vacío')
  }
  
  const documentoLimpio = documento.trim()
  
  // Validar formato básico (10 o 13 dígitos)
  if (!/^\d{10}$|^\d{13}$/.test(documentoLimpio)) {
    throw new Error('El documento debe tener 10 dígitos (cédula) o 13 dígitos (RUC)')
  }
  
  console.log(`🔍 Iniciando consulta Supercias para documento: ${documentoLimpio}`)

  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    console.log(`🌐 Navegando a la página de Supercias...`)
    
    await page.goto('https://appscvs1.supercias.gob.ec/consultaPersona/consulta_cia_param.zul', {
      waitUntil: 'networkidle'
    })

    // Esperar a que la página cargue completamente
    await page.waitForTimeout(1000)
    
    console.log(`📝 Manejando popup inicial...`)
    await page.keyboard.press('Enter')
    
    // Esperar más tiempo para que los componentes se inicialicen
    await page.waitForTimeout(1000)
    
    // DEBUGGING: Ver todos los inputs disponibles
    console.log('🔍 Buscando campos de entrada disponibles...')
    const todosLosInputs = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input, select, textarea'))
      return inputs.map((input, index) => ({
        index,
        tagName: input.tagName,
        type: input.type || 'N/A',
        className: input.className,
        id: input.id || 'sin-id',
        placeholder: input.placeholder || 'sin-placeholder',
        visible: input.offsetParent !== null,
        value: input.value
      }))
    })
    console.log('📋 Inputs encontrados:', todosLosInputs)

    // Usar directamente el selector que sabemos que funciona
    await page.waitForSelector('input.z-combobox-inp', { timeout: 0 })
    const input = await page.$('input.z-combobox-inp')
    
    if (!input) {
      throw new Error('No se pudo encontrar el campo de entrada del documento')
    }

    console.log(`✅ Campo encontrado con selector: input.z-combobox-inp`)
    
    // ESTRATEGIA SIMPLIFICADA BASADA EN EL CÓDIGO QUE FUNCIONA
    console.log(`📝 Ingresando documento: ${documentoLimpio}`)
    
    // Usar la secuencia exacta que funciona
    await input.fill(documentoLimpio, { delay: 100 })
    
    console.log(`🎯 Activando dropdown con secuencia de teclas...`)
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(2000)
    await page.keyboard.press('Enter') // Esta segunda tecla Enter es crucial
    
    // Disparar eventos blur y change como en el código que funciona
    console.log(`🔄 Disparando eventos de validación...`)
    await page.evaluate(() => {
        const combobox = document.querySelector('.z-combobox-inp')
        if (combobox) {
            combobox.blur()
            combobox.dispatchEvent(new Event('change', { bubbles: true }))
        }
    })
    
    await page.waitForTimeout(1000)
    
    await page.waitForTimeout(2000)

    console.log(`🔍 Buscando botón de búsqueda...`)
    
    // DEBUGGING: Ver todos los botones disponibles
    const botones = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"], [role="button"]'))
      return buttons.map((btn, index) => ({
        index,
        tagName: btn.tagName,
        type: btn.type || 'N/A',
        textContent: btn.textContent?.trim(),
        value: btn.value || 'N/A',
        className: btn.className,
        id: btn.id || 'sin-id',
        visible: btn.offsetParent !== null,
        enabled: !btn.disabled
      }))
    })
    console.log('🔍 Botones encontrados:', botones)
    
    // Usar la estrategia exacta del código que funciona
    try {
      await page.click('button.z-button')
      console.log('✅ Clic exitoso con botón z-button')
    } catch (error) {
      throw new Error(`No se pudo hacer clic en el botón de búsqueda: ${error.message}`)
    }
    
    // Esperar resultados
    try {
      await page.waitForSelector('tr.z-listitem', { timeout: 15000 })
    } catch (timeoutError) {
      // Verificar si hay algún mensaje de error en la página
      const mensajesError = await page.evaluate(() => {
        const posiblesMensajes = document.querySelectorAll('.z-messagebox, .error, [class*="error"], [class*="alert"]')
        return Array.from(posiblesMensajes).map(el => el.textContent?.trim()).filter(Boolean)
      })
      
      if (mensajesError.length > 0) {
        console.log('⚠️ Mensajes de error encontrados:', mensajesError)
        return {
          success: false,
          error: `Error del sistema: ${mensajesError.join(', ')}`,
          data: null
        }
      }
      
      console.log(`⚠️ No se encontraron resultados para: ${documento}`)
      return {
        success: false,
        error: 'No se encontraron empresas asociadas al documento consultado',
        data: null
      }
    }

    // Resto del código igual (extracción de datos)...
    console.log(`📊 Extrayendo datos de la tabla...`)
    const rows = await page.$$('tr.z-listitem')

    if (rows.length === 0) {
      console.log(`📭 Sin resultados para: ${documento}`)
      return {
        success: false,
        error: 'No se encontraron empresas para el documento consultado',
        data: null
      }
    }

    const datosExtraidos = []

    for (const row of rows) {
      try {
        const cells = await row.$$('td.z-listcell')
        
        if (cells.length < 8) {
          console.log('⚠️ Fila con datos incompletos, omitiendo...')
          continue
        }

        const expediente = await cells[0].innerText()
        const nombre = await cells[1].innerText()
        const ruc = await cells[2].innerText()
        const capitalInvertido = await cells[3].innerText()
        const capitalTotal = await cells[4].innerText()
        const valorNominal = await cells[5].innerText()
        const situacionLegal = await cells[6].innerText()
        const posesionEfectiva = await cells[7].innerText()
        const tipoPersona = esPersonaNatural(ruc) ? 'Persona NATURAL' : 'Persona JURÍDICA'

        const registro = {
          documento: documento.trim(),
          tipoPersona,
          expediente: expediente.trim(),
          nombre: nombre.trim(),
          ruc: ruc.trim(),
          capitalInvertido: capitalInvertido.trim(),
          capitalTotal: capitalTotal.trim(),
          valorNominal: valorNominal.trim(),
          situacionLegal: situacionLegal.trim(),
          posesionEfectiva: posesionEfectiva.trim(),
          fechaConsulta: new Date().toISOString(),
          estado: 'exitoso'
        }

        datosExtraidos.push(registro)
      } catch (rowError) {
        console.log(`⚠️ Error procesando fila: ${rowError.message}`)
        continue
      }
    }

    console.log(`📊 Se encontraron ${datosExtraidos.length} registros`)

    if (datosExtraidos.length === 0) {
      return {
        success: false,
        error: 'No se pudieron procesar los datos encontrados',
        data: null
      }
    }

    // Guardar en base de datos
    try {
      const collection = DatabaseOperations.getCollection(Collections.SUPERCIAS_EMPRESAS)
      await collection.deleteMany({ documento: documento.trim() })
      
      if (datosExtraidos.length > 0) {
        await collection.insertMany(datosExtraidos)
      }
      console.log(`💾 ${datosExtraidos.length} registros guardados en BD`)
    } catch (dbError) {
      console.error('❌ Error guardando en BD:', dbError.message)
    }

    return {
      success: true,
      data: {
        documento: documento.trim(),
        totalEmpresas: datosExtraidos.length,
        empresas: datosExtraidos,
        fechaConsulta: new Date().toISOString()
      }
    }

  } catch (error) {
    console.error('❌ Error en obtenerSuperciasEmpresas:', error.message)
    
    try {
      await DatabaseOperations.upsert(
        Collections.SUPERCIAS_EMPRESAS,
        { documento: documento.trim() },
        {
          documento: documento.trim(),
          error: error.message,
          fechaConsulta: new Date().toISOString(),
          estado: 'error'
        }
      )
    } catch (dbError) {
      console.error('Error guardando error en BD:', dbError.message)
    }
    
    return {
      success: false,
      error: error.message,
      data: null
    }

  } finally {
    console.log('🔄 Cerrando navegador...')
    await browser.close()
  }
}