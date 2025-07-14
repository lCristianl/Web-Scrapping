import { chromium } from "playwright"

//DATOS SIMULADOS
const cedula = "1102961867"
const tipoConsulta = "actor" 

export const obtenerTitulos = async (cedula, tipoConsulta) => {
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()
  try {
    await page.goto("https://procesosjudiciales.funcionjudicial.gob.ec/busqueda-filtros", {
      waitUntil: "domcontentloaded"
    })

    //Si el tipo de consulta es por el número de cedula del actor o del ofendido
    if (["actor", "ofendido"].includes(tipoConsulta.toLowerCase())) {
      // Rellenamos el campo de cédula
      await page.type('input[formcontrolname="cedulaActor"]', cedula)    
      // Se le da click al botón de buscar
      await page.waitForSelector('.boton-buscar:not([disabled])', { timeout: 5000 })
      await page.click('.boton-buscar')

      //Espera hasta que aparaezca la etiqueta que tiene la clase cuerpo
      await page.waitForSelector(".cuerpo", { timeout: 60000 })
      await extraerDatos(page)

      //Si el tipo de consulta es por el número de cedula del demandado o procesado
    } else if (["demandado", "procesado"].includes(tipoConsulta.toLowerCase())) {
      // Rellenamos el campo de cédula
      await page.fill('input[formcontrolname="cedulaDemandado"]', cedula)
      // Se le da click al botón de buscar
      await page.waitForSelector('.boton-buscar:not([disabled])', { timeout: 5000 })
      await page.click('.boton-buscar')

      //Espera hasta que aparaezca la etiqueta que tiene la clase cuerpo
      await page.waitForSelector(".cuerpo", { timeout: 60000 })
      await extraerDatos(page)

    } else {
      throw new Error("Tipo de consulta no válido. Debe ser 'actor/ofendido' o 'demandado/procesado'.")
    }
  } catch (error) {
    console.error("\n❌ Error:", error.message)
  } finally{
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


    console.log("\nRegistros encontrados:")
    console.log(resultados)

  } catch (error) {
    console.error("\n❌ No se encontraron resultados. Verifica que los datos ingresados fueron correctos.", error.message)
  }
}

// Llamada a la función con el número de cédula
obtenerProcesos(cedula, tipoConsulta).catch(console.error)