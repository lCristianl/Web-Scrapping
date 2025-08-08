import { obtenerSuperciasEmpresas } from '../Scrapers/superCias.mjs';

export async function consultarSuperciasEmpresas(req, res) {
  try {
    const datos = await obtenerSuperciasEmpresas();
    if (datos.length === 0) {
      return res.json({ success: false, message: 'No se encontraron datos' });
    }
    res.json({ success: true, data: datos });
  } catch (error) {
    console.error('Error al consultar Supercias Empresas:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
}
