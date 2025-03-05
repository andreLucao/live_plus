"use client"

import { useState, useEffect } from 'react'
import { useParams } from "next/navigation"

export function CustomerMetrics() {
  const [metrics, setMetrics] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { tenant } = useParams()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Busca dados de clientes e transações
        const [clientsResponse, incomesResponse] = await Promise.all([
          fetch(`/api/${tenant}/clients`),
          fetch(`/api/${tenant}/income`)
        ])

        if (!clientsResponse.ok || !incomesResponse.ok) {
          throw new Error('Failed to fetch data')
        }

        const [clientsData, incomesData] = await Promise.all([
          clientsResponse.json(),
          incomesResponse.json()
        ])

        const today = new Date()
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        const twoMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2, 1)

        // Calcula clientes ativos (que tiveram transação nos últimos 2 meses)
        const activeClients = new Set(
          incomesData
            .filter(income => new Date(income.date) >= twoMonthsAgo)
            .map(income => income.clientId)
        ).size

        // Calcula clientes ativos do mês passado para comparação
        const lastMonthActiveClients = new Set(
          incomesData
            .filter(income => {
              const date = new Date(income.date)
              return date >= twoMonthsAgo && date < lastMonth
            })
            .map(income => income.clientId)
        ).size

        // Calcula ticket médio
        const currentMonthTransactions = incomesData.filter(
          income => new Date(income.date) >= lastMonth
        )
        
        const ticketMedio = currentMonthTransactions.length > 0
          ? currentMonthTransactions.reduce((sum, income) => sum + income.amount, 0) / currentMonthTransactions.length
          : 0

        const lastMonthTransactions = incomesData.filter(
          income => {
            const date = new Date(income.date)
            return date >= twoMonthsAgo && date < lastMonth
          }
        )

        const lastMonthTicketMedio = lastMonthTransactions.length > 0
          ? lastMonthTransactions.reduce((sum, income) => sum + income.amount, 0) / lastMonthTransactions.length
          : 0

        // Calcula taxa de retenção
        const currentMonthClients = new Set(currentMonthTransactions.map(t => t.clientId))
        const lastMonthClients = new Set(lastMonthTransactions.map(t => t.clientId))
        const retainedClients = [...currentMonthClients].filter(id => lastMonthClients.has(id)).length
        const retentionRate = lastMonthClients.size > 0
          ? (retainedClients / lastMonthClients.size) * 100
          : 0

        const lastRetentionRate = 0 // Você precisará implementar a lógica para o período anterior

        // Calcula NPS (se disponível nos dados do cliente)
        const npsScores = clientsData
          .filter(client => client.nps && new Date(client.npsDate) >= lastMonth)
          .map(client => client.nps)
        
        const nps = npsScores.length > 0
          ? Math.round(npsScores.reduce((sum, score) => sum + score, 0) / npsScores.length)
          : 0

        const lastNps = 0 // Você precisará implementar a lógica para o período anterior

        setMetrics([
          {
            label: "Clientes Ativos",
            value: activeClients,
            change: `${calculateChange(activeClients, lastMonthActiveClients)}%`
          },
          {
            label: "Ticket Médio",
            value: `R$ ${ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            change: `${calculateChange(ticketMedio, lastMonthTicketMedio)}%`
          },
          {
            label: "Taxa de Retenção",
            value: `${retentionRate.toFixed(1)}%`,
            change: `${calculateChange(retentionRate, lastRetentionRate)}%`
          },
          {
            label: "NPS",
            value: nps,
            change: `${calculateChange(nps, lastNps)}%`
          }
        ])

      } catch (error) {
        console.error('Erro ao buscar dados:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [tenant])

  const calculateChange = (current, previous) => {
    if (!previous) return "+0"
    const change = ((current - previous) / previous) * 100
    return change >= 0 ? `+${change.toFixed(1)}` : change.toFixed(1)
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="p-4 bg-white rounded-lg shadow-sm">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, index) => (
        <div key={index} className="p-4 bg-white rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">{metric.label}</h3>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold">{metric.value}</span>
            <span className={`text-xs ${metric.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
              {metric.change}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
} 