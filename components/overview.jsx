"use client"

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useParams } from "next/navigation"

export function Overview() {
  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
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

        // Agrupa dados por mês
        const monthlyData = {}
        
        // Processa receitas
        incomesData.forEach(income => {
          const date = new Date(income.date)
          const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          
          if (!monthlyData[monthYear]) {
            monthlyData[monthYear] = {
              month: date.toLocaleString('pt-BR', { month: 'short' }),
              monthYear,
              revenue: 0,
              expenses: 0
            }
          }
          
          monthlyData[monthYear].revenue += income.amount
        })

        // Processa despesas
        expensesData.forEach(expense => {
          const date = new Date(expense.date)
          const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          
          if (!monthlyData[monthYear]) {
            monthlyData[monthYear] = {
              month: date.toLocaleString('pt-BR', { month: 'short' }),
              monthYear,
              revenue: 0,
              expenses: 0
            }
          }
          
          monthlyData[monthYear].expenses += expense.amount
        })

        // Converte para array e ordena por data
        const sortedData = Object.values(monthlyData)
          .sort((a, b) => new Date(a.monthYear) - new Date(b.monthYear))
          .map(item => ({
            ...item,
            revenue: Number(item.revenue.toFixed(2)),
            expenses: Number(item.expenses.toFixed(2)),
            profit: Number((item.revenue - item.expenses).toFixed(2))
          }))

        // Calcula as variações percentuais
        const dataWithChanges = sortedData.map((item, index) => {
          if (index === 0) {
            return {
              ...item,
              revenueChange: 0,
              expensesChange: 0,
              profitChange: 0
            }
          }

          const prevMonth = sortedData[index - 1]
          const revenueChange = prevMonth.revenue ? ((item.revenue - prevMonth.revenue) / prevMonth.revenue) * 100 : 0
          const expensesChange = prevMonth.expenses ? ((item.expenses - prevMonth.expenses) / prevMonth.expenses) * 100 : 0
          const profitChange = prevMonth.profit ? ((item.profit - prevMonth.profit) / prevMonth.profit) * 100 : 0

          return {
            ...item,
            revenueChange: Number(revenueChange.toFixed(1)),
            expensesChange: Number(expensesChange.toFixed(1)),
            profitChange: Number(profitChange.toFixed(1))
          }
        })

        setData(dataWithChanges)
      } catch (error) {
        console.error('Erro ao buscar dados:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [tenant])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[350px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis 
          dataKey="month" 
          className="text-sm"
        />
        <YAxis 
          className="text-sm"
          tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip 
          formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          labelFormatter={(label) => `${label}`}
        />
        <Line 
          type="monotone" 
          dataKey="revenue" 
          name="Receitas"
          stroke="#2563eb" 
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line 
          type="monotone" 
          dataKey="expenses" 
          name="Despesas"
          stroke="#dc2626" 
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line 
          type="monotone" 
          dataKey="profit" 
          name="Lucro"
          stroke="#16a34a" 
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
} 