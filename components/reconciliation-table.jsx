"use client"

import { useState, useEffect } from 'react'
import { useParams } from "next/navigation"

export function ReconciliationTable() {
  const [reconciliations, setReconciliations] = useState([])
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

        // Combina receitas e despesas
        const allTransactions = [
          ...incomesData.map(income => ({
            id: income._id,
            date: income.date,
            description: income.description || 'Receita',
            systemValue: income.amount,
            bankValue: income.bankValue || income.amount, // Usa bankValue se existir, senão usa amount
            status: income.bankValue === income.amount ? 'reconciled' : 'pending'
          })),
          ...expensesData.map(expense => ({
            id: expense._id,
            date: expense.date,
            description: expense.description || 'Despesa',
            systemValue: expense.amount,
            bankValue: expense.bankValue || expense.amount,
            status: expense.bankValue === expense.amount ? 'reconciled' : 'pending'
          }))
        ]

        // Ordena por data (mais recentes primeiro)
        const sortedTransactions = allTransactions.sort((a, b) => 
          new Date(b.date) - new Date(a.date)
        )

        setReconciliations(sortedTransactions)
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
      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-2 text-left text-sm">Data</th>
              <th className="p-2 text-left text-sm">Descrição</th>
              <th className="p-2 text-right text-sm">Sistema</th>
              <th className="p-2 text-right text-sm">Banco</th>
              <th className="p-2 text-center text-sm">Status</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, index) => (
              <tr key={index} className="border-b">
                <td className="p-2">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                </td>
                <td className="p-2">
                  <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
                </td>
                <td className="p-2">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse ml-auto"></div>
                </td>
                <td className="p-2">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse ml-auto"></div>
                </td>
                <td className="p-2">
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mx-auto"></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="p-2 text-left text-sm">Data</th>
            <th className="p-2 text-left text-sm">Descrição</th>
            <th className="p-2 text-right text-sm">Sistema</th>
            <th className="p-2 text-right text-sm">Banco</th>
            <th className="p-2 text-center text-sm">Status</th>
          </tr>
        </thead>
        <tbody>
          {reconciliations.map((item) => (
            <tr key={item.id} className="border-b">
              <td className="p-2 text-sm">
                {new Date(item.date).toLocaleDateString('pt-BR')}
              </td>
              <td className="p-2 text-sm">{item.description}</td>
              <td className="p-2 text-right text-sm">
                R$ {item.systemValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </td>
              <td className="p-2 text-right text-sm">
                R$ {item.bankValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </td>
              <td className="p-2 text-center">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  item.status === 'reconciled' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {item.status === 'reconciled' ? 'Conciliado' : 'Pendente'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
} 