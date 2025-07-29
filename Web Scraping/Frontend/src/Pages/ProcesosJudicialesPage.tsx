import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ResultModal } from "@/components/result-modal"

type FormData = {
  cedula: string
  rol: "actor/ofendido" | "demandado/procesado"
}

export function ProcesosJudicialesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [result, setResult] = useState<string>("")

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>()

  const onSubmit = (data: FormData) => {
    const hasResults = Math.random() > 0.5
    setResult(
      hasResults
        ? `Proceso judicial encontrado para cédula ${data.cedula} como ${data.rol}. Caso #2024-001234 en trámite desde enero 2024.`
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
            <h1 className="text-lg font-semibold">Procesos Judiciales</h1>
          </div>
        </div>
      </header>

      <div className="flex-1 p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Consulta de Procesos Judiciales</CardTitle>
              <CardDescription>
                Busca información sobre procesos judiciales especificando el rol en el proceso.
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

                <div className="space-y-2">
                  <Label>Rol en el Proceso</Label>
                  <Controller
                    name="rol"
                    control={control}
                    rules={{ required: "Selecciona el rol en el proceso" }}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el rol" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="actor/ofendido">Actor/Ofendido</SelectItem>
                          <SelectItem value="demandado/procesado">Demandado/Procesado</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.rol && <p className="text-sm text-destructive">{errors.rol.message}</p>}
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
        title="Resultado de Consulta - Procesos Judiciales"
        result={result}
      />
    </div>
  )
}
