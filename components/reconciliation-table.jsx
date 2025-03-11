"use client"

import { useState, useEffect } from 'react'
import { useParams } from "next/navigation"
import { 
  Card, CardHeader, CardTitle, CardContent, CardDescription 
} from "./ui/card"
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell
} from "./ui/table"

export function ReconciliationTable() {
  const [reconciliations, setReconciliations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [summaryData, setSummaryData] = useState({
    pfResult: 0,
    pfIncome: 0,
    pfExpense: 0,
    pjResult: 0,
    pjIncome: 0,
    pjExpense: 0,
    taxDue: 0,
    taxBase: 0
  })
  const { tenant } = useParams()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [incomesResponse, expensesResponse] = await Promise.all([
          fetch(`/api/${tenant}/income`),
          fetch(`/api/${tenant}/bills`)
        ])

        if (!incomesResponse.ok || !expensesResponse.ok) {
          throw new Error('Failed to fetch data')
        }

        const [incomesData, expensesData] = await Promise.all([
          incomesResponse.json(),
          expensesResponse.json()
        ])

        // Processa receitas e despesas com seus tipos de pagamento reais (PF/PJ)
        const allTransactions = [
          ...incomesData.map(income => ({
            id: income._id,
            date: income.date,
            description: income.name ? `Consulta: ${income.name}` : 'Receita',
            category: income.category || 'Receita',
            pfValue: income.paymentType === 'PF' ? income.amount : 0,
            pjValue: income.paymentType === 'PJ' ? income.amount : 0,
            // Cálculo simplificado de imposto: 15% sobre receitas PJ
            tax: income.paymentType === 'PJ' ? income.amount * 0.15 : 0,
            paymentType: income.paymentType,
            isIncome: true
          })),
          ...expensesData.map(expense => ({
            id: expense._id,
            date: expense.date,
            description: expense.supplierName ? `Despesa: ${expense.supplierName}` : 'Despesa',
            category: expense.category || 'Despesa',
            pfValue: expense.paymentType === 'PF' ? -expense.amount : 0, // Negativo para despesas
            pjValue: expense.paymentType === 'PJ' ? -expense.amount : 0, // Negativo para despesas
            tax: 0, // Despesas geralmente não geram impostos diretos
            paymentType: expense.paymentType,
            isIncome: false
          }))
        ]

        // Ordena por data (mais recentes primeiro)
        const sortedTransactions = allTransactions.sort((a, b) => 
          new Date(b.date) - new Date(a.date)
        )

        setReconciliations(sortedTransactions)

        // Calcula os dados de resumo com base nos dados reais
        const pfIncome = incomesData
          .filter(income => income.paymentType === 'PF')
          .reduce((sum, income) => sum + income.amount, 0)
        
        const pfExpense = expensesData
          .filter(expense => expense.paymentType === 'PF')
          .reduce((sum, expense) => sum + expense.amount, 0)
        
        const pjIncome = incomesData
          .filter(income => income.paymentType === 'PJ')
          .reduce((sum, income) => sum + income.amount, 0)
        
        const pjExpense = expensesData
          .filter(expense => expense.paymentType === 'PJ')
          .reduce((sum, expense) => sum + expense.amount, 0)
        
        // Cálculo simplificado de imposto: 15% sobre receitas PJ
        const taxDue = pjIncome * 0.15
        
        setSummaryData({
          pfResult: pfIncome - pfExpense,
          pfIncome,
          pfExpense: -pfExpense, // Convertendo para negativo para exibição
          pjResult: pjIncome - pjExpense,
          pjIncome,
          pjExpense: -pjExpense, // Convertendo para negativo para exibição
          taxDue,
          taxBase: pjIncome // Base de cálculo é a receita PJ
        })
      } catch (error) {
        console.error('Erro ao buscar dados:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [tenant])

  // Função para formatar valores monetários
  const formatCurrency = (value) => {
    const absValue = Math.abs(value)
    if (absValue >= 1000) {
      return `R$ ${(value / 1000).toLocaleString('pt-BR', { 
        minimumFractionDigits: 1, 
        maximumFractionDigits: 1 
      })}K`
    }
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Cards de resumo com skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabela com skeleton */}
        <Card>
          <CardHeader>
            <CardTitle>Conciliação PF/PJ</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Valor PF</TableHead>
                  <TableHead className="text-right">Valor PJ</TableHead>
                  <TableHead className="text-right">Imposto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div></TableCell>
                    <TableCell className="text-right"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse ml-auto"></div></TableCell>
                    <TableCell className="text-right"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse ml-auto"></div></TableCell>
                    <TableCell className="text-right"><div className="h-4 w-16 bg-gray-200 rounded animate-pulse ml-auto"></div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card Resultado PF */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Resultado PF</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${summaryData.pfResult >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(summaryData.pfResult)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Entradas: {formatCurrency(summaryData.pfIncome)} | Saídas: {formatCurrency(summaryData.pfExpense)}
            </p>
          </CardContent>
        </Card>

        {/* Card Resultado PJ */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Resultado PJ</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${summaryData.pjResult >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(summaryData.pjResult)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Entradas: {formatCurrency(summaryData.pjIncome)} | Saídas: {formatCurrency(summaryData.pjExpense)}
            </p>
          </CardContent>
        </Card>

        {/* Card Impostos Devidos */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Impostos Devidos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">
              {formatCurrency(summaryData.taxDue)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Base de Cálculo: {formatCurrency(summaryData.taxBase)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Conciliação */}
      <Card>
        <CardHeader>
          <CardTitle>Conciliação PF/PJ</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Valor PF</TableHead>
                <TableHead className="text-right">Valor PJ</TableHead>
                <TableHead className="text-right">Imposto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reconciliations.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {new Date(item.date).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell className={`text-right ${item.pfValue > 0 ? 'text-green-600' : item.pfValue < 0 ? 'text-red-600' : ''}`}>
                    {item.pfValue !== 0 ? formatCurrency(item.pfValue) : '-'}
                  </TableCell>
                  <TableCell className={`text-right ${item.pjValue > 0 ? 'text-green-600' : item.pjValue < 0 ? 'text-red-600' : ''}`}>
                    {item.pjValue !== 0 ? formatCurrency(item.pjValue) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.tax > 0 ? formatCurrency(item.tax) : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}