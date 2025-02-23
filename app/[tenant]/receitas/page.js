"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Plus, Trash2, Edit2, Save, X, DollarSign, Calendar, Tag, AlertCircle, PiggyBank } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Sidebar from "@/components/Sidebar"


import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function HospitalIncomeManager() {
  const [incomes, setIncomes] = useState([])
  const [newIncome, setNewIncome] = useState({ name: "", amount: "", date: "", category: "" })
  const [monthFilter, setMonthFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [editingId, setEditingId] = useState(null)
  const [darkMode, setDarkMode] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [itemToDelete, setItemToDelete] = useState(null)
  const [yearFilter, setYearFilter] = useState("all")
  const [nameFilter, setNameFilter] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const { tenant } = useParams()

  useEffect(() => {
    fetchIncomes()
  }, [])

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [darkMode])

  const fetchIncomes = async () => {
    try {
      const response = await fetch(`/api/${tenant}/income`)
      if (!response.ok) throw new Error('Failed to fetch incomes')
      const data = await response.json()
      setIncomes(data)
      setError("")
    } catch (error) {
      console.error('Error fetching incomes:', error)
      setError("Failed to load incomes. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  const addIncome = async (e) => {
    e.preventDefault()
    if (newIncome.name && newIncome.amount && newIncome.date && newIncome.category) {
      try {
        const response = await fetch(`/api/${tenant}/income`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...newIncome,
            amount: Number.parseFloat(newIncome.amount)
          }),
        })

        if (!response.ok) throw new Error('Failed to add income')
        await fetchIncomes()
        setNewIncome({ name: "", amount: "", date: "", category: "" })
        setIsModalOpen(false)
        setError("")
      } catch (error) {
        console.error('Error adding income:', error)
        setError("Failed to add income. Please try again.")
      }
    }
  }

  const handleDeleteClick = (income) => {
    setItemToDelete(income)
    setIsDeleteModalOpen(true)
    setDeleteConfirmation("")
  }

  const handleDeleteConfirm = async () => {
    if (deleteConfirmation === itemToDelete.name) {
      await removeIncome(itemToDelete._id)
      setIsDeleteModalOpen(false)
      setItemToDelete(null)
      setDeleteConfirmation("")
    }
  }

  const removeIncome = async (id) => {
    try {
      const response = await fetch(`/api/${tenant}/income/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete income')
      await fetchIncomes()
      setError("")
    } catch (error) {
      console.error('Error deleting income:', error)
      setError("Failed to delete income. Please try again.")
    }
  }

  const editIncome = (id) => {
    const incomeToEdit = incomes.find(income => income._id === id)
    setNewIncome({
      name: incomeToEdit.name,
      amount: incomeToEdit.amount.toString(),
      date: new Date(incomeToEdit.date).toISOString().split('T')[0],
      category: incomeToEdit.category
    })
    setEditingId(id)
  }

  const saveIncome = async (id) => {
    try {
      const response = await fetch(`/api/${tenant}/income`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          ...newIncome,
          amount: Number.parseFloat(newIncome.amount)
        }),
      })

      if (!response.ok) throw new Error('Failed to update income')
      await fetchIncomes()
      setEditingId(null)
      setNewIncome({ name: "", amount: "", date: "", category: "" })
      setError("")
    } catch (error) {
      console.error('Error updating income:', error)
      setError("Failed to update income. Please try again.")
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setNewIncome({ name: "", amount: "", date: "", category: "" })
  }

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

  const categories = [
    "Consultas",
    "Cirurgias",
    "Exames Laboratoriais",
    "Serviços de Imagem",
    "Serviços de Emergência",
    "Vendas de Farmácia",
    "Planos de Saúde",
    "Serviços Ambulatoriais",
    "Procedimentos Especializados",
    "Outros Serviços",
  ]

  const filteredIncomes = filterData(incomes).filter((income) => {
    const monthMatch = monthFilter === "all" || 
      new Date(income.date).getMonth() === Number.parseInt(monthFilter) - 1
    const categoryMatch = categoryFilter === "all" || 
      income.category === categoryFilter
    const yearMatch = yearFilter === "all" ||
      new Date(income.date).getFullYear().toString() === yearFilter
    const nameMatch = nameFilter === "" ||
      income.name.toLowerCase().includes(nameFilter.toLowerCase())
    return monthMatch && categoryMatch && yearMatch && nameMatch
  })

  const years = [...new Set(incomes.map(income => 
    new Date(income.date).getFullYear()
  ))].sort((a, b) => b - a)

  const totalSum = filteredIncomes.reduce((sum, income) => sum + income.amount, 0)

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

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="space-y-6 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <PiggyBank size={20} />
                  Gestão de Receitas
                </h1>
                <span className="text-2xl font-semibold text-black dark:text-gray-300 mt-2">
                  Total: R$ {totalSum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#009EE3] hover:bg-[#0080B7] text-white">
                      <Plus className="mr-2 h-4 w-4" /> Nova Receita
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Adicionar Nova Receita</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={addIncome} className="space-y-4">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="incomeName">Nome da Receita</Label>
                          <Input
                            id="incomeName"
                            value={newIncome.name}
                            onChange={(e) => setNewIncome({ ...newIncome, name: e.target.value })}
                            placeholder="Digite o nome da receita"
                          />
                        </div>
                        <div>
                          <Label htmlFor="incomeAmount">Valor</Label>
                          <Input
                            id="incomeAmount"
                            type="number"
                            value={newIncome.amount}
                            onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })}
                            placeholder="Digite o valor"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <Label htmlFor="incomeDate">Data</Label>
                          <Input
                            id="incomeDate"
                            type="date"
                            value={newIncome.date}
                            onChange={(e) => setNewIncome({ ...newIncome, date: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="incomeCategory">Categoria</Label>
                          <Select value={newIncome.category} onValueChange={(value) => setNewIncome({ ...newIncome, category: value })}>
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
                      </div>
                      <Button type="submit" className="w-full bg-[#009EE3] hover:bg-[#0080B7] text-white">
                        Adicionar Receita
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
                <Switch checked={darkMode} onCheckedChange={setDarkMode} />
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col md:flex-row justify-end items-start md:items-center gap-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="start-date" className="text-sm font-medium text-gray-700 dark:text-gray-300">
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
                  <Label htmlFor="end-date" className="text-sm font-medium text-gray-700 dark:text-gray-300">
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
                  placeholder="Filtrar por nome"
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  className="w-full md:w-[200px]"
                />

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
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

            <Card>
              <CardHeader>
                <CardTitle>Lista de Receitas</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {filteredIncomes.map((income) => (
                    <li
                      key={income._id}
                      className="flex flex-col md:flex-row justify-between items-start md:items-center p-3 bg-white dark:bg-gray-800 rounded-md shadow-sm transition-all duration-300 hover:shadow-md gap-4"
                    >
                      {editingId === income._id ? (
                        <div className="flex flex-col md:flex-row w-full gap-2">
                          <Input value={newIncome.name || income.name}
                            onChange={(e) => setNewIncome({ ...newIncome, name: e.target.value })}
                            className="flex-1 mr-2"
                          />
                          <Input
                            type="number"
                            value={newIncome.amount || income.amount}
                            onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })}
                            className="w-24 mr-2"
                            step="0.01"
                          />
                          <Input
                            type="date"
                            value={newIncome.date || new Date(income.date).toISOString().split('T')[0]}
                            onChange={(e) => setNewIncome({ ...newIncome, date: e.target.value })}
                            className="w-40 mr-2"
                          />
                          <Select
                            value={newIncome.category || income.category}
                            onValueChange={(value) => setNewIncome({ ...newIncome, category: value })}
                          >
                            <SelectTrigger className="w-48 mr-2">
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
                          <Button variant="ghost" size="icon" onClick={() => saveIncome(income._id)}>
                            <Save className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={cancelEdit}>
                            <X className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className="font-medium text-gray-800 dark:text-gray-200 break-all">
                            {income.name}
                          </span>
                          <div className="flex flex-wrap items-center gap-2 md:gap-4">
                            <Badge variant="secondary" className="bg-[#eaf5fd] text-[#009EE3] dark:bg-blue-900 dark:text-blue-100">
                              R$ {income.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Badge>
                            <Badge variant="secondary" className="bg-[#eaf5fd] text-[#009EE3] dark:bg-blue-900 dark:text-blue-100">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(income.date).toLocaleDateString('pt-br')}
                            </Badge>
                            <Badge variant="secondary" className="bg-[#eaf5fd] text-[#009EE3] dark:bg-blue-900 dark:text-blue-100">
                              <Tag className="h-3 w-3 mr-1" />
                              {income.category}
                            </Badge>
                            <Button variant="ghost" size="icon" onClick={() => editIncome(income._id)}>
                              <Edit2 className="h-4 w-4 text-[#009EE3]" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(income)}>
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

            {/* Modal de Confirmação de Exclusão */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="text-lg font-semibold text-gray-900">
                    Confirmar Exclusão
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="text-sm text-gray-600">
                    Para confirmar a exclusão, digite o nome da receita:
                    <span className="font-semibold text-gray-900 ml-1">
                      {itemToDelete?.name}
                    </span>
                  </div>
                  <Input
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder="Digite o nome da receita"
                    className="w-full"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDeleteModalOpen(false)
                      setItemToDelete(null)
                      setDeleteConfirmation("")
                    }}
                  >
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
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </main>
    </div>
  )
}

                          