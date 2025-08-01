import { chromium } from "playwright"
import { DatabaseOperations, Collections } from '../Models/database.js'

export const obtenerProcesos = async (cedula) => {
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()
  
  try {
    await page.goto("https://procesosjudiciales.funcionjudicial.gob.ec/busqueda-filtros", {
      waitUntil: "domcontentloaded"
    })

    let resultadosActor = []
    let resultadosDemandado = []

    // Rellenamos el campo de cédula
    await page.type('input[formcontrolname="cedulaActor"]', cedula)    
    // Se le da click al botón de buscar
    await page.waitForSelector('.boton-buscar:not([disabled])', { timeout: 5000 })
    await page.click('.boton-buscar')
    
    // Espera hasta que aparezca la primera etiqueta que tiene la clase cuerpo o la que tiene la clase mat-mdc-simple-snack-bar
    const estadoActor = await Promise.race([
      page.waitForSelector('.mat-mdc-simple-snack-bar.ng-star-inserted', { timeout: 60000 }).then(() => 'no_resultados'),
      page.waitForSelector('.cuerpo', { timeout: 60000 }).then(() => 'ok'),
    ])

    //Si se encontró la etiqueta que tiene la clase mat-mdc-simple-snack-bar PRIMERO (No se encontraron resultados)
    if (estadoActor === 'no_resultados') {
      console.log(`ℹ️ No hay procesos judiciales registrados para la cédula ${cedula}`)
    } else {
      resultadosActor = await extraerDatos(page) //Función para extraer los datos de la página
      // Se le da click al boton de regresar para buscar por demandado
      await page.click('.botones.btn-regresar.mdc-button')
    }

    // Rellenamos el campo de cédula
    await page.fill('input[formcontrolname="cedulaDemandado"]', cedula)
    // Se le da click al botón de buscar
    await page.waitForSelector('.boton-buscar:not([disabled])', { timeout: 5000 })
    await page.click('.boton-buscar')
    
    // Espera hasta que aparezca la primera etiqueta que tiene la clase cuerpo o la que tiene la clase mat-mdc-simple-snack-bar
    const estadoDemandado = await Promise.race([
      page.waitForSelector('.mat-mdc-simple-snack-bar.ng-star-inserted', { timeout: 60000 }).then(() => 'no_resultados'),
      page.waitForSelector('.cuerpo', { timeout: 60000 }).then(() => 'ok'),
    ])

    //Si se encontró la etiqueta que tiene la clase mat-mdc-simple-snack-bar PRIMERO (No se encontraron resultados)
    if (estadoDemandado === 'no_resultados') {
      console.log(`ℹ️ No hay procesos judiciales registrados para la cédula ${cedula}`)
    } else {
      resultadosDemandado = await extraerDatos(page) //Función para extraer los datos de la página
    }

    const resultados = [...resultadosActor, ...resultadosDemandado]

    // Guardar en base de datos usando el modelo
    if (estadoActor === 'ok' || estadoDemandado === 'ok') {
      const datosParaGuardar = {
        cedula,
        procesos: {
          resultadosActor: resultadosActor,
          resultadosDemandado: resultadosDemandado
        },
        totalProcesosActor: resultadosActor.length,
        totalProcesosDemandado: resultadosDemandado.length,
        fechaConsulta: new Date(),
        estado: (resultadosActor.length > 0 || resultadosDemandado.length > 0) ? 'con_procesos' : 'sin_procesos'
      }

      await DatabaseOperations.upsert(
        Collections.PROCESOS_JUDICIALES,
        { cedula },
        datosParaGuardar
      )
    }

    // Retornar datos para el controller
    return {
      cedula,
      procesos: {
        resultadosActor: resultadosActor,
        resultadosDemandado: resultadosDemandado
      },
      totalProcesosActor: resultadosActor.length,
      totalProcesosDemandado: resultadosDemandado.length,
      fechaConsulta: new Date(),
      estado: (resultadosActor.length > 0 || resultadosDemandado.length > 0) ? 'exitoso' : 'sin_datos'
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