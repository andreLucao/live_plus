"use client"

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function BillManager() {
  const [bills, setBills] = useState([])
  const [newBill, setNewBill] = useState({ name: "", amount: "", date: "" })
  const [filter, setFilter] = useState("all")

  const addBill = (e) => {
    e.preventDefault()
    if (newBill.name && newBill.amount && newBill.date) {
      setBills([...bills, { ...newBill, id: Date.now().toString(), amount: parseFloat(newBill.amount) }])
      setNewBill({ name: "", amount: "", date: "" })
    }
  }

  const removeBill = (id) => {
    setBills(bills.filter((bill) => bill.id !== id))
  }

  const filteredBills = bills.filter((bill) => {
    if (filter === "all") return true
    return new Date(bill.date).getMonth() === parseInt(filter) - 1
  })

  const totalSum = filteredBills.reduce((sum, bill) => sum + bill.amount, 0)

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Bill Manager</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={addBill} className="space-y-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="billName">Bill Name</Label>
              <Input
                id="billName"
                value={newBill.name}
                onChange={(e) => setNewBill({ ...newBill, name: e.target.value })}
                placeholder="Enter bill name"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="billAmount">Amount</Label>
              <Input
                id="billAmount"
                type="number"
                value={newBill.amount}
                onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
                placeholder="Enter amount"
                step="0.01"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="billDate">Date</Label>
              <Input
                id="billDate"
                type="date"
                value={newBill.date}
                onChange={(e) => setNewBill({ ...newBill, date: e.target.value })}
              />
            </div>
          </div>
          <Button type="submit" className="w-full">
            <Plus className="mr-2 h-4 w-4" /> Add New Bill
          </Button>
        </form>

        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Bills</h3>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Bills</SelectItem>
              <SelectItem value="1">January</SelectItem>
              <SelectItem value="2">February</SelectItem>
              <SelectItem value="3">March</SelectItem>
              <SelectItem value="4">April</SelectItem>
              <SelectItem value="5">May</SelectItem>
              <SelectItem value="6">June</SelectItem>
              <SelectItem value="7">July</SelectItem>
              <SelectItem value="8">August</SelectItem>
              <SelectItem value="9">September</SelectItem>
              <SelectItem value="10">October</SelectItem>
              <SelectItem value="11">November</SelectItem>
              <SelectItem value="12">December</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ul className="space-y-2">
          {filteredBills.map((bill) => (
            <li key={bill.id} className="flex justify-between items-center p-2 bg-muted rounded-md">
              <span>{bill.name}</span>
              <div className="flex items-center gap-4">
                <span>${bill.amount.toFixed(2)}</span>
                <span>{new Date(bill.date).toLocaleDateString()}</span>
                <Button variant="ghost" size="icon" onClick={() => removeBill(bill.id)}>
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Remove bill</span>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <div className="w-full text-right">
          <p className="text-lg font-semibold">
            Total: <span className="text-primary">${totalSum.toFixed(2)}</span>
          </p>
        </div>
      </CardFooter>
    </Card>
  )
}
