import { chromium } from "playwright"

const browser = await chromium.launch({ headless: false })
const page = await browser.newPage()

await page.goto("https://procesosjudiciales.funcionjudicial.gob.ec/busqueda-filtros", {
  waitUntil: "domcontentloaded"
})

try {
  //Espera hasta que aparaezca la etiqueta que tiene la clase cuerpo
  await page.waitForSelector(".cuerpo", { timeout: 60000 })

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


  console.log("\nRegistros encontrados:")
  console.log(resultados)

} catch (error) {
  console.error("\n❌ No se encontraron resultados. Verifica que los datos ingresados fueron correctos.")
}

await browser.close()
