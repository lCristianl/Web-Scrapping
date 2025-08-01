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
}

interface Proceso {
  id: string
  fecha: string
  numeroProceso: string
  accionInfraccion: string
  rolEnProceso?: string
}

interface ProcesosJudicialesData {
  cedula: string
  procesos: {
    resultadosActor: Proceso[]
    resultadosDemandado: Proceso[]
  }
  totalProcesosActor: number
  totalProcesosDemandado: number
  fechaConsulta: string
  estado: string
}

export function ProcesosJudicialesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [result, setResult] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [procesosData, setProcesosData] = useState<ProcesosJudicialesData | null>(null)
  const [showCards, setShowCards] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>()

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setShowCards(false)
    setProcesosData(null)

    try {
      const response = await fetch("http://localhost:3001/api/procesos-judiciales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cedula: data.cedula }),
      })

      const resultado = await response.json()

      if (resultado.success) {
        const datos = resultado.data

        // Calcular total de procesos
        const totalProcesos = (datos.procesos.resultadosActor?.length || 0) + 
                             (datos.procesos.resultadosDemandado?.length || 0)

        if (totalProcesos > 0) {
          setProcesosData(datos)
          setShowCards(true)
        } else {
          setResult(`No se encontraron procesos judiciales para la cédula ${data.cedula}.`)
          setIsModalOpen(true)
        }
      } else {
        setResult(`Error: ${resultado.error || "Error desconocido"}`)
        setIsModalOpen(true)
      }
    } catch (error) {
      console.error("Error al consultar procesos judiciales:", error)
      setResult("Error de conexión. Verifique que el servidor backend esté funcionando.")
      setIsModalOpen(true)
    } finally {
      setIsLoading(false)
    }
  }

  const formatearFecha = (fecha: string): string => {
    try {
      const [, dia, mes, año] = fecha.match(/(\d{2})\/(\d{2})\/(\d{4})/) || []
      // Crear fecha correctamente: año, mes (0-indexado), día
      const fechaFormatear = new Date(parseInt(año), parseInt(mes) - 1, parseInt(dia))
      
      return fechaFormatear.toLocaleDateString('es-EC', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return fecha
    }
  }

  const obtenerTipoProceso = (accionInfraccion: string): { tipo: string, color: string, icono: string } => {
    const accion = accionInfraccion.toLowerCase()
    
    if (accion.includes('penal') || accion.includes('delito')) {
      return { tipo: 'Penal', color: 'bg-red-100 text-red-800', icono: '⚖️' }
    } else if (accion.includes('civil') || accion.includes('daños')) {
      return { tipo: 'Civil', color: 'bg-blue-100 text-blue-800', icono: '📋' }
    } else if (accion.includes('laboral') || accion.includes('trabajo')) {
      return { tipo: 'Laboral', color: 'bg-green-100 text-green-800', icono: '💼' }
    } else if (accion.includes('familia') || accion.includes('alimentos')) {
      return { tipo: 'Familia', color: 'bg-purple-100 text-purple-800', icono: '👨‍👩‍👧‍👦' }
    } else if (accion.includes('tránsito') || accion.includes('transito')) {
      return { tipo: 'Tránsito', color: 'bg-orange-100 text-orange-800', icono: '🚗' }
    } else {
      return { tipo: 'Otros', color: 'bg-gray-100 text-gray-800', icono: '📄' }
    }
  }

  const ProcesosCards = ({ procesos, titulo, rol }: { 
    procesos: Proceso[], 
    titulo: string, 
    rol: 'actor' | 'demandado' 
  }) => (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {rol === 'actor' ? '🛡️' : '⚠️'} {titulo}
          <span className="text-sm font-normal text-muted-foreground">
            ({procesos.length} {procesos.length === 1 ? 'proceso' : 'procesos'})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {procesos.map((proceso, index) => {
            const tipoInfo = obtenerTipoProceso(proceso.accionInfraccion)
            
            return (
              <Card key={index} className="border border-gray-200 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header del proceso */}
                    <div className="border-b pb-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-blue-600">
                            Proceso #{proceso.numeroProceso}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            ID: {proceso.id}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${tipoInfo.color}`}>
                          {tipoInfo.icono} {tipoInfo.tipo}
                        </span>
                      </div>
                    </div>

                    {/* Información del proceso */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-sm text-blue-800 mb-2 flex items-center gap-2">
                        📋 Acción/Infracción
                      </h4>
                      <p className="text-sm text-blue-700 leading-relaxed">
                        {proceso.accionInfraccion}
                      </p>
                    </div>

                    {/* Rol en el proceso */}
                    <div className={`p-4 rounded-lg ${
                      rol === 'actor' 
                        ? 'bg-green-50 border border-green-200' 
                        : 'bg-orange-50 border border-orange-200'
                    }`}>
                      <h4 className={`font-semibold text-sm mb-2 flex items-center gap-2 ${
                        rol === 'actor' ? 'text-green-800' : 'text-orange-800'
                      }`}>
                        {rol === 'actor' ? '🛡️ Participación como Actor/Ofendido' : '⚠️ Participación como Demandado/Procesado'}
                      </h4>
                      <p className={`text-sm ${
                        rol === 'actor' ? 'text-green-700' : 'text-orange-700'
                      }`}>
                        {rol === 'actor' 
                          ? 'Esta persona inició el proceso judicial o es la parte ofendida'
                          : 'Esta persona es objeto del proceso judicial o la parte demandada'
                        }
                      </p>
                    </div>

                    {/* Detalles adicionales */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-600">Fecha del Proceso:</span>
                          <span className="text-sm font-semibold text-gray-800">
                            {formatearFecha(proceso.fecha)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-600">Número de Proceso:</span>
                          <span className="text-sm font-mono text-gray-800">{proceso.numeroProceso}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-600">ID del Sistema:</span>
                          <span className="text-sm font-mono text-gray-800">{proceso.id}</span>
                        </div>
                      </div>
                    </div>

                    {/* Estado del proceso */}
                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-600">📊</span>
                        <p className="text-sm text-yellow-800 font-medium">
                          Proceso Judicial Registrado
                        </p>
                      </div>
                      <p className="text-xs text-yellow-600 mt-1">
                        Este proceso se encuentra registrado en el sistema judicial ecuatoriano.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
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
            <h1 className="text-lg font-semibold">Procesos Judiciales</h1>
          </div>
        </div>
      </header>

      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Consulta de Procesos Judiciales</CardTitle>
              <CardDescription>
                Busca información sobre procesos judiciales donde la persona participe como actor/ofendido o demandado/procesado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <span className="text-blue-600 text-xl">ℹ️</span>
                    <div>
                      <h4 className="font-semibold text-blue-800 mb-1">Información Importante</h4>
                      <p className="text-sm text-blue-700">
                        Esta consulta busca procesos donde la cédula aparezca tanto como 
                        actor/ofendido como demandado/procesado en el sistema judicial.
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
                        Esta consulta puede tomar varios segundos ya que busca en ambos roles 
                        y los datos se actualizan automáticamente en la base de datos.
                      </p>
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Consultando... (Esto puede tomar unos segundos)" : "Consultar"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {showCards && procesosData && (
            <div className="space-y-6">
              {/* Resumen estadístico */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Resumen de Procesos Judiciales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-3xl font-bold text-blue-600">
                        {(procesosData.procesos.resultadosActor?.length || 0) + 
                         (procesosData.procesos.resultadosDemandado?.length || 0)}
                      </div>
                      <div className="text-sm text-blue-600">Total de Procesos</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {procesosData.totalProcesosActor}
                      </div>
                      <div className="text-sm text-green-600">Como Actor/Ofendido</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {procesosData.totalProcesosDemandado}
                      </div>
                      <div className="text-sm text-orange-600">Como Demandado/Procesado</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-sm font-bold text-purple-600">{procesosData.cedula}</div>
                      <div className="text-sm text-purple-600">Cédula Consultada</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Procesos como Actor/Ofendido */}
              {procesosData.procesos.resultadosActor && procesosData.procesos.resultadosActor.length > 0 && (
                <ProcesosCards 
                  procesos={procesosData.procesos.resultadosActor}
                  titulo="Procesos como Actor/Ofendido"
                  rol="actor"
                />
              )}

              {/* Procesos como Demandado/Procesado */}
              {procesosData.procesos.resultadosDemandado && procesosData.procesos.resultadosDemandado.length > 0 && (
                <ProcesosCards 
                  procesos={procesosData.procesos.resultadosDemandado}
                  titulo="Procesos como Demandado/Procesado"
                  rol="demandado"
                />
              )}

              {/* Información legal */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">📖 Información Legal</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm text-gray-600">
                    <p>
                      <strong>Actor/Ofendido:</strong> Persona que inicia un proceso judicial o es víctima de una infracción.
                    </p>
                    <p>
                      <strong>Demandado/Procesado:</strong> Persona contra quien se dirige un proceso judicial.
                    </p>
                    <p>
                      <strong>Fuente:</strong> Sistema de Procesos Judiciales - Función Judicial del Ecuador.
                    </p>
                    <p>
                      <strong>Actualización:</strong> Los datos se actualizan automáticamente y se almacenan 
                      para consultas futuras más rápidas.
                    </p>
                    <p>
                      <strong>Nota:</strong> Esta información tiene carácter referencial. Para información 
                      oficial, consulte directamente con la Función Judicial.
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
        title="Resultado de Consulta - Procesos Judiciales"
        result={result}
      />
    </div>
  )
}
