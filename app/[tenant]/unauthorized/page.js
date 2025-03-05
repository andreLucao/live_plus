"use client"

import { ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import Sidebar from "@/components/Sidebar"

export default function UnauthorizedPage() {
  const router = useRouter()
  
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 bg-red-100 p-3 rounded-full w-16 h-16 flex items-center justify-center">
              <ShieldAlert className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Acesso Restrito</CardTitle>
            <CardDescription>
              Você não tem permissão para acessar esta página
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600 dark:text-gray-400">
              Esta seção requer permissões específicas ou perfil de proprietário. 
              Se você acredita que deveria ter acesso, entre em contato com o administrador do sistema.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center gap-4">
            <Button 
              variant="outline"
              onClick={() => router.push("/")}
            >
              Voltar ao Início
            </Button>
            <Button 
              onClick={() => router.back()}
            >
              Voltar à Página Anterior
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}