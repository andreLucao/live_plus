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

export default function HospitalIncomeManager() {
  const [incomes, setIncomes] = useState([])
  const [newIncome, setNewIncome] = useState({ name: "", amount: "", date: "", category: "" })
  const [monthFilter, setMonthFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [editingId, setEditingId] = useState(null)
  const [darkMode, setDarkMode] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

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
      const response = await fetch('/api/incomes')
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
        const response = await fetch('/api/incomes', {
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
        setError("")
      } catch (error) {
        console.error('Error adding income:', error)
        setError("Failed to add income. Please try again.")
      }
    }
  }

  const removeIncome = async (id) => {
    try {
      const response = await fetch(`/api/incomes/${id}`, {
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
      const response = await fetch('/api/incomes', {
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
    "Consultations",
    "Surgeries",
    "Laboratory Tests",
    "Imaging Services",
    "Emergency Services",
    "Pharmacy Sales",
    "Insurance Claims",
    "Outpatient Services",
    "Specialized Procedures",
    "Other Services",
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
    <Card className="w-full max-w-4xl mx-auto bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-gray-800 dark:to-gray-900">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-blue-600">
          Income
        </CardTitle>
        <Switch checked={darkMode} onCheckedChange={setDarkMode} className="ml-4" />
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={addIncome} className="space-y-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="incomeName" className="text-cyan-700 dark:text-cyan-300">
                Income Name
              </Label>
              <Input
                id="incomeName"
                value={newIncome.name}
                onChange={(e) => setNewIncome({ ...newIncome, name: e.target.value })}
                placeholder="Enter income name"
                className="border-cyan-200 dark:border-cyan-700"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="incomeAmount" className="text-green-700 dark:text-green-300">
                Amount
              </Label>
              <Input
                id="incomeAmount"
                type="number"
                value={newIncome.amount}
                onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })}
                placeholder="Enter amount"
                step="0.01"
                className="border-green-200 dark:border-green-700"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="incomeDate" className="text-blue-700 dark:text-blue-300">
                Date
              </Label>
              <Input
                id="incomeDate"
                type="date"
                value={newIncome.date}
                onChange={(e) => setNewIncome({ ...newIncome, date: e.target.value })}
                className="border-blue-200 dark:border-blue-700"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="incomeCategory" className="text-indigo-700 dark:text-indigo-300">
                Category
              </Label>
              <Select value={newIncome.category} onValueChange={(value) => setNewIncome({ ...newIncome, category: value })}>
                <SelectTrigger className="border-indigo-200 dark:border-indigo-700">
                  <SelectValue placeholder="Select category" />
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
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
          >
            <Plus className="mr-2 h-4 w-4" /> Add New Income
          </Button>
        </form>

        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-cyan-700 dark:text-cyan-300">Hospital Income</h3>
          <div className="flex gap-2">
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="w-[180px] border-cyan-200 dark:border-cyan-700">
                <SelectValue placeholder="Filter by month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    {new Date(0, i).toLocaleString("default", { month: "long" })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px] border-indigo-200 dark:border-indigo-700">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
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
              className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-md shadow-md transition-all duration-300 hover:shadow-lg"
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
                  <Button variant="ghost" size="icon" onClick={() => saveIncome(income._id)}>
                    <Save className="h-4 w-4 text-green-500" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={cancelEdit}>
                    <X className="h-4 w-4 text-red-500" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="font-medium text-gray-800 dark:text-gray-200">{income.name}</span>
                  <div className="flex items-center gap-4">
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    >
                      <DollarSign className="h-3 w-3 mr-1" />
                      {income.amount.toFixed(2)}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    >
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(income.date).toLocaleDateString()}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {income.category}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => editIncome(income._id)}>
                      <Edit2 className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => removeIncome(income._id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <div className="w-full text-right">
          <p className="text-xl font-semibold">
            Total Income:{" "}
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-blue-500">
              ${totalSum.toFixed(2)}
            </span>
          </p>
        </div>
      </CardFooter>
    </Card>
  )
}