import { chromium } from "playwright"

//DATOS SIMULADOS
const cedula = "1102961867"

export const obtenerPensiones = async (cedula) => {

  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()

  await page.goto("https://supa.funcionjudicial.gob.ec/pensiones/publico/consulta.jsf", {
    waitUntil: "domcontentloaded"
  })

  try {
    // Rellenamos el campo de cédula
    await page.type("#form\\:t_texto_cedula", cedula) 

    //Espera hasta que se le de click al botón de buscar (Cuando se le da click se cierra la ventana)
    await page.click("#form\\:b_buscar_cedula")

    //Recorro las filas de la tabla y obtengo los datos
    const resultados = await page.$$eval("#form\\:j_idt57_data tr", (filas) => {
        return filas.map((fila) => {
        const columnas = fila.querySelectorAll("td")
        return {
            codigo: columnas[0]?.innerText.trim(),
            numProcesoJudicial: columnas[1]?.innerText.trim(),
            dependenciaJurisdiccional: columnas[2]?.innerText.trim(),
            tipoPension: columnas[3]?.innerText.trim(),
            intervinientes: columnas[4]?.innerText.trim(),
            detalle: columnas[5]?.innerText.trim(),
        }
        })
    })

    console.log("\nPensiones encontradas:")
    console.log(resultados)

  } catch (error) {
    console.error("\n❌ No se encontraron resultados. Verifica que los datos ingresados fueron correctos.")
  }

  await browser.close()
}

obtenerPensiones(cedula)