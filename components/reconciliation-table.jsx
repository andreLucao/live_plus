"use client"

import { useState, useEffect } from 'react'
import { useParams } from "next/navigation"
import { 
  Card, CardHeader, CardTitle, CardContent, CardDescription 
} from "./ui/card"
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell
} from "./ui/table"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"

export function ReconciliationTable() {
  const [reconciliations, setReconciliations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [summaryData, setSummaryData] = useState({
    pfResult: 0,
    pfIncome: 0,
    pjResult: 0,
    pjIncome: 0,
    totalConciliados: 0,
    totalPendentes: 0,
    totalNaoConciliados: 0,
    taxDue: 0,
    taxBase: 0
  })
  const { tenant } = useParams()

  useEffect(() => {
    fetchData()
  }, [tenant])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const incomesResponse = await fetch(`/api/${tenant}/income`)

      if (!incomesResponse.ok) {
        throw new Error('Failed to fetch data')
      }

      const incomesData = await incomesResponse.json()

      // Processa apenas as receitas com seus valores conciliados
      const allTransactions = incomesData.map(income => {
        // Define o status de conciliação baseado nos valores
        let status = 'Não conciliado'
        
        if (income.valorConciliado && income.valorConciliado > 0) {
          if (income.valorConciliado === income.amount) {
            status = 'Conciliado'
          } else if (income.paymentType === 'PJ') {
            status = 'Pendente: PJ maior'
          } else if (income.paymentType === 'PF') {
            status = 'Pendente: PF maior'
          }
        } else {
          status = income.statusConciliacao || 'Não conciliado'
        }
        
        return {
          id: income._id,
          date: income.date,
          description: income.name ? `Consulta: ${income.name}` : 'Receita',
          category: income.category || 'Receita',
          pfValue: income.paymentType === 'PF' ? income.amount : income.valorConciliado || 0,
          pjValue: income.paymentType === 'PJ' ? income.amount : income.valorConciliado || 0,
          paymentType: income.paymentType,
          valorConciliado: income.valorConciliado || 0,
          status: status,
          amount: income.amount
        }
      })

      // Ordena por data (mais recentes primeiro)
      const sortedTransactions = allTransactions.sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      )

      setReconciliations(sortedTransactions)
      calculateSummary(incomesData)
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateSummary = (incomesData) => {
    // Calcula receitas PF (valores originais + valores conciliados de PJ)
    const pfOriginal = incomesData
      .filter(income => income.paymentType === 'PF')
      .reduce((sum, income) => sum + income.amount, 0)
      
    const pfConciliado = incomesData
      .filter(income => income.paymentType === 'PJ' && income.valorConciliado > 0)
      .reduce((sum, income) => sum + income.valorConciliado, 0)
    
    const pfTotal = pfOriginal + pfConciliado
    
    // Calcula receitas PJ (valores originais + valores conciliados de PF)
    const pjOriginal = incomesData
      .filter(income => income.paymentType === 'PJ')
      .reduce((sum, income) => sum + income.amount, 0)
      
    const pjConciliado = incomesData
      .filter(income => income.paymentType === 'PF' && income.valorConciliado > 0)
      .reduce((sum, income) => sum + income.valorConciliado, 0)
    
    const pjTotal = pjOriginal + pjConciliado
    
    // Cálculo de totais por status
    const conciliados = incomesData
      .filter(income => 
        income.valorConciliado === income.amount && 
        income.valorConciliado > 0
      )
      .length

    const pendentes = incomesData
      .filter(income => 
        income.valorConciliado > 0 && 
        income.valorConciliado !== income.amount
      )
      .length
      
    const naoConciliados = incomesData
      .filter(income => 
        !income.valorConciliado || income.valorConciliado === 0
      )
      .length
    
    // Cálculo simplificado de imposto: 15% sobre receitas PJ
    const taxDue = pjTotal * 0.15
    
    setSummaryData({
      pfResult: pfTotal,
      pfIncome: pfTotal,
      pjResult: pjTotal,
      pjIncome: pjTotal,
      totalConciliados: conciliados,
      totalPendentes: pendentes,
      totalNaoConciliados: naoConciliados,
      taxDue,
      taxBase: pjTotal // Base de cálculo é a receita PJ total (incluindo conciliadas)
    })
  }

  const handleEditClick = (item) => {
    setEditingId(item.id)
    // Se for receita PJ, editamos o valor PF conciliado e vice-versa
    const initialValue = item.paymentType === 'PJ' ? item.pfValue : item.pjValue
    setEditValue(initialValue.toString())
  }

  const handleSaveEdit = async (item) => {
    try {
      const value = parseFloat(editValue)
      if (isNaN(value) || value < 0) {
        alert('Por favor, insira um valor válido')
        return
      }

      const response = await fetch(`/api/${tenant}/income/${item.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          valorConciliado: value,
          // Calculamos o status baseado no tipo de pagamento original e valor conciliado
          statusConciliacao: calculateStatus(item.paymentType, item.amount, value)
        }),
      })

      if (!response.ok) {
        throw new Error('Falha ao atualizar o valor conciliado')
      }

      // Atualiza a lista local
      setReconciliations(prevItems => 
        prevItems.map(prevItem => {
          if (prevItem.id === item.id) {
            // Atualiza o valor conciliado e status
            const updatedItem = { ...prevItem }
            if (prevItem.paymentType === 'PJ') {
              updatedItem.pfValue = value
            } else {
              updatedItem.pjValue = value
            }
            updatedItem.valorConciliado = value
            updatedItem.status = calculateStatus(
              prevItem.paymentType, 
              prevItem.amount,
              value
            )
            return updatedItem
          }
          return prevItem
        })
      )

      // Atualiza o resumo após edição
      fetchData()
      
      setEditingId(null)
      setEditValue('')
    } catch (error) {
      console.error('Erro ao salvar edição:', error)
    }
  }

  const calculateStatus = (paymentType, originalValue, conciliatedValue) => {
    if (conciliatedValue === 0) return 'Não conciliado'
    
    // Se os valores são iguais, está conciliado independente do tipo
    if (conciliatedValue === originalValue) return 'Conciliado'
    
    // Caso contrário, o status é baseado no tipo de pagamento, não no valor
    if (paymentType === 'PJ') {
      return 'Pendente: PJ maior'
    } else { // PF
      return 'Pendente: PF maior'
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditValue('')
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Conciliado':
        return 'bg-green-100 text-green-800'
      case 'Pendente: PJ maior':
        return 'bg-yellow-100 text-yellow-800'
      case 'Pendente: PF maior':
        return 'bg-orange-100 text-orange-800'
      case 'Não conciliado':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Função para formatar valores monetários - sem abreviações
  const formatCurrency = (value) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Cards de resumo com skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, index) => (
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Valor PF</TableHead>
                    <TableHead className="text-right">Valor PJ</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead>Ações</TableHead>
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
                      <TableCell><div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card Receitas PF */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Receitas PF</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(summaryData.pfIncome)}
            </p>
          </CardContent>
        </Card>

        {/* Card Receitas PJ */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Receitas PJ</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(summaryData.pjIncome)}
            </p>
          </CardContent>
        </Card>

        {/* Card Status de Conciliação */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Status de Conciliação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Conciliados:</span>
                <Badge className="bg-green-100 text-green-800">
                  {summaryData.totalConciliados}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Pendentes:</span>
                <Badge className="bg-yellow-100 text-yellow-800">
                  {summaryData.totalPendentes}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Não conciliados:</span>
                <Badge className="bg-red-100 text-red-800">
                  {summaryData.totalNaoConciliados}
                </Badge>
              </div>
            </div>
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
          <CardDescription>
            Clique em "Editar" para modificar valores de conciliação entre pessoa física e jurídica.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Valor PF</TableHead>
                  <TableHead className="text-right">Valor PJ</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reconciliations.length > 0 ? (
                  reconciliations.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {new Date(item.date).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate">
                        {item.description}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {item.category}
                      </TableCell>
                      <TableCell className={`text-right whitespace-nowrap ${item.pfValue > 0 ? 'text-green-600' : ''}`}>
                        {item.paymentType === 'PJ' && editingId === item.id ? (
                          <Input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-24 inline-block"
                            min="0"
                            step="0.01"
                          />
                        ) : (
                          item.pfValue !== 0 ? formatCurrency(item.pfValue) : '-'
                        )}
                      </TableCell>
                      <TableCell className={`text-right whitespace-nowrap ${item.pjValue > 0 ? 'text-green-600' : ''}`}>
                        {item.paymentType === 'PF' && editingId === item.id ? (
                          <Input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-24 inline-block"
                            min="0"
                            step="0.01"
                          />
                        ) : (
                          item.pjValue !== 0 ? formatCurrency(item.pjValue) : '-'
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge 
                          className={`inline-flex items-center ${getStatusColor(item.status)} px-2 py-1 text-xs font-medium`}
                          variant="outline"
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {editingId === item.id ? (
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleSaveEdit(item)}
                              className="h-8 px-2 whitespace-nowrap"
                            >
                              Salvar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={handleCancelEdit}
                              className="h-8 px-2 whitespace-nowrap"
                            >
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleEditClick(item)}
                            className="h-8 px-3"
                          >
                            Editar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                      Nenhuma receita encontrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}