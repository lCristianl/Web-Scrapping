import { useState } from "react"
import { useForm } from "react-hook-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ResultModal } from "@/components/result-modal"

type FormData = {
  ruc: string
}

export function ConsultaSRIPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [result, setResult] = useState<string>("")

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>()

  const onSubmit = (data: FormData) => {
    const hasResults = Math.random() > 0.5
    setResult(
      hasResults
        ? `Información SRI para RUC ${data.ruc}: Contribuyente activo, régimen general. Última declaración: Enero 2024.`
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
            <h1 className="text-lg font-semibold">Consulta SRI</h1>
          </div>
        </div>
      </header>

      <div className="flex-1 p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Consulta SRI</CardTitle>
              <CardDescription>Verifica información tributaria ingresando el número de RUC.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ruc">Número de RUC</Label>
                  <Input
                    id="ruc"
                    placeholder="Ej: 1234567890001"
                    {...register("ruc", {
                      required: "El RUC es requerido",
                      pattern: {
                        value: /^\d{13}$/,
                        message: "El RUC debe tener 13 dígitos",
                      },
                    })}
                  />
                  {errors.ruc && <p className="text-sm text-destructive">{errors.ruc.message}</p>}
                </div>

                <Button type="submit" className="w-full">
                  Consultar
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <ResultModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Resultado de Consulta - SRI"
        result={result}
      />
    </div>
  )
}
