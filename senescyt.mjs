import { chromium } from "playwright"

const browser = await chromium.launch({ headless: false })
const page = await browser.newPage()

console.log("Abriendo página de SENESCYT...")
await page.goto("https://www.senescyt.gob.ec/consulta-titulos-web/faces/vista/consulta/consulta.xhtml", {
  waitUntil: "domcontentloaded"
})

console.log("Por favor, llena el formulario manualmente (cédula y captcha) y haz clic en Buscar.")

try {
  await page.waitForSelector("tbody[id$='tablaAplicaciones_data']", { timeout: 60000 })

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
