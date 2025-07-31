import { chromium } from "playwright"
import { DatabaseOperations, Collections } from '../Models/database.js'

export const obtenerDatosRuc = async (ruc) => {
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()

  try {
    await page.goto("https://srienlinea.sri.gob.ec/sri-en-linea/SriRucWeb/ConsultaRuc/Consultas/consultaRuc", {
      waitUntil: "domcontentloaded"
    })

    // Rellenamos el campo de RUC
    await page.type('input[formcontrolname="inputRuc"]', ruc)
    // Se le da click al botón de buscar
    await page.click('.ui-button.ui-widget.ui-state-default.ui-corner-all.ui-button-text-only.cyan-btn')
    
    //Espera hasta que aparezca la etiqueta que tiene la clase row
    await page.waitForSelector("sri-mostrar-contribuyente", { timeout: 60000 })
    await page.click(".ui-button.cyan-btn.ui-widget.ui-state-default.ui-corner-all.ui-button-text-only")
    await page.waitForSelector("sri-listar-establecimientos", { timeout: 60000 })

    // Se extraen los datos del RUC
    const datosContribuyente = await page.$$eval("sri-mostrar-contribuyente", (elementos) => {
      return elementos.map((el) => {
        const estadoSpan = el.querySelector(".col-sm-8.alineacion-texto-centro.titulo-consultas-1.tamano-defecto-campos.alinear-izquierda.ng-star-inserted span")
        const tds = el.querySelectorAll(".col-sm-12.centrar-texto-tabla td")

        return {
          estado: estadoSpan?.innerText.trim() || "",
          tipoContribuyente: tds[0]?.innerText.trim() || "",
          regimen: tds[1]?.innerText.trim() || "",
        }
      })
    })

    // Se extraen los datos de los establecimientos registrados
    const establecimientos = await page.$$eval(".ui-datatable-data.ui-widget-content tr", (filas) => {
      return filas.map((fila) => {
        const columnas = fila.querySelectorAll("td")
        return {
          numEstablecimiento: columnas[0]?.innerText.trim() || "",
          nombre: columnas[1]?.innerText.trim() || "",
          ubicacion: columnas[2]?.innerText.trim() || "",
          estado: columnas[3]?.innerText.trim() || "",
        }
      })
    })

    console.log(`✅ Se encontraron datos del RUC ${ruc}`)
    console.log(`   - Datos del contribuyente: ${datosContribuyente.length > 0 ? 'Encontrado' : 'No encontrado'}`)
    console.log(`   - Establecimientos: ${establecimientos.length} encontrados`)

    // Verificar si se encontraron datos
    if (datosContribuyente.length === 0 && establecimientos.length === 0) {
      console.log(`ℹ️ No se encontraron datos para el RUC ${ruc}.`)
      return {
        ruc,
        datosContribuyente: {},
        establecimientos: [],
        fechaConsulta: new Date(),
        estado: 'sin_datos'
      }
    }

    const resultado = {
      ruc,
      datosContribuyente: datosContribuyente[0] || {},
      establecimientos: establecimientos,
      fechaConsulta: new Date(),
      estado: 'exitoso'
    }

    // Guardar en base de datos usando el modelo SRI personalizado
    const existingDoc = await DatabaseOperations.findByRuc(Collections.DATOS_SRI, ruc)

    if (!existingDoc) {
      await DatabaseOperations.insertOne(Collections.DATOS_SRI, resultado)
      console.log(`💾 Se guardaron los datos del RUC ${ruc} en la base de datos`)
    } else {
      // Verificar cambios en datos del contribuyente
      let updateOperations = {}
      if (JSON.stringify(existingDoc.datosContribuyente) !== JSON.stringify(resultado.datosContribuyente)) {
        updateOperations.datosContribuyente = resultado.datosContribuyente
      }

      // Agregar nuevos establecimientos
      await DatabaseOperations.addToArrayNoDuplicates(
        Collections.DATOS_SRI,
        { ruc },
        'establecimientos',
        establecimientos,
        ['numEstablecimiento', 'nombre', 'ubicacion']
      )

      // Actualizar datos del contribuyente si cambiaron
      if (Object.keys(updateOperations).length > 0) {
        await DatabaseOperations.updateOne(
          Collections.DATOS_SRI,
          { ruc },
          { $set: updateOperations }
        )
        console.log(`💾 Se actualizaron los datos del contribuyente para el RUC ${ruc}`)
      }
    }

    return resultado

  } catch (error) {
    console.error("\n❌ Error en obtenerDatosRuc:", error.message)
    throw new Error(`Error al consultar SRI: ${error.message}`)
  } finally {
    await browser.close()
  }
}