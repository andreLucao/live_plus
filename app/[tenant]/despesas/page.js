"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Plus, Trash2, Edit2, Save, X, DollarSign, Calendar as CalendarIcon, Tag, AlertCircle, FileText } from "lucide-react"
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

export default function ExpensesPage() {
  // Estado para armazenar a lista de despesas e controles da interface
  const [bills, setBills] = useState([])
  const [newBill, setNewBill] = useState({
    name: "",
    amount: "",
    date: "",
    category: "",
    supplierName: "",
    time: "",
    paymentMethod: "",
    paymentType: "PF"
  })
  const [monthFilter, setMonthFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [editingId, setEditingId] = useState(null)
  const [darkMode, setDarkMode] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [yearFilter, setYearFilter] = useState("all")
  const [nameFilter, setNameFilter] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [itemToDelete, setItemToDelete] = useState(null)
  const [expenseType, setExpenseType] = useState("PF")
  const [doctors, setDoctors] = useState([])
  const { tenant } = useParams()

  // Efeito para carregar as despesas ao montar o componente
  useEffect(() => {
    fetchBills()
    fetchDoctors()
  }, [])

  // Efeito para controlar o modo escuro
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [darkMode])

  // Função para buscar as despesas da API
  const fetchBills = async () => {
    try {
      const response = await fetch(`/api/${tenant}/bills`)
      if (!response.ok) throw new Error('Failed to fetch bills')
      const data = await response.json()
      setBills(data)
      setError("")
    } catch (error) {
      console.error('Error fetching bills:', error)
      setError("Falha ao carregar as despesas. Por favor, tente novamente mais tarde.")
    } finally {
      setIsLoading(false)
    }
  }

  // Função para adicionar uma nova despesa
  const addBill = async (e) => {
    e.preventDefault()
    if (newBill.name && newBill.amount && newBill.date && newBill.category) {
      try {
        const response = await fetch(`/api/${tenant}/bills`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...newBill,
            amount: Number.parseFloat(newBill.amount),
            paymentType: expenseType
          }),
        })

        if (!response.ok) throw new Error('Failed to add bill')
        await fetchBills()
        setNewBill({
          name: "",
          amount: "",
          date: "",
          category: "",
          supplierName: "",
          time: "",
          paymentMethod: "",
          paymentType: "PF"
        })
        setExpenseType("PF")
        setIsModalOpen(false)
        setError("")
      } catch (error) {
        console.error('Error adding bill:', error)
        setError("Falha ao adicionar despesa. Por favor, tente novamente.")
      }
    }
  }

  // Funções para gerenciar a exclusão de despesas
  const handleDeleteClick = (bill) => {
    setItemToDelete(bill)
    setIsDeleteModalOpen(true)
    setDeleteConfirmation("")
  }

  const handleDeleteConfirm = async () => {
    if (deleteConfirmation === itemToDelete.supplierName) {
      await removeBill(itemToDelete._id)
      setIsDeleteModalOpen(false)
      setItemToDelete(null)
      setDeleteConfirmation("")
    }
  }

  const removeBill = async (id) => {
    try {
      const response = await fetch(`/api/${tenant}/bills/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete bill')
      }

      await fetchBills()
      setError("")
    } catch (error) {
      console.error('Error deleting bill:', error)
      setError(error.message || "Falha ao excluir despesa. Por favor, tente novamente.")
    }
  }

  // Funções para edição de despesas
  const editBill = (id) => {
    const billToEdit = bills.find(bill => bill._id === id)
    setNewBill({
      name: billToEdit.name,
      amount: billToEdit.amount.toString(),
      date: new Date(billToEdit.date).toISOString().split('T')[0],
      category: billToEdit.category,
      supplierName: billToEdit.supplierName || "",
      time: billToEdit.time || "",
      paymentMethod: billToEdit.paymentMethod || "",
      paymentType: billToEdit.paymentType || "PF"
    })
    setEditingId(id)
  }

  const saveBill = async (id) => {
    try {
      const response = await fetch(`/api/${tenant}/bills`, {
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
      setNewBill({
        name: "",
        amount: "",
        date: "",
        category: "",
        supplierName: "",
        time: "",
        paymentMethod: "",
        paymentType: "PF"
      })
      setError("")
    } catch (error) {
      console.error('Error updating bill:', error)
      setError("Falha ao atualizar despesa. Por favor, tente novamente.")
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setNewBill({
      name: "",
      amount: "",
      date: "",
      category: "",
      supplierName: "",
      time: "",
      paymentMethod: "",
      paymentType: "PF"
    })
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

  // Filtragem das despesas
  const filteredBills = filterData(bills).filter((bill) => {
    const monthMatch = monthFilter === "all" ||
      new Date(bill.date).getMonth() === Number.parseInt(monthFilter) - 1
    const categoryMatch = categoryFilter === "all" ||
      bill.category === categoryFilter
    const yearMatch = yearFilter === "all" ||
      new Date(bill.date).getFullYear().toString() === yearFilter
    const nameMatch = nameFilter === "" ||
      bill.name.toLowerCase().includes(nameFilter.toLowerCase())
    return monthMatch && categoryMatch && yearMatch && nameMatch
  })

  // Cálculo do total das despesas filtradas
  const totalSum = filteredBills.reduce((sum, bill) => sum + bill.amount, 0)

  // Anos únicos para filtro
  const years = [...new Set(bills.map(bill =>
    new Date(bill.date).getFullYear()
  ))].sort((a, b) => b - a)

  // Função para buscar médicos da API
  const fetchDoctors = async () => {
    try {
      const response = await fetch(`/api/${tenant}/users?role=doctor`)
      if (!response.ok) throw new Error('Failed to fetch doctors')
      const data = await response.json()
      console.log(`Doctors loaded for tenant ${tenant}:`, data)
      setDoctors(data)
    } catch (error) {
      console.error("Error loading doctors:", error)
      setError("Failed to load doctors list")
    }
  }

  // Helper function to get doctor name from ID
  const getDoctorName = (doctorId) => {
    if (!doctorId) return "Unknown";

    const doctor = doctors.find(d => d._id === doctorId);
    if (!doctor) return doctorId;

    if (doctor.name) return doctor.name;

    // Extract first name from email (before the dot or @ symbol)
    if (doctor.email) {
      const emailParts = doctor.email.split(/[@.]/)[0];
      // Capitalize first letter
      return emailParts.charAt(0).toUpperCase() + emailParts.slice(1);
    }

    return doctorId;
  }

  // Renderização do estado de carregamento
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

  // Renderização principal do componente
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="space-y-6 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Cabeçalho */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FileText size={20} />
                  Gestão de Despesas
                </h1>
                <span className="text-2xl font-semibold text-black dark:text-gray-300 mt-2">
                  Total: R$ {totalSum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                      <DialogTitle className="text-2xl font-bold">Despesas</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={addBill} className="space-y-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="doctor-name-expense">Nome do Médico</Label>
                          <Select
                            value={newBill.name}
                            onValueChange={(value) => setNewBill({ ...newBill, name: value })}
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
                          <Label htmlFor="supplier-name">Nome do Fornecedor</Label>
                          <Input
                            id="supplier-name"
                            value={newBill.supplierName}
                            onChange={(e) => setNewBill({ ...newBill, supplierName: e.target.value })}
                            placeholder="Digite o nome do fornecedor"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="expense-category">Categoria</Label>
                          <Select value={newBill.category} onValueChange={(value) => setNewBill({ ...newBill, category: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a categoria" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="impostos">Impostos</SelectItem>
                              <SelectItem value="marketing">Marketing</SelectItem>
                              <SelectItem value="materiais">Materiais Médicos</SelectItem>
                              <SelectItem value="equipamentos">Equipamentos</SelectItem>
                              <SelectItem value="aluguel">Aluguel</SelectItem>
                              <SelectItem value="utilities">Água/Luz/Internet</SelectItem>
                              <SelectItem value="software">Software/Sistema</SelectItem>
                              <SelectItem value="salarios">Salários</SelectItem>
                              <SelectItem value="manutencao">Manutenção</SelectItem>
                              <SelectItem value="limpeza">Material de Limpeza</SelectItem>
                              <SelectItem value="escritorio">Material de Escritório</SelectItem>
                              <SelectItem value="outros">Outros</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Tipo de Pagamento</Label>
                          <div className="flex gap-4">
                            <Button
                              type="button"
                              variant="outline"
                              className={cn("flex-1", expenseType === "PF" && "bg-[#009EE3] text-white hover:bg-[#0080B7]")}
                              onClick={() => setExpenseType("PF")}
                            >
                              PF
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              className={cn("flex-1", expenseType === "PJ" && "bg-[#009EE3] text-white hover:bg-[#0080B7]")}
                              onClick={() => setExpenseType("PJ")}
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
                              value={newBill.date}
                              onChange={(e) => setNewBill({ ...newBill, date: e.target.value })}
                            />
                            <Input
                              type="time"
                              className="w-[140px]"
                              value={newBill.time}
                              onChange={(e) => setNewBill({ ...newBill, time: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="value-expense">Valor</Label>
                          <Input
                            id="value-expense"
                            type="number"
                            value={newBill.amount}
                            onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
                            placeholder="R$ 0,00"
                            step="0.01"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="payment-method-expense">Modalidade de Pagamento</Label>
                          <Select
                            value={newBill.paymentMethod}
                            onValueChange={(value) => setNewBill({ ...newBill, paymentMethod: value })}
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
                        Confirmar Pagamento
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
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

            {/* Lista de despesas */}
            <Card>
              <CardHeader>
                <CardTitle>Lista de Despesas</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {filteredBills.map((bill) => (
                    <li
                      key={bill._id}
                      className="flex flex-col md:flex-row justify-between items-start md:items-center p-3 bg-white dark:bg-gray-800 rounded-md shadow-sm transition-all duration-300 hover:shadow-md gap-4"
                    >
                      {editingId === bill._id ? (
                        <div className="flex flex-col md:flex-row w-full gap-2">
                          <Input
                            value={newBill.name}
                            onChange={(e) => setNewBill({ ...newBill, name: e.target.value })}
                            className="flex-1 mr-2"
                          />
                          <Input
                            type="number"
                            value={newBill.amount}
                            onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
                            className="w-24 mr-2"
                            step="0.01"
                          />
                          <Input
                            type="date"
                            value={newBill.date}
                            onChange={(e) => setNewBill({ ...newBill, date: e.target.value })}
                            className="w-40 mr-2"
                          />
                          <Select
                            value={newBill.category}
                            onValueChange={(value) => setNewBill({ ...newBill, category: value })}
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
                          <Button variant="ghost" size="icon" onClick={() => saveBill(bill._id)}>
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
                              <span className="font-medium text-gray-800 dark:text-gray-200">
                                {getDoctorName(bill.name)}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {bill.paymentType}
                              </Badge>
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium">{bill.supplierName}</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 md:gap-4">
                            <Badge variant="secondary" className="bg-[#eaf5fd] text-[#009EE3] dark:bg-blue-900 dark:text-blue-100">
                              R$ {bill.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Badge>
                            <Badge variant="secondary" className="bg-[#eaf5fd] text-[#009EE3] dark:bg-blue-900 dark:text-blue-100">
                              <CalendarIcon className="h-3 w-3 mr-1" />
                              {new Date(bill.date).toLocaleDateString('pt-BR')} {bill.time}
                            </Badge>
                            <Badge variant="secondary" className="bg-[#eaf5fd] text-[#009EE3] dark:bg-blue-900 dark:text-blue-100">
                              <Tag className="h-3 w-3 mr-1" />
                              {bill.category}
                            </Badge>
                            <Badge variant="secondary" className="bg-[#eaf5fd] text-[#009EE3] dark:bg-blue-900 dark:text-blue-100">
                              {bill.paymentMethod}
                            </Badge>
                            <Button variant="ghost" size="icon" onClick={() => editBill(bill._id)}>
                              <Edit2 className="h-4 w-4 text-[#009EE3]" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(bill)}>
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
                  <p>Para confirmar a exclusão, digite o nome do fornecedor: <strong>{itemToDelete?.supplierName}</strong></p>
                  <Input
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder="Digite o nome do fornecedor"
                  />
                  <div className="flex justify-end gap-4">
                    <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                      Cancelar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteConfirm}
                      disabled={deleteConfirmation !== itemToDelete?.supplierName}
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
  );
}