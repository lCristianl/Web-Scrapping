import { obtenerAntecedentesPenales } from '../Scrapers/antecedentesPenales.mjs'

export const consultarAntecedentesPenales = async (req, res) => {
  try {
    const { cedula } = req.body
    
    console.log(`🔍 Iniciando consulta de antecedentes penales para cédula: ${cedula}`)
    
    const resultado = await obtenerAntecedentesPenales(cedula)
    
    res.json({
      success: true,
      data: resultado,
      message: 'Consulta de antecedentes penales completada'
    })
    
  } catch (error) {
    console.error('Error en consultarAntecedentesPenales:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor'
    })
  }
}