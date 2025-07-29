import { chromium } from "playwright"
import { DatabaseOperations, Collections } from '../Models/database.js'

export const obtenerCitacionesJudiciales = async (cedula) => {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  try {
    await page.goto("https://consultas.funcionjudicial.gob.ec/informacionjudicial/public/informacionCitaciones.jsf", {
      waitUntil: "domcontentloaded"
    })

    // Rellenamos el campo de cedula
    await page.type("#form1\\:txtDemandadoCedula", cedula)

    let noResultados = false
    while(true) {
      // Se le da click al botón de buscar
      await page.click("#form1\\:butBuscarJuicios")
      await page.waitForTimeout(1000)

      // Verificar el estado de los resultados
      const estadoResultados = await page.$$eval("#form1\\:dataTableJuicios2_data tr", (filas) => {
        if (filas.length === 0) {
          return { tipo: 'sin_filas', columnas: 0 }
        }

        const primeraFila = filas[0]
        const columnas = primeraFila.querySelectorAll("td")
        
        // Verificar si es el mensaje de "No se encuentran resultados"
        if (columnas.length > 0 && columnas[0]?.innerText.trim() === "No se encuentran resultados.") {
          return { tipo: 'no_resultados', columnas: columnas.length }
        }
        
        // Si hay más de 1 columna, significa que hay resultados
        if (columnas.length > 1) {
          return { tipo: 'resultados_encontrados', columnas: columnas.length }
        }
        
        return { tipo: 'cargando', columnas: columnas.length }
      })

      if (estadoResultados.tipo === 'no_resultados') {
        console.log(`ℹ️ No se encontraron citaciones judiciales para la cédula ${cedula}.`)
        noResultados = true
        break
      } else if (estadoResultados.tipo === 'resultados_encontrados') {
        console.log(`✅ Se encontraron citaciones judiciales para la cédula ${cedula}.`)
        break
      } 
    }

    let resultados = []
    
    if (!noResultados) {
      //Recorro las filas de la tabla y obtengo los datos
      resultados = await page.$$eval("#form1\\:dataTableJuicios2_data tr", (filas) => {
        return filas.map((fila) => {
          const columnas = fila.querySelectorAll("td")
          
          // Solo procesar filas que no sean el mensaje de "No se encuentran resultados"
          if (columnas.length > 1 && columnas[0]?.innerText.trim() !== "No se encuentran resultados.") {
            return {
              provincia: columnas[0]?.innerText.trim() || '',
              canton: columnas[1]?.innerText.trim() || '',
              judicatura: columnas[2]?.innerText.trim() || '',
              numeroCausa: columnas[3]?.innerText.trim() || '',
              demandado: columnas[4]?.innerText.trim() || '',
              proceso: columnas[5]?.innerText.trim() || '',
              fechaRazonCopias: columnas[6]?.innerText.trim() || '',
              fechaRazonEnvio: columnas[7]?.innerText.trim() || '',
              fechaBoletasRecibidas: columnas[8]?.innerText.trim() || '',
              fechaDevolucion: columnas[9]?.innerText.trim() || '',
              fechaAsignacionCitado: columnas[10]?.innerText.trim() || '',
              estado: columnas[11]?.innerText.trim() || '',
              fechaActaCitacion: columnas[12]?.innerText.trim() || '',
              tiposCitacion: columnas[13]?.innerText.trim() || '',
            }
          }
          return null // Para filas que no cumplen las condiciones
        }).filter(item => item !== null) // Filtrar elementos null
      })

      console.log(`✅ Se encontraron ${resultados.length} citaciones judiciales para la cédula ${cedula}`)

      // Guardar en MongoDB si hay resultados
      if (resultados.length > 0) {
        await DatabaseOperations.addToArrayNoDuplicates(
          Collections.CITACIONES_JUDICIALES,
          { cedula },
          'citaciones',
          resultados,
          ['numeroCausa', 'judicatura']
        )
        console.log(`💾 Datos guardados en base de datos para la cédula ${cedula}`)
      }
    }

    // Retornar datos para el controller
    return {
      cedula,
      citaciones: resultados,
      totalCitaciones: resultados.length,
      fechaConsulta: new Date(),
      estado: resultados.length > 0 ? 'exitoso' : 'sin_datos'
    }

  } catch (error) {
    console.error("\n❌ Error en obtenerCitacionesJudiciales:", error.message)
    throw new Error(`Error al consultar citaciones judiciales: ${error.message}`)
  } finally {
    await browser.close()
  }
}