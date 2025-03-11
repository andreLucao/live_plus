"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Plus, Trash2, Edit2, Save, X, DollarSign, Calendar as CalendarIcon, Tag, AlertCircle, PiggyBank, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Sidebar from "@/components/Sidebar"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function HospitalIncomeManager() {
  const [incomes, setIncomes] = useState([])
  const [newIncome, setNewIncome] = useState({
    name: "",
    patientName: "",
    amount: "",
    date: "",
    category: "",
    time: "",
    paymentMethod: "",
    paymentType: "PF"
  })
  const [revenueType, setRevenueType] = useState("PF")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [incomeToDelete, setIncomeToDelete] = useState(null)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({})
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [monthFilter, setMonthFilter] = useState("all")
  const [yearFilter, setYearFilter] = useState("all")
  const [nameFilter, setNameFilter] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [totalSum, setTotalSum] = useState(0)
  const [doctors, setDoctors] = useState([])
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const { tenant } = useParams()

  useEffect(() => {
    fetchIncomes()
    fetchDoctors()
  }, [])

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

  const fetchDoctors = async () => {
    try {
      const response = await fetch(`/api/${tenant}/users?role=doctor`)
      if (!response.ok) throw new Error('Failed to fetch doctors')
      const data = await response.json()
      console.log('Doctors loaded:', data)
      const doctorsList = data.filter(user => user.role === "doctor")
      setDoctors(doctorsList)
    } catch (error) {
      console.error("Error loading doctors:", error)
      setError("Failed to load doctors list")
    }
  }

  const getDoctorName = (doctorId) => {
    const doctor = doctors.find(d => d._id === doctorId)
    if (!doctor) return doctorId
    
    if (doctor.name) return doctor.name
    
    if (doctor.email) {
      const emailParts = doctor.email.split(/[@.]/)[0]
      return emailParts.charAt(0).toUpperCase() + emailParts.slice(1)
    }
    
    return doctorId
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
            amount: Number.parseFloat(newIncome.amount),
            paymentType: revenueType
          }),
        })

        if (!response.ok) throw new Error('Failed to add income')
        await fetchIncomes()
        setNewIncome({ 
          name: "", 
          patientName: "", 
          amount: "", 
          date: "", 
          time: "", 
          category: "",
          paymentType: "PF",
          paymentMethod: ""
        })
        setRevenueType("PF")
        setIsModalOpen(false)
        setError("")
      } catch (error) {
        console.error('Error adding income:', error)
        setError("Failed to add income. Please try again.")
      }
    }
  }

  const handleDeleteClick = (income) => {
    setIncomeToDelete(income)
    setIsDeleteModalOpen(true)
    setDeleteConfirmation("")
  }

  const handleDeleteConfirm = async () => {
    if (deleteConfirmation === incomeToDelete.name) {
      await removeIncome(incomeToDelete._id)
      setIsDeleteModalOpen(false)
      setIncomeToDelete(null)
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
      patientName: incomeToEdit.patientName || "",
      amount: incomeToEdit.amount.toString(),
      date: new Date(incomeToEdit.date).toISOString().split('T')[0],
      time: incomeToEdit.time || "",
      category: incomeToEdit.category,
      paymentType: incomeToEdit.paymentType || "PF",
      paymentMethod: incomeToEdit.paymentMethod || ""
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
      setNewIncome({ 
        name: "", 
        patientName: "", 
        amount: "", 
        date: "", 
        time: "", 
        category: "",
        paymentType: "PF",
        paymentMethod: ""
      })
      setError("")
    } catch (error) {
      console.error('Error updating income:', error)
      setError("Failed to update income. Please try again.")
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setNewIncome({ 
      name: "", 
      patientName: "", 
      amount: "", 
      date: "", 
      time: "", 
      category: "",
      paymentType: "PF",
      paymentMethod: ""
    })
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

  // Calculate total sum of filtered incomes
  useEffect(() => {
    const sum = filteredIncomes.reduce((sum, income) => sum + income.amount, 0)
    setTotalSum(sum)
  }, [filteredIncomes])

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="w-full max-w-md p-4 rounded-lg shadow animate-pulse">
            <div className="h-8 bg-gray-200 rounded-full w-3/4 mb-4"></div>
            <div className="h-6 bg-gray-200 rounded-full w-full mb-2.5"></div>
            <div className="h-6 bg-gray-200 rounded-full w-full mb-2.5"></div>
            <div className="h-6 bg-gray-200 rounded-full w-3/4"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <CreditCard className="h-6 w-6 text-[#009EE3]" /> Receitas
              </h1>
              <span className="text-2xl font-semibold text-black mt-2">
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
                    <DialogTitle className="text-2xl font-bold">Receitas</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={addIncome} className="space-y-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="doctor-name-revenue">Nome do Médico</Label>
                        <Select
                          value={newIncome.name}
                          onValueChange={(value) => setNewIncome({ ...newIncome, name: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o médico" />
                          </SelectTrigger>
                          <SelectContent>
                            {doctors.length > 0 ? (
                              doctors.map((doctor) => (
                                // Verifica se doctor._id existe e não está vazio
                                doctor._id ? (
                                  <SelectItem key={doctor._id} value={doctor._id}>
                                    {doctor.name || (doctor.email ? 
                                      doctor.email.split(/[@.]/)[0].charAt(0).toUpperCase() + 
                                      doctor.email.split(/[@.]/)[0].slice(1) : 
                                      doctor._id)}
                                  </SelectItem>
                                ) : null
                              )).filter(Boolean) // Remove itens nulos do array
                            ) : (
                              <SelectItem value="no-doctor" disabled>
                                Nenhum médico encontrado
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="patient-name">Nome do Paciente</Label>
                        <Input
                          id="patient-name"
                          value={newIncome.patientName}
                          onChange={(e) => setNewIncome({ ...newIncome, patientName: e.target.value })}
                          placeholder="Digite o nome do paciente"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="revenue-category">Categoria</Label>
                        <Select value={newIncome.category} onValueChange={(value) => setNewIncome({ ...newIncome, category: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="consulta">Consulta</SelectItem>
                            <SelectItem value="procedimento">Procedimento</SelectItem>
                            <SelectItem value="exame">Exame</SelectItem>
                            <SelectItem value="retorno">Retorno</SelectItem>
                            <SelectItem value="cirurgia">Cirurgia</SelectItem>
                            <SelectItem value="telemedicina">Telemedicina</SelectItem>
                            <SelectItem value="avaliacao">Avaliação</SelectItem>
                            <SelectItem value="outros">Outros</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Tipo de Recebimento</Label>
                        <div className="flex gap-4">
                          <Button
                            type="button"
                            variant="outline"
                            className={cn("flex-1", revenueType === "PF" && "bg-[#009EE3] text-white hover:bg-[#0080B7]")}
                            onClick={() => setRevenueType("PF")}
                          >
                            PF
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn("flex-1", revenueType === "PJ" && "bg-[#009EE3] text-white hover:bg-[#0080B7]")}
                            onClick={() => setRevenueType("PJ")}
                          >
                            PJ
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Data e Hora</Label>
                        <div className="flex gap-4">
                          <Input
                            type="date"
                            className="w-full"
                            value={newIncome.date}
                            onChange={(e) => setNewIncome({ ...newIncome, date: e.target.value })}
                          />
                          <Input 
                            type="time" 
                            className="w-[140px]"
                            value={newIncome.time}
                            onChange={(e) => setNewIncome({ ...newIncome, time: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="value-revenue">Valor</Label>
                        <Input
                          id="value-revenue"
                          type="number"
                          value={newIncome.amount}
                          onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })}
                          placeholder="R$ 0,00"
                          step="0.01"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="payment-method-revenue">Modalidade de Pagamento</Label>
                        <Select 
                          value={newIncome.paymentMethod} 
                          onValueChange={(value) => setNewIncome({ ...newIncome, paymentMethod: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a modalidade" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pix">PIX</SelectItem>
                            <SelectItem value="card">Cartão</SelectItem>
                            <SelectItem value="money">Dinheiro</SelectItem>
                            <SelectItem value="transfer">Transferência</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button type="submit" className="w-full bg-[#009EE3] hover:bg-[#0080B7] text-white">
                      Confirmar Recebimento
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
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
                <Label htmlFor="start-date" className="text-sm font-medium text-gray-700">
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
                <Label htmlFor="end-date" className="text-sm font-medium text-gray-700">
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

              <Select value={monthFilter} onValueChange={setMonthFilter} className="w-full md:w-[150px]">
                <SelectTrigger>
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os meses</SelectItem>
                  <SelectItem value="1">Janeiro</SelectItem>
                  <SelectItem value="2">Fevereiro</SelectItem>
                  <SelectItem value="3">Março</SelectItem>
                  <SelectItem value="4">Abril</SelectItem>
                  <SelectItem value="5">Maio</SelectItem>
                  <SelectItem value="6">Junho</SelectItem>
                  <SelectItem value="7">Julho</SelectItem>
                  <SelectItem value="8">Agosto</SelectItem>
                  <SelectItem value="9">Setembro</SelectItem>
                  <SelectItem value="10">Outubro</SelectItem>
                  <SelectItem value="11">Novembro</SelectItem>
                  <SelectItem value="12">Dezembro</SelectItem>
                </SelectContent>
              </Select>

              <Select value={yearFilter} onValueChange={setYearFilter} className="w-full md:w-[150px]">
                <SelectTrigger>
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os anos</SelectItem>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

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
                    className="flex flex-col md:flex-row justify-between items-start md:items-center p-3 bg-white rounded-md shadow-sm transition-all duration-300 hover:shadow-md gap-4"
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
                        <div className="flex flex-col gap-2 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800">
                              {income.name}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {income.paymentType}
                            </Badge>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium">{income.patientName}</span>
                            <span className="text-sm text-gray-500">{getDoctorName(income.name)}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 md:gap-4">
                          <Badge variant="secondary" className="bg-[#eaf5fd] text-[#009EE3]">
                            R$ {income.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Badge>
                          <Badge variant="secondary" className="bg-[#eaf5fd] text-[#009EE3]">
                            <CalendarIcon className="h-3 w-3 mr-1" />
                            {new Date(income.date).toLocaleDateString('pt-br')} {income.time}
                          </Badge>
                          <Badge variant="secondary" className="bg-[#eaf5fd] text-[#009EE3]">
                            <Tag className="h-3 w-3 mr-1" />
                            {income.category}
                          </Badge>
                          <Badge variant="secondary" className="bg-[#eaf5fd] text-[#009EE3]">
                            {income.paymentMethod}
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
                    {incomeToDelete?.name}
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
                    setIncomeToDelete(null)
                    setDeleteConfirmation("")
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteConfirm}
                  disabled={deleteConfirmation !== incomeToDelete?.name}
                >
                  Excluir
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}