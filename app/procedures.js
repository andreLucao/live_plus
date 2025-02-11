//app/procedures.js
"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Edit2, Save, X, User, Calendar, Tag, AlertCircle, Stethoscope, UserMinus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function ProcedureManager() {
  // Estado para armazenar a lista de procedimentos e controles da interface
  const [procedures, setProcedures] = useState([])
  const [newProcedure, setNewProcedure] = useState({ 
    name: "", 
    category: "", 
    date: "", 
    doctor: "", 
    patient: "" 
  })
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [editingId, setEditingId] = useState(null)
  const [darkMode, setDarkMode] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [itemToDelete, setItemToDelete] = useState(null)
  const [nameFilter, setNameFilter] = useState("")

  // Efeito para carregar os procedimentos ao montar o componente
  useEffect(() => {
    fetchProcedures()
  }, [])

  // Efeito para controlar o modo escuro
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [darkMode])

  // Função para buscar os procedimentos da API
  const fetchProcedures = async () => {
    try {
      const response = await fetch('/api/procedures')
      if (!response.ok) throw new Error('Failed to fetch procedures')
      const data = await response.json()
      setProcedures(data)
      setError("")
    } catch (error) {
      console.error('Error fetching procedures:', error)
      setError("Falha ao carregar os procedimentos. Por favor, tente novamente mais tarde.")
    } finally {
      setIsLoading(false)
    }
  }

  // Função para adicionar um novo procedimento
  const addProcedure = async (e) => {
    e.preventDefault()
    if (newProcedure.name && newProcedure.category && newProcedure.date && 
        newProcedure.doctor && newProcedure.patient) {
      try {
        const response = await fetch('/api/procedures', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newProcedure),
        })

        if (!response.ok) throw new Error('Failed to add procedure')
        await fetchProcedures()
        setNewProcedure({ name: "", category: "", date: "", doctor: "", patient: "" })
        setIsModalOpen(false)
        setError("")
      } catch (error) {
        console.error('Error adding procedure:', error)
        setError("Falha ao adicionar procedimento. Por favor, tente novamente.")
      }
    }
  }

  // Funções para gerenciar a exclusão de procedimentos
  const handleDeleteClick = (procedure) => {
    setItemToDelete(procedure)
    setIsDeleteModalOpen(true)
    setDeleteConfirmation("")
  }

  const handleDeleteConfirm = async () => {
    if (deleteConfirmation === itemToDelete.name) {
      await removeProcedure(itemToDelete._id)
      setIsDeleteModalOpen(false)
      setItemToDelete(null)
      setDeleteConfirmation("")
    }
  }

  const removeProcedure = async (id) => {
    try {
      const response = await fetch(`/api/procedures/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete procedure')
      await fetchProcedures()
      setError("")
    } catch (error) {
      console.error('Error deleting procedure:', error)
      setError("Falha ao excluir procedimento. Por favor, tente novamente.")
    }
  }

  // Funções para edição de procedimentos
  const editProcedure = (id) => {
    const procedureToEdit = procedures.find(procedure => procedure._id === id)
    setNewProcedure({
      name: procedureToEdit.name,
      category: procedureToEdit.category,
      date: new Date(procedureToEdit.date).toISOString().split('T')[0],
      doctor: procedureToEdit.doctor,
      patient: procedureToEdit.patient
    })
    setEditingId(id)
  }

  const saveProcedure = async (id) => {
    try {
      const response = await fetch('/api/procedures', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          ...newProcedure
        }),
      })

      if (!response.ok) throw new Error('Failed to update procedure')
      await fetchProcedures()
      setEditingId(null)
      setNewProcedure({ name: "", category: "", date: "", doctor: "", patient: "" })
      setError("")
    } catch (error) {
      console.error('Error updating procedure:', error)
      setError("Falha ao atualizar procedimento. Por favor, tente novamente.")
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setNewProcedure({ name: "", category: "", date: "", doctor: "", patient: "" })
  }

  // Função para filtrar dados por data
  const filterData = (data) => {
    if (!startDate && !endDate) return data
    
    return data.filter(item => {
      const itemDate = new Date(item.date)
      const start = startDate ? new Date(startDate) : new Date(0)
      const end = endDate ? new Date(endDate) : new Date()
      end.setHours(23, 59, 59, 999)
      
      return itemDate >= start && itemDate <= end
    })
  }

  // Lista de categorias disponíveis
  const categories = [
    "Cirurgia",
    "Consulta",
    "Exame",
    "Procedimento Ambulatorial",
    "Tratamento",
    "Emergência",
    "Internação",
    "Reabilitação",
    "Diagnóstico por Imagem",
    "Outro"
  ]

  // Filtragem dos procedimentos
  const filteredProcedures = filterData(procedures).filter((procedure) => {
    const categoryMatch = categoryFilter === "all" || 
      procedure.category === categoryFilter
    const nameMatch = nameFilter === "" ||
      procedure.name.toLowerCase().includes(nameFilter.toLowerCase()) ||
      procedure.doctor.toLowerCase().includes(nameFilter.toLowerCase()) ||
      procedure.patient.toLowerCase().includes(nameFilter.toLowerCase())
    return categoryMatch && nameMatch
  })

  // Renderização do estado de carregamento
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Renderização principal do componente
  return (
    <div className="space-y-6 p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Stethoscope size={24} />
              Gestão de Procedimentos Médicos
            </h1>
            <span className="text-gray-600 dark:text-gray-400 mt-1">
              Total de Procedimentos: {filteredProcedures.length}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Modal para adicionar novo procedimento */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#009EE3] hover:bg-[#0080B7] text-white">
                  <Plus className="mr-2 h-4 w-4" /> Novo Procedimento
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Procedimento</DialogTitle>
                </DialogHeader>
                <form onSubmit={addProcedure} className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="procedureName">
                        Nome do Procedimento
                      </Label>
                      <Input
                        id="procedureName"
                        value={newProcedure.name}
                        onChange={(e) => setNewProcedure({ ...newProcedure, name: e.target.value })}
                        placeholder="Digite o nome do procedimento"
                      />
                    </div>
                    <div>
                      <Label htmlFor="procedureCategory">
                        Categoria
                      </Label>
                      <Select 
                        value={newProcedure.category} 
                        onValueChange={(value) => setNewProcedure({ ...newProcedure, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="procedureDate">
                        Data
                      </Label>
                      <Input
                        id="procedureDate"
                        type="date"
                        value={newProcedure.date}
                        onChange={(e) => setNewProcedure({ ...newProcedure, date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="procedureDoctor">
                        Médico Responsável
                      </Label>
                      <Input
                        id="procedureDoctor"
                        value={newProcedure.doctor}
                        onChange={(e) => setNewProcedure({ ...newProcedure, doctor: e.target.value })}
                        placeholder="Nome do médico"
                      />
                    </div>
                    <div>
                      <Label htmlFor="procedurePatient">
                        Paciente
                      </Label>
                      <Input
                        id="procedurePatient"
                        value={newProcedure.patient}
                        onChange={(e) => setNewProcedure({ ...newProcedure, patient: e.target.value })}
                        placeholder="Nome do paciente"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full">
                    Adicionar Procedimento
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
            <Switch checked={darkMode} onCheckedChange={setDarkMode} />
          </div>
        </div>

        {/* Mensagem de erro */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filtros */}
        <div className="flex flex-col md:flex-row justify-end items-start md:items-center gap-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex flex-col gap-2">
              <Label htmlFor="start-date">
                Data Inicial
              </Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full md:w-40"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="end-date">
                Data Final
              </Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full md:w-40"
              />
            </div>

            <Input
              placeholder="Buscar por nome, médico ou paciente"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="w-full md:w-[280px]"
            />

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filtrar por categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Categorias</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Lista de procedimentos */}
        <Card>
          <CardContent>
            <ul className="space-y-2">
              {filteredProcedures.map((procedure) => (
                <li
                  key={procedure._id}
                  className="flex flex-col md:flex-row justify-between items-start md:items-center p-3 bg-white dark:bg-gray-800 rounded-md shadow-sm transition-all duration-300 hover:shadow-md gap-4"
                >
                  {editingId === procedure._id ? (
                    <div className="flex flex-col md:flex-row w-full gap-2">
                      <Input
                        value={newProcedure.name}
                        onChange={(e) => setNewProcedure({ ...newProcedure, name: e.target.value })}
                        className="flex-1"
                      />
                      <Select
                        value={newProcedure.category}
                        onValueChange={(value) => setNewProcedure({ ...newProcedure, category: value })}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="date"
                        value={newProcedure.date}
                        onChange={(e) => setNewProcedure({ ...newProcedure, date: e.target.value })}
                        className="w-40"
                      />
                      <Input
                        value={newProcedure.doctor}
                        onChange={(e) => setNewProcedure({ ...newProcedure, doctor: e.target.value })}
                        className="w-48"
                        placeholder="Médico"
                      />
                      <Input
                        value={newProcedure.patient}
                        onChange={(e) => setNewProcedure({ ...newProcedure, patient: e.target.value })}
                        className="w-48"
                        placeholder="Paciente"
                      />
                      <Button variant="ghost" size="icon" onClick={() => saveProcedure(procedure._id)}>
                        <Save className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={cancelEdit}>
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {procedure.name}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary" className="bg-[#eaf5fd] text-[#009EE3] dark:bg-blue-900 dark:text-blue-100">
                            <Tag className="h-3 w-3 mr-1" />
                            {procedure.category}
                          </Badge>
                          <Badge variant="secondary" className="bg-[#eaf5fd] text-[#009EE3] dark:bg-blue-900 dark:text-blue-100">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(procedure.date).toLocaleDateString()}
                          </Badge>
                          <Badge variant="secondary" className="bg-[#eaf5fd] text-[#009EE3] dark:bg-blue-900 dark:text-blue-100">
                            <User className="h-3 w-3 mr-1" />
                            {procedure.doctor}
                          </Badge>
                          <Badge variant="secondary" className="bg-[#eaf5fd] text-[#009EE3] dark:bg-blue-900 dark:text-blue-100">
                            <UserMinus className="h-3 w-3 mr-1" />
                            {procedure.patient}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => editProcedure(procedure._id)}>
                          <Edit2 className="h-4 w-4 text-[#009EE3]" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(procedure)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Modal de confirmação de exclusão */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>Para confirmar a exclusão, digite o nome do procedimento: <strong>{itemToDelete?.name}</strong></p>
              <Input
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Digite o nome do procedimento"
              />
              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteConfirm}
                  disabled={deleteConfirmation !== itemToDelete?.name}
                >
                  Excluir
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}