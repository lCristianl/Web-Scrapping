import { useState } from "react"
import { useForm } from "react-hook-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ResultModal } from "@/components/result-modal"

type FormData = {
  cedula: string
  fechaNacimiento: string
}

interface CertificadoIESSData {
  cedula: string
  fechaNacimiento: string
  nombre: string
  registradoComoEmpleador: boolean
  estadoActividad: string | null
  mensaje: string
  fechaConsulta: string
  estado: string
  error?: string
}

export function CertificadosIESSPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [result, setResult] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [certificadoData, setCertificadoData] = useState<CertificadoIESSData | null>(null)
  const [showCards, setShowCards] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<FormData>()

  // Función para formatear la fecha automáticamente
  const formatearFechaInput = (value: string) => {
    // Remover cualquier caracter que no sea número
    const soloNumeros = value.replace(/\D/g, '')
    
    // Limitar a 8 dígitos
    const limitado = soloNumeros.slice(0, 8)
    
    // Formatear como DD/MM/YYYY
    let formateado = limitado
    if (limitado.length >= 3) {
      formateado = limitado.slice(0, 2) + '/' + limitado.slice(2)
    }
    if (limitado.length >= 5) {
      formateado = limitado.slice(0, 2) + '/' + limitado.slice(2, 4) + '/' + limitado.slice(4)
    }
    
    return formateado
  }

  // Función para convertir fecha DD/MM/YYYY a YYYYMMDD
  const convertirFechaParaBackend = (fechaFormateada: string): string => {
    const soloNumeros = fechaFormateada.replace(/\D/g, '')
    
    if (soloNumeros.length === 8) {
      const dia = soloNumeros.slice(0, 2)
      const mes = soloNumeros.slice(2, 4)
      const año = soloNumeros.slice(4, 8)
      return año + mes + dia // YYYYMMDD
    }
    
    return soloNumeros
  }

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setShowCards(false)
    setCertificadoData(null)

    try {
      // Convertir fecha al formato requerido por el backend
      const fechaBackend = convertirFechaParaBackend(data.fechaNacimiento)
      
      const response = await fetch("http://localhost:3001/api/certificado-iess", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          cedula: data.cedula,
          fechaNacimiento: fechaBackend
        }),
      })

      const resultado = await response.json()

      if (resultado.success) {
        const datos = resultado.data

        if (datos.error) {
          // Manejar errores específicos del scraper
          let mensajeError = ""
          switch (datos.error) {
            case 'cedula_invalida':
              mensajeError = `La cédula ${data.cedula} es inválida o no está registrada en el IESS.`
              break
            case 'fecha_incorrecta':
              mensajeError = `La fecha de nacimiento ingresada es incorrecta para la cédula ${data.cedula}.`
              break
            default:
              mensajeError = `Error: ${datos.error}`
          }
          setResult(mensajeError)
          setIsModalOpen(true)
        } else {
          setCertificadoData(datos)
          setShowCards(true)
        }
      } else {
        setResult(`Error: ${resultado.error || "Error desconocido"}`)
        setIsModalOpen(true)
      }
    } catch (error) {
      console.error("Error al consultar certificado IESS:", error)
      setResult("Error de conexión. Verifique que el servidor backend esté funcionando.")
      setIsModalOpen(true)
    } finally {
      setIsLoading(false)
    }
  }

  const formatearFecha = (fecha: string): string => {
    try {
      return new Date(fecha).toLocaleDateString('es-EC', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return fecha
    }
  }

  const CertificadoCard = ({ certificado }: { certificado: CertificadoIESSData }) => (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🏛️ Certificado de Empleador IESS
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Información personal */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-sm text-blue-800 mb-3 flex items-center gap-2">
              👤 Información Personal
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-blue-600">Nombre:</span>
                <p className="text-sm font-semibold text-blue-800">{certificado.nombre}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-blue-600">Cédula:</span>
                <p className="text-sm font-mono text-blue-800">{certificado.cedula}</p>
              </div>
            </div>
          </div>

          {/* Estado del empleador */}
          <div className={`p-4 rounded-lg border ${
            certificado.registradoComoEmpleador
              ? certificado.estadoActividad?.toLowerCase() === 'activo'
                ? 'bg-green-50 border-green-200'
                : 'bg-yellow-50 border-yellow-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <h4 className={`font-semibold text-sm mb-3 flex items-center gap-2 ${
              certificado.registradoComoEmpleador
                ? certificado.estadoActividad?.toLowerCase() === 'activo'
                  ? 'text-green-800'
                  : 'text-yellow-800'
                : 'text-red-800'
            }`}>
              {certificado.registradoComoEmpleador
                ? certificado.estadoActividad?.toLowerCase() === 'activo'
                  ? '✅ Empleador Registrado - ACTIVO'
                  : '⚠️ Empleador Registrado - INACTIVO'
                : '❌ No Registrado como Empleador'
              }
            </h4>
            <p className={`text-sm ${
              certificado.registradoComoEmpleador
                ? certificado.estadoActividad?.toLowerCase() === 'activo'
                  ? 'text-green-700'
                  : 'text-yellow-700'
                : 'text-red-700'
            }`}>
              {certificado.mensaje}
            </p>
            
            {certificado.estadoActividad && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <span className="text-xs font-medium text-gray-600">Estado de Actividad:</span>
                <p className="text-sm font-semibold text-gray-800 capitalize">
                  {certificado.estadoActividad}
                </p>
              </div>
            )}
          </div>

          {/* Información adicional */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-600">Fecha de Consulta:</span>
                <p className="text-sm font-semibold text-gray-800">
                  {formatearFecha(certificado.fechaConsulta)}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Estado de Consulta:</span>
                <p className="text-sm font-semibold text-gray-800 capitalize">
                  {certificado.estado}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4">
          <SidebarTrigger />
          <div className="ml-4">
            <h1 className="text-lg font-semibold">Certificados IESS</h1>
          </div>
        </div>
      </header>

      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Consulta de Certificado de Empleador IESS</CardTitle>
              <CardDescription>
                Verifica si una persona está registrada como empleador en el Instituto Ecuatoriano de Seguridad Social.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cedula">Número de Cédula</Label>
                    <Input
                      id="cedula"
                      placeholder="Ej: 1234567890"
                      {...register("cedula", {
                        required: "La cédula es requerida",
                        pattern: {
                          value: /^\d{10}$/,
                          message: "La cédula debe tener 10 dígitos",
                        },
                      })}
                    />
                    {errors.cedula && <p className="text-sm text-destructive">{errors.cedula.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fechaNacimiento">Fecha de Nacimiento</Label>
                    <Input
                      id="fechaNacimiento"
                      placeholder="DD/MM/YYYY"
                      maxLength={10}
                      {...register("fechaNacimiento", {
                        required: "La fecha de nacimiento es requerida",
                        pattern: {
                          value: /^\d{2}\/\d{2}\/\d{4}$/,
                          message: "Formato: DD/MM/YYYY",
                        },
                        onChange: (e) => {
                          const formateado = formatearFechaInput(e.target.value)
                          setValue("fechaNacimiento", formateado, { shouldValidate: true })
                        }
                      })}
                    />
                    {errors.fechaNacimiento && <p className="text-sm text-destructive">{errors.fechaNacimiento.message}</p>}
                    <p className="text-xs text-gray-600">Ingrese la fecha en formato DD/MM/YYYY</p>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <span className="text-blue-600 text-xl">ℹ️</span>
                    <div>
                      <h4 className="font-semibold text-blue-800 mb-1">Información Importante</h4>
                      <p className="text-sm text-blue-700">
                        Esta consulta verifica el estado de registro como empleador en el IESS. 
                        Se requiere la fecha de nacimiento exacta para la verificación.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-start gap-3">
                    <span className="text-yellow-600 text-xl">⏱️</span>
                    <div>
                      <h4 className="font-semibold text-yellow-800 mb-1">Tiempo de Procesamiento</h4>
                      <p className="text-sm text-yellow-700">
                        Esta consulta puede tomar varios minutos ya que se conecta directamente 
                        al sistema del IESS y procesa documentos PDF.
                      </p>
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Consultando... (Esto puede tomar unos minutos)" : "Consultar Certificado"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {showCards && certificadoData && (
            <div className="space-y-6">
              <CertificadoCard certificado={certificadoData} />

              {/* Información legal */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">📖 Información Legal</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm text-gray-600">
                    <p>
                      <strong>IESS:</strong> Instituto Ecuatoriano de Seguridad Social, entidad responsable 
                      del registro de empleadores en Ecuador.
                    </p>
                    <p>
                      <strong>Certificado de Empleador:</strong> Documento oficial que certifica si una persona 
                      está registrada como empleador en el sistema de seguridad social.
                    </p>
                    <p>
                      <strong>Estados:</strong> ACTIVO (puede contratar empleados), INACTIVO (registrado pero sin actividad), 
                      NO REGISTRADO (no puede actuar como empleador).
                    </p>
                    <p>
                      <strong>Fuente:</strong> Portal oficial del IESS - Información obtenida en tiempo real 
                      del sistema oficial.
                    </p>
                    <p>
                      <strong>Nota:</strong> Esta información tiene carácter oficial. Los datos se obtienen 
                      directamente del sistema del IESS.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      <ResultModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Resultado de Consulta - Certificado IESS"
        result={result}
      />
    </div>
  )
}