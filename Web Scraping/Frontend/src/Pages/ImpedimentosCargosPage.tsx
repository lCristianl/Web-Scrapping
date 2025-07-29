import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ResultModal } from "@/components/result-modal"

export function ImpedimentosCargosPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [result, setResult] = useState<string>("")

  const handleConsultar = () => {
    const hasResults = Math.random() > 0.5
    setResult(
      hasResults
        ? "Se encontraron impedimentos para ejercer cargos públicos. Consulte con la entidad correspondiente para más detalles."
        : "No se encontraron resultados",
    )
    setIsModalOpen(true)
  }

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
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Consulta de Impedimentos para Cargos Públicos</CardTitle>
              <CardDescription>Verifica si existen impedimentos legales para ejercer cargos públicos.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Esta consulta verificará automáticamente los impedimentos basados en la información disponible en el
                    sistema.
                  </p>
                </div>

                <Button onClick={handleConsultar} className="w-full">
                  Consultar
                </Button>
              </div>
            </CardContent>
          </Card>
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
