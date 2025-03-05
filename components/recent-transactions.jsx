"use client"

import { useState, useEffect } from 'react'
import { useParams } from "next/navigation"

export function RecentTransactions() {
  const [transactions, setTransactions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { tenant } = useParams()

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const [incomesResponse, expensesResponse] = await Promise.all([
          fetch(`/api/${tenant}/income`),
          fetch(`/api/${tenant}/bills`)
        ])

        if (!incomesResponse.ok || !expensesResponse.ok) {
          throw new Error('Failed to fetch transactions')
        }

        const [incomesData, expensesData] = await Promise.all([
          incomesResponse.json(),
          expensesResponse.json()
        ])

        // Formata receitas
        const formattedIncomes = incomesData.map(income => ({
          id: income._id,
          description: income.description || 'Receita',
          amount: income.amount,
          type: 'income',
          date: income.date
        }))

        // Formata despesas
        const formattedExpenses = expensesData.map(expense => ({
          id: expense._id,
          description: expense.description || 'Despesa',
          amount: -expense.amount, // Valor negativo para despesas
          type: 'expense',
          date: expense.date
        }))

        // Combina e ordena por data (mais recentes primeiro)
        const allTransactions = [...formattedIncomes, ...formattedExpenses]
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 4) // Pega apenas as 4 transações mais recentes

        setTransactions(allTransactions)
      } catch (error) {
        console.error('Erro ao buscar transações:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTransactions()
  }, [tenant])

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="animate-pulse flex items-center justify-between">
            <div className="space-y-1">
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
              <div className="h-3 w-24 bg-gray-200 rounded"></div>
            </div>
            <div className="h-4 w-20 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => (
        <div key={transaction.id} className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">{transaction.description}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(transaction.date).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <div className={`text-sm font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
            {transaction.type === 'income' ? '+' : '-'}R$ {Math.abs(transaction.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>
      ))}
    </div>
  )
} 