import { chromium } from "playwright"
import { DatabaseOperations, Collections } from '../Models/database.js'

export const obtenerConsejoJudicatura = async (nombre, tipoBusqueda, provinciaInstitucion = null, canton = null) => {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  try {
    await page.goto("https://appsj.funcionjudicial.gob.ec/informativo/pages/directorio.jsf", {
      waitUntil: "domcontentloaded"
    })

    // Rellenamos el campo de nombre del funcionario
    await page.type("#nameOfficial", nombre)
    // Seleccionamos el campo de tipo de busqueda
    await page.selectOption('select#j_idt32', tipoBusqueda.toUpperCase())
    if (provinciaInstitucion !== null) {
      // Seleccionamos el campo de provincia o institucion
      await page.selectOption('select#j_idt37', provinciaInstitucion.toUpperCase())
    }
    if (tipoBusqueda.toLowerCase() === "provincias" && canton !== null) {
      // Seleccionamos el campo de canton
      await page.selectOption('select#selectProvincia', canton.toUpperCase())
    }
    
    // Se le da click al botón de buscar
    await page.click("#j_idt47")

    // Espera hasta que aparezca la primera etiqueta que tiene la clase cuerpo o la que tiene la clase mat-mdc-simple-snack-bar
    const estado = await Promise.race([
      page.waitForSelector('.rf-ntf-sum', { timeout: 60000 }).then(() => 'no_resultados'),
      page.waitForSelector('#table\\:tb tr', { timeout: 60000 }).then(() => 'ok'),
    ])

    //Si se encontró la etiqueta que tiene la clase mat-mdc-simple-snack-bar PRIMERO (No se encontraron resultados)
    if (estado === 'no_resultados') {
      console.log(`ℹ️ No se encontraron resultados para ${nombre} en ${tipoBusqueda}`)
      return {
        nombre,
        tipoBusqueda,
        funcionarios: [],
        totalFuncionarios: 0,
        fechaConsulta: new Date(),
        estado: 'sin_datos'
      }
    }

    const resultadosTotales = []
    while (true) {
      // Esperar a que se cargue la tabla
      await page.waitForSelector('#table\\:tb tr', { timeout: 60000 })

      //Recorro las filas de la tabla y obtengo los datos
      const resultados = await page.$$eval("#table\\:tb tr", (filas) => {
        return filas.map((fila) => {
          const columnas = fila.querySelectorAll("td")
          return {
            funcionario: columnas[0]?.innerText.trim() || "",
            cargo: columnas[1]?.innerText.trim() || "",
            departamento: columnas[2]?.innerText.trim() || "",
            edificio: columnas[3]?.innerText.trim() || "",
            direccion: columnas[4]?.innerText.trim() || "",
            ciudad: columnas[5]?.innerText.trim() || "",
            telefono: columnas[6]?.innerText.trim() || "",
            email: columnas[7]?.innerText.trim() || "",
          }
        })
      })    
      resultadosTotales.push(...resultados)

      // Buscar si existe el botón para siguiente pestaña
      const siguiente = await page.$('a#j_idt97_ds_next')

      if (siguiente) {
        await siguiente.click()
        await page.waitForTimeout(1000) // espera breve por si tarda en cargar
      } else {
        break  // no hay más páginas
      }
    }

    console.log(`✅ Se encontraron ${resultadosTotales.length} funcionarios del Consejo de la Judicatura`)

    // Guardar en MongoDB solo los resultados
    if (resultadosTotales.length > 0) {
      await DatabaseOperations.addToArrayNoDuplicates(
        Collections.CONSEJO_JUDICATURA,
        { tipo: "funcionarios_judicatura" },
        'funcionarios',
        resultadosTotales,
        ['funcionario', 'cargo', 'departamento']
      )
      console.log(`💾 Datos guardados en base de datos`)
    }

    // Retornar datos para el controller
    return {
      nombre,
      tipoBusqueda,
      funcionarios: resultadosTotales,
      totalFuncionarios: resultadosTotales.length,
      fechaConsulta: new Date(),
      estado: resultadosTotales.length > 0 ? 'exitoso' : 'sin_datos'
    }

  } catch (error) {
    console.error("\n❌ Error en obtenerConsejoJudicatura:", error.message)
    throw new Error(`Error al consultar Consejo de la Judicatura: ${error.message}`)
  } finally {
    await browser.close()
  }
}