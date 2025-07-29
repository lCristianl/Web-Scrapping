import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4">
          <SidebarTrigger />
          <div className="ml-4">
            <h1 className="text-lg font-semibold">Inicio</h1>
          </div>
        </div>
      </header>

      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight mb-2">Bienvenido al Sistema de Consultas Jurídicas</h2>
            <p className="text-muted-foreground text-lg">
              Accede a diferentes servicios de consulta y verificación legal desde el menú lateral.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Consultas Rápidas</CardTitle>
                <CardDescription>Verifica información de personas y entidades</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Utiliza las opciones del menú para realizar consultas en diferentes sistemas gubernamentales.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Procesos Legales</CardTitle>
                <CardDescription>Información sobre procesos judiciales</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Consulta el estado de procesos judiciales y citaciones pendientes.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Verificaciones</CardTitle>
                <CardDescription>Impedimentos y validaciones oficiales</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Verifica impedimentos para cargos públicos y otros requisitos legales.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
