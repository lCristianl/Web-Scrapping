import { chromium } from "playwright"
import { MongoClient } from "mongodb"

// Parámetros de conexión
const uri = "mongodb://localhost:27017"
const dbName = "webScraping"
const collectionName = "consejoJudicatura"

// Datos simulados
const nombre = "jorge"
const tipoBusqueda = "provincias" // PROVINCIAS - INSTITUCIONES
//En caso de que el tipo de busqueda sea "instituciones" se pueden pasar las siguientes opciones (CONSEJO DE LA JUDICATURA - CORTE NACIONAL DE JUSTICIA)
const institucion = "consejo de la judicatura" // CONSEJO DE LA JUDICATURA - CORTE NACIONAL DE JUSTICIA
//En caso de que el tipo de busqueda sea "provincias"
const provincia = "loja" 
const canton = "loja"

export const obtenerConsejoJudicatura = async (nombre, tipoBusqueda, provinciaInstitucion = null, canton = null) => {
    const browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    await page.goto("https://appsj.funcionjudicial.gob.ec/informativo/pages/directorio.jsf", {
        waitUntil: "domcontentloaded"
    })

    try {
        // Rellenamos el campo de nombre del funcionario
        await page.type("#nameOfficial", nombre)
        // Seleccionamos el campo de tipo de busqueda
        await page.selectOption('select#j_idt32', tipoBusqueda.toUpperCase())
        if (provinciaInstitucion !== null) {
            // Seleccionamos el campo de provincia o institucion
            await page.selectOption('select#j_idt37', provinciaInstitucion.toUpperCase())
        }
        if (tipoBusqueda.toLowerCase() === "provincias" &&  canton !== null) {
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

        //Si se ecnontró la etiqueta que tiene la clase mat-mdc-simple-snack-bar PRIMERO (No se encontraron resultados)
        if (estado === 'no_resultados') {
            console.log(`ℹ️ No se encontraron resultados para ${nombre} en ${tipoBusqueda}`)
            return
        } else {
            
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

            console.log("\nConsejo de la Judicatura:")
            console.log(resultadosTotales)

            // Guardar en MongoDB solo los resultados
            if (resultadosTotales.length > 0) {
                // Conectar a MongoDB
                const client = new MongoClient(uri)
                await client.connect()
                const db = client.db(dbName)
                const collection = db.collection(collectionName)

                // Verificar si ya existen registros similares
                const doc = await collection.findOne({ tipo: "funcionarios_judicatura" })

                if (!doc) {
                    // Insertar nuevo documento
                    await collection.insertOne({ 
                        tipo: "funcionarios_judicatura",
                        fechaActualizacion: new Date(),
                        funcionarios: resultadosTotales 
                    })
                    console.log(`✅ Se guardaron ${resultadosTotales.length} funcionarios en la base de datos.`)
                } else {
                    // Evitar duplicados basándose en funcionario, cargo y departamento
                    const existentes = doc.funcionarios || []
                    const nuevos = resultadosTotales.filter(nuevo =>
                        !existentes.some(existente => 
                            existente.funcionario === nuevo.funcionario &&
                            existente.cargo === nuevo.cargo &&
                            existente.departamento === nuevo.departamento
                        )
                    )

                    if (nuevos.length > 0) {
                        await collection.updateOne(
                            { tipo: "funcionarios_judicatura" },
                            { 
                                $push: { funcionarios: { $each: nuevos } },
                                $set: { fechaActualizacion: new Date() }
                            }
                        )
                        console.log(`✅ Se agregaron ${nuevos.length} nuevos funcionarios a la base de datos.`)
                    } else {
                        console.log("⚠️ Ya existen los funcionarios en la base de datos.")
                    }
                }

                await client.close()
            } else {
                console.log("ℹ️ No hay datos para guardar en la base de datos.")
            }
        }

    } catch (error) {
        console.error("\n❌ Error:", error.message)
    } finally {
        await browser.close()
    }
}

obtenerConsejoJudicatura(nombre, tipoBusqueda, provincia, canton)