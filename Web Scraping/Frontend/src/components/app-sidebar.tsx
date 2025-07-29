import { FileText, Gavel, Building2, Receipt, UserX, Heart, Scale, GraduationCap } from "lucide-react"
import { Link, useLocation } from "react-router-dom"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar"

const menuItems = [
  {
    title: "Citaciones ANT",
    url: "/citaciones-ant",
    icon: FileText,
  },
  {
    title: "Citación Judicial",
    url: "/citacion-judicial",
    icon: Gavel,
  },
  {
    title: "Consejo Judicatura",
    url: "/consejo-judicatura",
    icon: Building2,
  },
  {
    title: "Consulta SRI",
    url: "/consulta-sri",
    icon: Receipt,
  },
  {
    title: "Impedimentos Cargos Públicos",
    url: "/impedimentos-cargos",
    icon: UserX,
  },
  {
    title: "Pensión Alimenticia",
    url: "/pension-alimenticia",
    icon: Heart,
  },
  {
    title: "Procesos Judiciales",
    url: "/procesos-judiciales",
    icon: Scale,
  },
  {
    title: "Senescyt",
    url: "/senescyt",
    icon: GraduationCap,
  },
]

export function AppSidebar() {
  const location = useLocation()
  const pathname = location.pathname

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="px-4 py-2">
          <h2 className="text-lg font-semibold text-sidebar-foreground">Sistema Scraping</h2>
          <p className="text-sm text-sidebar-foreground/70">Consultas y verificaciones</p>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Consultas Disponibles</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
