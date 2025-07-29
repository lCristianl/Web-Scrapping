import { obtenerProcesos } from '../Scrapers/procesosJudiciales.mjs'

export const consultarProcesosJudiciales = async (req, res) => {
  try {
    const { cedula } = req.body
    
    console.log(`🔍 Iniciando consulta de procesos judiciales para cédula: ${cedula}`)
    
    const resultado = await obtenerProcesos(cedula)
    
    res.json({
      success: true,
      data: resultado,
      message: 'Consulta de procesos judiciales completada'
    })
    
  } catch (error) {
    console.error('❌ Error en consultarProcesosJudiciales:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor'
    })
  }
}