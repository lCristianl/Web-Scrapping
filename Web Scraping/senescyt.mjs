import { chromium } from "playwright"

// Datos simulados
const cedula = "1102961867"

export const obtenerDatos = async (cedula) => {
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()

  await page.goto("https://www.senescyt.gob.ec/consulta-titulos-web/faces/vista/consulta/consulta.xhtml", {
    waitUntil: "domcontentloaded"
  })

  try {

    await page.type("#formPrincipal\\:identificacion", cedula) 

    //Espera hasta que aparezca la tabla en la pagina (Cuando ya se muestra la tabla se cierra la ventana)
    await page.waitForSelector("tbody[id$='tablaAplicaciones_data']", { timeout: 60000 })

    //Recorro las filas de la tabla y obtengo los datos
    const resultados = await page.$$eval("tbody[id$='tablaAplicaciones_data'] tr", (filas) => {
      return filas.map((fila) => {
        const columnas = fila.querySelectorAll("td")
        return {
          titulo: columnas[0]?.innerText.trim(),
          institucion: columnas[1]?.innerText.trim(),
          tipo: columnas[2]?.innerText.trim(),
          fechaRegistro: columnas[5]?.innerText.trim(),
          area: columnas[6]?.innerText.trim(),
        }
      })
    })

    console.log("\nTítulos encontrados:")
    console.log(resultados)

  } catch (error) {
    console.error("\n❌ No se encontraron resultados. Verifica que los datos ingresados fueron correctos.")
  }
  await browser.close()
}

obtenerDatos(cedula)