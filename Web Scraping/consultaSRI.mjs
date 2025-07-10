import { chromium } from "playwright"

const browser = await chromium.launch({ headless: false })
const page = await browser.newPage()

await page.goto("https://srienlinea.sri.gob.ec/sri-en-linea/SriRucWeb/ConsultaRuc/Consultas/consultaRuc", {
  waitUntil: "domcontentloaded"
})

try {
  //Espera hasta que aparaezca la etiqueta que tiene la clase row
  await page.waitForSelector("sri-mostrar-contribuyente", { timeout: 60000 })
  await page.click(".ui-button.cyan-btn.ui-widget.ui-state-default.ui-corner-all.ui-button-text-only")
  await page.waitForSelector("sri-listar-establecimientos", { timeout: 60000 })

  //
  const estado = await page.$$eval("sri-mostrar-contribuyente", (elementos) => {
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


  console.log("\nRegistros encontrados:")
  console.log(estado)
    console.log("\nEstablecimientos encontrados:")
  console.log(establecimientos)

} catch (error) {
  console.error("\n❌ No se encontraron resultados. Verifica que los datos ingresados fueron correctos.")
}

await browser.close()
