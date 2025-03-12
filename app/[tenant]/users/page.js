"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Trash2, Edit2, Save, X, Mail, Calendar as CalendarIcon, User, AlertCircle, Shield, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import Sidebar from "@/components/Sidebar"

export default function UsersPage() {
  // State for storing user list and interface controls
  const [users, setUsers] = useState([])
  const [newUser, setNewUser] = useState({ 
    email: "", 
    role: "user", 
    status: "Active"
  })
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [editingId, setEditingId] = useState(null)
  const [darkMode, setDarkMode] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [emailFilter, setEmailFilter] = useState("")
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [itemToDelete, setItemToDelete] = useState(null)
  const { tenant } = useParams()

  // Effect to load users when component mounts
  useEffect(() => {
    fetchUsers()
  }, [])

  // Effect to control dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [darkMode])

  // Function to fetch users from API
  const fetchUsers = async () => {
    try {
      const response = await fetch(`/api/${tenant}/users`)
      if (!response.ok) throw new Error('Failed to fetch users')
      const data = await response.json()
      setUsers(data)
      setError("")
    } catch (error) {
      console.error('Error fetching users:', error)
      setError("Falha ao carregar usuários. Por favor, tente novamente mais tarde.")
    } finally {
      setIsLoading(false)
    }
  }

  // Functions to manage user deletion
  const handleDeleteClick = (user) => {
    setItemToDelete(user)
    setIsDeleteModalOpen(true)
    setDeleteConfirmation("")
  }

  const handleDeleteConfirm = async () => {
    if (deleteConfirmation === itemToDelete.email) {
      await removeUser(itemToDelete._id)
      setIsDeleteModalOpen(false)
      setItemToDelete(null)
      setDeleteConfirmation("")
    }
  }

  const removeUser = async (id) => {
    try {
      const response = await fetch(`/api/${tenant}/users/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete user')
      await fetchUsers()
      setError("")
    } catch (error) {
      console.error('Error deleting user:', error)
      setError("Falha ao excluir usuário. Por favor, tente novamente.")
    }
  }

  // Functions for editing users
  const editUser = (id) => {
    const userToEdit = users.find(user => user._id === id)
    setNewUser({
      email: userToEdit.email,
      role: userToEdit.role,
      status: userToEdit.status,
    })
    setEditingId(id)
  }

  const saveUser = async (id) => {
    try {
      console.log('Saving user with ID:', id);
      console.log('User data to save:', newUser);
      
      // Immediately update the UI
      const updatedUsers = users.map(user => {
        if (user._id === id) {
          return { ...user, ...newUser };
        }
        return user;
      });
      
      // Update the UI state immediately
      setUsers(updatedUsers);
      
      // Close the editing mode
      setEditingId(null);
      
      // Reset the form
      setNewUser({ 
        email: "", 
        role: "user", 
        status: "Active"
      });
      
      // Add tenantPath to ensure the backend knows which tenant this belongs to
      const userData = {
        ...newUser,
        tenantPath: tenant
      };
      
      // Send the update to the server in the background
      const response = await fetch(`/api/${tenant}/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Server response:', response.status, errorData);
        throw new Error(`Failed to update user: ${response.status}`);
      }
      
      console.log('User updated successfully on server');
      
      // Refresh the user list from the server to ensure consistency
      // This happens in the background after the UI is already updated
      fetchUsers();
      setError("");
    } catch (error) {
      console.error('Error updating user:', error);
      setError(`Falha ao atualizar usuário: ${error.message}`);
      
      // Even if there's an error with the server update, we don't revert the UI
      // as that would be confusing to the user. Instead, we show an error message
      // and let them retry if needed.
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setNewUser({ 
      email: "", 
      role: "user", 
      status: "Active"
    })
  }

  // Filtering users
  const filteredUsers = users.filter((user) => {
    const roleMatch = roleFilter === "all" || user.role === roleFilter
    const statusMatch = statusFilter === "all" || user.status === statusFilter
    const emailMatch = emailFilter === "" || 
      (user.email && user.email.toLowerCase().includes(emailFilter.toLowerCase()))
    
    return roleMatch && statusMatch && emailMatch
  })

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </main>
      </div>
    )
  }

  // Main component rendering
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="space-y-6 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <User size={20} />
                  Gestão de Usuários
                </h1>
                <span className="text-lg text-gray-700 dark:text-gray-300 mt-2">
                  Total: {filteredUsers.length} usuários
                </span>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Filters */}
            <div className="flex flex-col md:flex-row justify-end items-start md:items-center gap-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <Input
                  placeholder="Filtrar por email"
                  value={emailFilter}
                  onChange={(e) => setEmailFilter(e.target.value)}
                  className="w-full md:w-[280px]"
                />

                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filtrar por função" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Funções</SelectItem>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="doctor">Médico</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="owner">Proprietário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* User list */}
            <Card>
              <CardHeader>
                <CardTitle>Lista de Usuários</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {filteredUsers.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                      Nenhum usuário encontrado com os filtros atuais.
                    </p>
                  ) : (
                    filteredUsers.map((user) => (
                      <li
                        key={user._id}
                        className="flex flex-col md:flex-row justify-between items-start md:items-center p-3 bg-white dark:bg-gray-800 rounded-md shadow-sm transition-all duration-300 hover:shadow-md gap-4"
                      >
                        {editingId === user._id ? (
                          <div className="flex flex-col w-full gap-2">
                            <div className="flex flex-col md:flex-row gap-2">
                              <Input
                                type="email"
                                value={newUser.email}
                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                className="flex-1 mr-2"
                              />
                              
                              <Select
                                value={newUser.role}
                                onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                              >
                                <SelectTrigger className="w-40 mr-2">
                                  <SelectValue placeholder="Função" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">Usuário</SelectItem>
                                  <SelectItem value="doctor">Médico</SelectItem>
                                  <SelectItem value="admin">Administrador</SelectItem>
                                  <SelectItem value="owner">Proprietário</SelectItem>
                                </SelectContent>
                              </Select>
                              
                              <Select
                                value={newUser.status}
                                onValueChange={(value) => setNewUser({ ...newUser, status: value })}
                              >
                                <SelectTrigger className="w-40 mr-2">
                                  <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Active">Ativo</SelectItem>
                                  <SelectItem value="Inactive">Inativo</SelectItem>
                                  <SelectItem value="Archived">Arquivado</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="flex justify-end gap-2 mt-2">
                              <Button variant="ghost" size="sm" onClick={() => saveUser(user._id)}>
                                <Save className="h-4 w-4 text-blue-600 mr-1" /> Salvar
                              </Button>
                              <Button variant="ghost" size="sm" onClick={cancelEdit}>
                                <X className="h-4 w-4 text-red-500 mr-1" /> Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex flex-col gap-1 flex-1">
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-gray-500" />
                                <span className="font-medium text-gray-800 dark:text-gray-200">
                                  {user.email}
                                </span>
                              </div>
                              {user.lastLoginAt && (
                                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Último login: {new Date(user.lastLoginAt).toLocaleString('pt-BR')}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 md:gap-4">
                              <Badge variant="secondary" className={cn(
                                "bg-[#eaf5fd] text-[#009EE3] dark:bg-blue-900 dark:text-blue-100",
                                user.role === "admin" && "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-100",
                                user.role === "owner" && "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-100",
                                user.role === "doctor" && "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-100"
                              )}>
                                <Shield className="h-3 w-3 mr-1" />
                                {user.role === "user" && "Usuário"}
                                {user.role === "doctor" && "Médico"}
                                {user.role === "admin" && "Administrador"}
                                {user.role === "owner" && "Proprietário"}
                              </Badge>
                              <Badge variant="secondary" className={cn(
                                "dark:text-gray-100",
                                user.status === "Active" && "bg-green-100 text-green-600 dark:bg-green-900",
                                user.status === "Inactive" && "bg-gray-100 text-gray-600 dark:bg-gray-700",
                                user.status === "Archived" && "bg-red-100 text-red-600 dark:bg-red-900"
                              )}>
                                {user.status === "Active" && "Ativo"}
                                {user.status === "Inactive" && "Inativo"}
                                {user.status === "Archived" && "Arquivado"}
                              </Badge>
                              <Button variant="ghost" size="icon" onClick={() => editUser(user._id)}>
                                <Edit2 className="h-4 w-4 text-[#009EE3]" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(user)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </>
                        )}
                      </li>
                    ))
                  )}
                </ul>
              </CardContent>
            </Card>

            {/* Delete confirmation modal */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirmar Exclusão</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p>Para confirmar a exclusão, digite o email do usuário: <strong>{itemToDelete?.email}</strong></p>
                  <Input
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder="Digite o email do usuário"
                  />
                  <div className="flex justify-end gap-4">
                    <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                      Cancelar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteConfirm}
                      disabled={deleteConfirmation !== itemToDelete?.email}
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </main>
    </div>
  )                      
}