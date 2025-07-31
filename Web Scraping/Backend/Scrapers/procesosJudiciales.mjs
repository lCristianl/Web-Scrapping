import { chromium } from "playwright"
import { DatabaseOperations, Collections } from '../Models/database.js'

export const obtenerProcesos = async (cedula, tipoConsulta = "actor") => {
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()
  
  try {
    await page.goto("https://procesosjudiciales.funcionjudicial.gob.ec/busqueda-filtros", {
      waitUntil: "domcontentloaded"
    })

    let resultados = []

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

      //Si se encontró la etiqueta que tiene la clase mat-mdc-simple-snack-bar PRIMERO (No se encontraron resultados)
      if (estado === 'no_resultados') {
        console.log(`ℹ️ No hay procesos judiciales registrados para la cédula ${cedula} como ${tipoConsulta}`)
      } else {
        resultados = await extraerDatos(page) //Función para extraer los datos de la página
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

      //Si se encontró la etiqueta que tiene la clase mat-mdc-simple-snack-bar PRIMERO (No se encontraron resultados)
      if (estado === 'no_resultados') {
        console.log(`ℹ️ No hay procesos judiciales registrados para la cédula ${cedula} como ${tipoConsulta}`)
      } else {
        resultados = await extraerDatos(page) //Función para extraer los datos de la página
      }
    } else {
      throw new Error("Tipo de consulta no válido. Debe ser 'actor/ofendido' o 'demandado/procesado'.")
    }

    // Guardar en base de datos usando el modelo
    if (resultados.length > 0) {
      await DatabaseOperations.addToArrayNoDuplicates(
        Collections.PROCESOS_JUDICIALES,
        { cedula },
        tipoConsulta.toLowerCase(),
        resultados,
        ['numeroProceso']
      )
      console.log(`💾 Datos guardados en base de datos para la cédula ${cedula}`)
    }

    // Retornar datos para el controller
    return {
      cedula,
      tipoConsulta,
      procesos: resultados,
      totalProcesos: resultados.length,
      fechaConsulta: new Date(),
      estado: resultados.length > 0 ? 'exitoso' : 'sin_datos'
    }

  } catch (error) {
    console.error("\n❌ Error en obtenerProcesos:", error.message)
    throw new Error(`Error al consultar procesos judiciales: ${error.message}`)
  } finally {
    await browser.close()
  }
}

async function extraerDatos(page) {
  try {
    //Recorro los elementos que tiene la clase causa-individual y obtengo los datos
    const resultados = await page.$$eval(".causa-individual", (elementos) => {
      return elementos.map((el) => {
        return {
          id: el.querySelector(".id")?.innerText.trim() || "",
          fecha: el.querySelector(".fecha")?.innerText.trim() || "",
          numeroProceso: el.querySelector(".numero-proceso")?.innerText.trim() || "",
          accionInfraccion: el.querySelector(".accion-infraccion")?.innerText.trim() || ""
        }
      })
    })

    console.log(`✅ Se encontraron ${resultados.length} procesos judiciales`)
    return resultados

  } catch (error) {
    console.error("\n❌ Error al extraer datos:", error.message)
    return []
  }
}