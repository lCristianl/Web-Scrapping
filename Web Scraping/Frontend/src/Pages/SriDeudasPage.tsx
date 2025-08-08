"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SidebarTrigger } from "@/components/ui/sidebar"

type FormData = {
  ruc: string
}

export function SriDeudasPage() {
  const [datos, setDatos] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>()

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setDatos(null)
    setError(null)

    try {
      const response = await fetch("http://localhost:3001/api/sri-deudas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ruc: data.ruc }),
      })

      const resultado = await response.json()

      if (resultado.success) {
        setDatos(resultado.data)
      } else {
        setError(resultado.error || "Error desconocido")
      }
    } catch (err) {
      console.error(err)
      setError("Error de conexión con el servidor")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center px-4">
          <SidebarTrigger />
          <div className="ml-4">
            <h1 className="text-lg font-semibold">SRI Deudas</h1>
          </div>
        </div>
      </header>

      <div className="flex-1 p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Consulta de Deudas SRI</CardTitle>
              <CardDescription>
                Ingresa el RUC o cédula para verificar deudas firmes o impugnadas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ruc">RUC o Cédula</Label>
                  <Input
                    id="ruc"
                    placeholder="Ej: 1234567890001"
                    {...register("ruc", { required: "El RUC o Cédula son requeridos" })}
                  />
                  {errors.ruc && <p className="text-sm text-destructive">{errors.ruc.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Consultando..." : "Consultar"}
                </Button>
              </form>

              {/* Mostrar resultados */}
              {error && (
                <div className="mt-4 text-red-600 font-semibold">
                  {error}
                </div>
              )}

              {datos && (
                <div className="mt-6">
                  <h2 className="text-lg font-semibold mb-2">Resultados</h2>
                  <table className="w-full table-auto border border-gray-300">
                    <tbody>
                      <tr className="border-b">
                        <td className="font-semibold p-2">RUC:</td>
                        <td className="p-2">{datos.rucObtenida}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="font-semibold p-2">Razón Social:</td>
                        <td className="p-2">{datos.razonSocial}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="font-semibold p-2">Fecha de Corte:</td>
                        <td className="p-2">{datos.fechaCorte}</td>
                      </tr>
                      <tr>
                        <td className="font-semibold p-2">Estado de Deuda:</td>
                        <td className="p-2">{datos.estadoDeuda}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
