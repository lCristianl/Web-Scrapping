import { obtenerPensiones } from '../Scrapers/pensionAlimenticia.mjs'

export const consultarPensionAlimenticia = async (req, res) => {
  try {
    const { cedula } = req.body
    
    console.log(`🔍 Iniciando consulta de pensiones alimenticias para cédula: ${cedula}`)
    
    const resultado = await obtenerPensiones(cedula)
    
    res.json({
      success: true,
      data: resultado,
      message: 'Consulta de pensiones alimenticias completada'
    })
    
  } catch (error) {
    console.error('❌ Error en consultarPensionAlimenticia:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor'
    })
  }
}