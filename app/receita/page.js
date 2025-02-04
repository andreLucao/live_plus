"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Edit2, Save, X, DollarSign, Calendar, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
      const response = await fetch('/api/income')
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
        const response = await fetch('/api/income', {
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

  const removeIncome = async (id) => {
    try {
      const response = await fetch(`/api/income/${id}`, {
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
      const response = await fetch('/api/income', {
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

  const filteredIncomes = incomes.filter((income) => {
    const monthMatch = monthFilter === "all" || 
      new Date(income.date).getMonth() === Number.parseInt(monthFilter) - 1
    const categoryMatch = categoryFilter === "all" || 
      income.category === categoryFilter
    return monthMatch && categoryMatch
  })

  const totalSum = filteredIncomes.reduce((sum, income) => sum + income.amount, 0)

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-gray-800 dark:to-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div className="flex flex-col">
            <h1 className="text-4xl font-bold text-[#009EE3]">
              Receitas
            </h1>
            <span className="text-2xl font-semibold text-[#009EE3] mt-2">
              R${totalSum.toFixed(2)}
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
                      <Label htmlFor="incomeName" className="text-[#009EE3] dark:text-[#009EE3]">
                        Nome da Receita
                      </Label>
                      <Input
                        id="incomeName"
                        value={newIncome.name}
                        onChange={(e) => setNewIncome({ ...newIncome, name: e.target.value })}
                        placeholder="Digite o nome da receita"
                        className="border-[#009EE3] dark:border-[#009EE3]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="incomeAmount" className="text-[#009EE3] dark:text-[#009EE3]">
                        Valor
                      </Label>
                      <Input
                        id="incomeAmount"
                        type="number"
                        value={newIncome.amount}
                        onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })}
                        placeholder="Digite o valor"
                        step="0.01"
                        className="border-[#009EE3] dark:border-[#009EE3]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="incomeDate" className="text-[#009EE3] dark:text-[#009EE3]">
                        Data
                      </Label>
                      <Input
                        id="incomeDate"
                        type="date"
                        value={newIncome.date}
                        onChange={(e) => setNewIncome({ ...newIncome, date: e.target.value })}
                        className="border-[#009EE3] dark:border-[#009EE3]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="incomeCategory" className="text-[#009EE3] dark:text-[#009EE3]">
                        Categoria
                      </Label>
                      <Select value={newIncome.category} onValueChange={(value) => setNewIncome({ ...newIncome, category: value })}>
                        <SelectTrigger className="border-[#009EE3] dark:border-[#009EE3]">
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
                  <Button
                    type="submit"
                    className="w-full bg-[#009EE3] hover:bg-[#0080B7] text-white"
                  >
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
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-[#009EE3] dark:text-[#009EE3]">Receitas Hospitalares</h3>
          <div className="flex gap-2">
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="w-[180px] border-[#009EE3] dark:border-[#009EE3]">
                <SelectValue placeholder="Filtrar por mês" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Meses</SelectItem>
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    {new Date(0, i).toLocaleString("default", { month: "long" })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px] border-[#009EE3] dark:border-[#009EE3]">
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

        <ul className="space-y-2">
          {filteredIncomes.map((income) => (
            <li
              key={income._id}
              className="flex flex-col md:flex-row justify-between items-start md:items-center p-3 bg-white dark:bg-gray-800 rounded-md shadow-md transition-all duration-300 hover:shadow-lg gap-4"
            >
              {editingId === income._id ? (
                <>
                  <Input
                    value={newIncome.name || income.name}
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
                    <Save className="h-4 w-4 text-[#009EE3]" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={cancelEdit}>
                    <X className="h-4 w-4 text-[#009EE3]" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="font-medium text-gray-800 dark:text-gray-200 break-all">{income.name}</span>
                  <div className="flex flex-wrap items-center gap-2 md:gap-4">
                    <Badge
                      variant="secondary"
                      className="bg-[#009EE3]/10 text-[#009EE3] dark:bg-[#009EE3]/20 dark:text-[#009EE3]"
                    >
                      <DollarSign className="h-3 w-3 mr-1" />
                      {income.amount.toFixed(2)}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="bg-[#009EE3]/10 text-[#009EE3] dark:bg-[#009EE3]/20 dark:text-[#009EE3]"
                    >
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(income.date).toLocaleDateString()}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="bg-[#009EE3]/10 text-[#009EE3] dark:bg-[#009EE3]/20 dark:text-[#009EE3]"
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {income.category}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => editIncome(income._id)}>
                      <Edit2 className="h-4 w-4 text-[#009EE3]" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => removeIncome(income._id)}>
                      <Trash2 className="h-4 w-4 text-[#009EE3]" />
                    </Button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}