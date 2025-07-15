import { chromium } from "playwright"

const cedula = "1102961867"

export const obtenerCitacionesJudiciales = async (cedula) => {
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()

  await page.goto("https://consultas.funcionjudicial.gob.ec/informacionjudicial/public/informacionCitaciones.jsf", {
    waitUntil: "domcontentloaded"
  })

  try {
    // Rellenamos el campo de cedula
    await page.type("#form1\\:txtDemandadoCedula", cedula)
    // Se le da click al botón de buscar
    await page.click("#form1\\:butBuscarJuicios")

    //Espera hasta que la etiqueta td tenga contenido (Si tiene contenido se cierra la ventana)
    await page.waitForFunction(() => {
        const celda = document.querySelector("#form1\\:dataTableJuicios2_data td")
        return celda && celda.textContent.trim().length > 0
    }, { timeout: 60000 })

    //Recorro las filas de la tabla y obtengo los datos
    const resultados = await page.$$eval("#form1\\:dataTableJuicios2_data tr", (filas) => {
        return filas.map((fila) => {
            const columnas = fila.querySelectorAll("td")
            return {
                provincia: columnas[0]?.innerText.trim(),
                canton: columnas[1]?.innerText.trim(),
                judicatura: columnas[2]?.innerText.trim(),
                numeroCausa: columnas[4]?.innerText.trim(),
                demandado: columnas[5]?.innerText.trim(),
                proceso: columnas[5]?.innerText.trim(),
                fechaRazonCopias: columnas[6]?.innerText.trim(),
                fechaRazonEnvio: columnas[7]?.innerText.trim(),
                fechaBoletasRecibidas: columnas[8]?.innerText.trim(),
                fechaDevolucion: columnas[9]?.innerText.trim(),
                fechaAsignacionCitado: columnas[10]?.innerText.trim(),
                estado: columnas[11]?.innerText.trim(),
                fechaActaCitacion: columnas[12]?.innerText.trim(),
                tiposCitacion: columnas[13]?.innerText.trim(),
                observacion: columnas[14]?.innerText.trim(),
            }
        })
    })

    console.log("\nDatos Citacion:")
    console.log(resultados)

  } catch (error) {
    console.error("\n❌ No se encontraron resultados. Verifica que los datos ingresados fueron correctos.")
  }

  await browser.close()
}

obtenerCitacionesJudiciales(cedula)