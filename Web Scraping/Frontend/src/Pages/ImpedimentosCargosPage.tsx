import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ResultModal } from "@/components/result-modal"

interface Impedimento {
  causalImpedimiento: string
  respaldos: string
}

interface ImpedimentosData {
  tipo: string
  impedimentos: Impedimento[]
  totalImpedimentos: number
  fechaConsulta: string
}

export function ImpedimentosCargosPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [result, setResult] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [impedimentosData, setImpedimentosData] = useState<ImpedimentosData | null>(null)
  const [showCards, setShowCards] = useState(false)

  const handleConsultar = async () => {
    setIsLoading(true)
    setShowCards(false)
    setImpedimentosData(null)

    try {
      const response = await fetch("http://localhost:3001/api/impedimentos-cargos-publicos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const resultado = await response.json()

      if (resultado.success) {
        const { impedimentos, totalImpedimentos, fechaConsulta, tipo } = resultado.data

        if (totalImpedimentos > 0) {
          setImpedimentosData({
            tipo,
            impedimentos,
            totalImpedimentos,
            fechaConsulta
          })
          setShowCards(true)
        } else {
          setResult("No se encontraron impedimentos para cargos públicos registrados en el sistema.")
          setIsModalOpen(true)
        }
      } else {
        setResult(`Error: ${resultado.error || "Error desconocido"}`)
        setIsModalOpen(true)
      }
    } catch (error) {
      console.error("Error al consultar impedimentos:", error)
      setResult("Error de conexión. Verifique que el servidor backend esté funcionando.")
      setIsModalOpen(true)
    } finally {
      setIsLoading(false)
    }
  }

  const ImpedimentosCards = ({ impedimentos }: { impedimentos: Impedimento[] }) => (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          ⚖️ Impedimentos para Cargos Públicos
          <span className="text-sm font-normal text-muted-foreground">
            ({impedimentos.length} {impedimentos.length === 1 ? 'impedimento' : 'impedimentos'})
          </span>
        </CardTitle>
        <CardDescription>
          Lista completa de causales que impiden ejercer cargos en el sector público
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4">
          {impedimentos.map((impedimento, index) => (
            <Card key={index} className="border border-gray-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header del impedimento */}
                  <div className="border-b pb-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-red-600 font-bold text-sm">
                          {impedimento.causalImpedimiento.match(/^\d+/) || index + 1}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-red-700 leading-tight">
                          {impedimento.causalImpedimiento}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* Contenido del impedimento */}
                  <div className="space-y-3">
                    {/* Respaldos/Documentación requerida */}
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <h4 className="font-semibold text-sm text-orange-800 mb-2 flex items-center gap-2">
                        📋 Documentación y Respaldos Requeridos
                      </h4>
                      <p className="text-sm text-orange-700 leading-relaxed">
                        {impedimento.respaldos}
                      </p>
                    </div>

                    {/* Información adicional */}
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-yellow-600">⚠️</span>
                        <h4 className="font-semibold text-sm text-yellow-800">
                          Importante
                        </h4>
                      </div>
                      <p className="text-xs text-yellow-700">
                        Este impedimento debe ser verificado y documentado según la normativa vigente 
                        antes de cualquier designación en cargo público.
                      </p>
                    </div>

                    {/* Clasificación del impedimento */}
                    <div className="flex flex-wrap gap-2">
                      {impedimento.causalImpedimiento.toLowerCase().includes('judicial') && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                          Origen Judicial
                        </span>
                      )}
                      {impedimento.causalImpedimiento.toLowerCase().includes('destitución') && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                          Sanción Administrativa
                        </span>
                      )}
                      {impedimento.causalImpedimiento.toLowerCase().includes('indemnización') && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                          Compensación Económica
                        </span>
                      )}
                      {impedimento.causalImpedimiento.toLowerCase().includes('interdicción') && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">
                          Incapacidad Legal
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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
            <h1 className="text-lg font-semibold">Impedimentos Cargos Públicos</h1>
          </div>
        </div>
      </header>

      <div className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Consulta de Impedimentos para Cargos Públicos</CardTitle>
              <CardDescription>
                Consulta la lista oficial de causales que impiden ejercer cargos en el sector público según la normativa vigente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <span className="text-blue-600 text-xl">ℹ️</span>
                    <div>
                      <h4 className="font-semibold text-blue-800 mb-1">Información Importante</h4>
                      <p className="text-sm text-blue-700">
                        Esta consulta obtendrá la información actualizada directamente desde el portal oficial 
                        del Gobierno del Ecuador sobre impedimentos para ejercer cargos públicos.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-start gap-3">
                    <span className="text-yellow-600 text-xl">⚖️</span>
                    <div>
                      <h4 className="font-semibold text-yellow-800 mb-1">Marco Legal</h4>
                      <p className="text-sm text-yellow-700">
                        Los impedimentos están basados en la Constitución de la República, 
                        Ley Orgánica de Servicio Público (LOSEP) y demás normativa aplicable.
                      </p>
                    </div>
                  </div>
                </div>

                <Button onClick={handleConsultar} className="w-full" disabled={isLoading}>
                  {isLoading ? "Consultando..." : "Consultar Impedimentos"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {showCards && impedimentosData && (
            <div className="space-y-6">
              {/* Resumen */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Resumen de Impedimentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-3xl font-bold text-red-600">{impedimentosData.totalImpedimentos}</div>
                      <div className="text-sm text-red-600">Total de Causales</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-sm font-bold text-blue-600">
                        {new Date(impedimentosData.fechaConsulta).toLocaleDateString('es-EC')}
                      </div>
                      <div className="text-sm text-blue-600">Fecha de Consulta</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-sm font-bold text-green-600 capitalize">
                        {impedimentosData.tipo ? impedimentosData.tipo.replace('_', ' ') : 'Impedimentos Cargos Públicos'}
                      </div>
                      <div className="text-sm text-green-600">Tipo de Consulta</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cards de Impedimentos */}
              <ImpedimentosCards impedimentos={impedimentosData.impedimentos} />

              {/* Información adicional */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">📖 Información Adicional</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm text-gray-600">
                    <p>
                      <strong>Nota:</strong> Esta información es de carácter informativo y debe ser verificada 
                      con las autoridades competentes para cada caso específico.
                    </p>
                    <p>
                      <strong>Fuente:</strong> Portal oficial del Gobierno del Ecuador - 
                      Registro de impedimentos para laborar en el sector público.
                    </p>
                    <p>
                      <strong>Actualización:</strong> La información se obtiene en tiempo real desde las fuentes oficiales.
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
        title="Resultado de Consulta - Impedimentos Cargos Públicos"
        result={result}
      />
    </div>
  )
}
