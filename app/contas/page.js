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

export default function HospitalBillManager() {
  const [bills, setBills] = useState([])
  const [newBill, setNewBill] = useState({ name: "", amount: "", date: "", category: "" })
  const [monthFilter, setMonthFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [editingId, setEditingId] = useState(null)
  const [darkMode, setDarkMode] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    fetchBills()
  }, [])

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [darkMode])

  const fetchBills = async () => {
    try {
      const response = await fetch('/api/bills')
      if (!response.ok) throw new Error('Failed to fetch bills')
      const data = await response.json()
      setBills(data)
      setError("")
    } catch (error) {
      console.error('Error fetching bills:', error)
      setError("Failed to load bills. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  const addBill = async (e) => {
    e.preventDefault()
    if (newBill.name && newBill.amount && newBill.date && newBill.category) {
      try {
        const response = await fetch('/api/bills', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...newBill,
            amount: Number.parseFloat(newBill.amount)
          }),
        })

        if (!response.ok) throw new Error('Failed to add bill')
        await fetchBills()
        setNewBill({ name: "", amount: "", date: "", category: "" })
        setIsModalOpen(false)
        setError("")
      } catch (error) {
        console.error('Error adding bill:', error)
        setError("Failed to add bill. Please try again.")
      }
    }
  }

  const removeBill = async (id) => {
    try {
      const response = await fetch(`/api/bills/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete bill')
      await fetchBills()
      setError("")
    } catch (error) {
      console.error('Error deleting bill:', error)
      setError("Failed to delete bill. Please try again.")
    }
  }

  const editBill = (id) => {
    const billToEdit = bills.find(bill => bill._id === id)
    setNewBill({
      name: billToEdit.name,
      amount: billToEdit.amount.toString(),
      date: new Date(billToEdit.date).toISOString().split('T')[0],
      category: billToEdit.category
    })
    setEditingId(id)
  }

  const saveBill = async (id) => {
    try {
      const response = await fetch('/api/bills', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          ...newBill,
          amount: Number.parseFloat(newBill.amount)
        }),
      })

      if (!response.ok) throw new Error('Failed to update bill')
      await fetchBills()
      setEditingId(null)
      setNewBill({ name: "", amount: "", date: "", category: "" })
      setError("")
    } catch (error) {
      console.error('Error updating bill:', error)
      setError("Failed to update bill. Please try again.")
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setNewBill({ name: "", amount: "", date: "", category: "" })
  }

  const categories = [
    "Material Médico",
    "Medicamentos",
    "Manutenção de Equipamentos",
    "Salários",
    "Cuidados com Pacientes",
    "Laboratório",
    "Radiologia",
    "Serviços de Emergência",
    "Administrativo",
    "Gestão de Instalações",
  ]

  const filteredBills = bills.filter((bill) => {
    const monthMatch = monthFilter === "all" || 
      new Date(bill.date).getMonth() === Number.parseInt(monthFilter) - 1
    const categoryMatch = categoryFilter === "all" || 
      bill.category === categoryFilter
    return monthMatch && categoryMatch
  })

  const totalSum = filteredBills.reduce((sum, bill) => sum + bill.amount, 0)

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div className="flex flex-col">
            <h1 className="text-4xl font-bold text-[#009EE3]">
              Despesas
            </h1>
            <span className="text-2xl font-semibold text-[#009EE3] mt-2">
              R${totalSum.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#009EE3] hover:bg-[#0080B7] text-white">
                  <Plus className="mr-2 h-4 w-4" /> Nova Despesa
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Adicionar Nova Despesa</DialogTitle>
                </DialogHeader>
                <form onSubmit={addBill} className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="billName" className="text-[#009EE3] dark:text-[#009EE3]">
                        Nome da Despesa
                      </Label>
                      <Input
                        id="billName"
                        value={newBill.name}
                        onChange={(e) => setNewBill({ ...newBill, name: e.target.value })}
                        placeholder="Digite o nome da despesa"
                        className="border-[#009EE3] dark:border-[#009EE3]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="billAmount" className="text-[#009EE3] dark:text-[#009EE3]">
                        Valor
                      </Label>
                      <Input
                        id="billAmount"
                        type="number"
                        value={newBill.amount}
                        onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
                        placeholder="Digite o valor"
                        step="0.01"
                        className="border-[#009EE3] dark:border-[#009EE3]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="billDate" className="text-[#009EE3] dark:text-[#009EE3]">
                        Data
                      </Label>
                      <Input
                        id="billDate"
                        type="date"
                        value={newBill.date}
                        onChange={(e) => setNewBill({ ...newBill, date: e.target.value })}
                        className="border-[#009EE3] dark:border-[#009EE3]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="billCategory" className="text-[#009EE3] dark:text-[#009EE3]">
                        Categoria
                      </Label>
                      <Select value={newBill.category} onValueChange={(value) => setNewBill({ ...newBill, category: value })}>
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
                    Adicionar Despesa
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

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <h3 className="text-lg font-semibold text-[#009EE3] dark:text-[#009EE3]">Despesas Hospitalares</h3>
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="w-full md:w-[180px] border-[#009EE3] dark:border-[#009EE3]">
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
              <SelectTrigger className="w-full md:w-[180px] border-[#009EE3] dark:border-[#009EE3]">
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
          {filteredBills.map((bill) => (
            <li
              key={bill._id}
              className="flex flex-col md:flex-row justify-between items-start md:items-center p-3 bg-white dark:bg-gray-800 rounded-md shadow-md transition-all duration-300 hover:shadow-lg gap-4"
            >
              {editingId === bill._id ? (
                <div className="flex flex-col md:flex-row w-full gap-2">
                  <Input
                    value={newBill.name || bill.name}
                    onChange={(e) => setNewBill({ ...newBill, name: e.target.value })}
                    className="flex-1 mr-2"
                  />
                  <Input
                    type="number"
                    value={newBill.amount || bill.amount}
                    onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
                    className="w-24 mr-2"
                    step="0.01"
                  />
                  <Input
                    type="date"
                    value={newBill.date || new Date(bill.date).toISOString().split('T')[0]}
                    onChange={(e) => setNewBill({ ...newBill, date: e.target.value })}
                    className="w-40 mr-2"
                  />
                  <Select
                    value={newBill.category || bill.category}
                    onValueChange={(value) => setNewBill({ ...newBill, category: value })}
                  >
                    <SelectTrigger className="w-48 mr-2">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" onClick={() => saveBill(bill._id)}>
                    <Save className="h-4 w-4 text-[#009EE3]" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={cancelEdit}>
                    <X className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ) : (
                <>
                  <span className="font-medium text-gray-800 dark:text-gray-200 break-all">{bill.name}</span>
                  <div className="flex flex-wrap items-center gap-2 md:gap-4">
                    <Badge
                      variant="secondary"
                      className="bg-[#009EE3]/10 text-[#009EE3] dark:bg-[#009EE3]/20 dark:text-[#009EE3]"
                    >
                      <DollarSign className="h-3 w-3 mr-1" />
                      {bill.amount.toFixed(2)}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="bg-[#009EE3]/10 text-[#009EE3] dark:bg-[#009EE3]/20 dark:text-[#009EE3]"
                    >
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(bill.date).toLocaleDateString()}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="bg-[#009EE3]/10 text-[#009EE3] dark:bg-[#009EE3]/20 dark:text-[#009EE3]"
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {bill.category}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => editBill(bill._id)}>
                      <Edit2 className="h-4 w-4 text-[#009EE3]" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => removeBill(bill._id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
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