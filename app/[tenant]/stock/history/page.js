'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { History, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Sidebar from "@/components/Sidebar";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, subDays, startOfWeek, startOfMonth, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

export default function StockHistoryPage() {
  const router = useRouter();
  const { tenant } = useParams();
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
    type: 'all',
    period: 'all',
    product: 'all',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchProducts();
  }, [tenant]);

  useEffect(() => {
    fetchMovements();
  }, [filters, tenant]);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`/api/${tenant}/stock`);
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchMovements = async () => {
    try {
      let queryParams = new URLSearchParams();
      
      // Add movement type filter
      if (filters.type !== 'all') {
        queryParams.append('type', filters.type);
      }

      // Add product filter
      if (filters.product !== 'all') {
        queryParams.append('product_id', filters.product);
      }

      // Add date range filter
      const today = new Date();
      
      switch (filters.period) {
        case 'today':
          queryParams.append('start_date', format(today, 'yyyy-MM-dd'));
          queryParams.append('end_date', format(subDays(today, -1), 'yyyy-MM-dd'));
          break;
        case 'week':
          queryParams.append('start_date', format(startOfWeek(today, { locale: ptBR }), 'yyyy-MM-dd'));
          break;
        case 'month':
          queryParams.append('start_date', format(startOfMonth(today), 'yyyy-MM-dd'));
          break;
        case '30days':
          queryParams.append('start_date', format(subDays(today, 30), 'yyyy-MM-dd'));
          break;
        case 'custom':
          if (filters.startDate && filters.endDate) {
            queryParams.append('start_date', filters.startDate);
            queryParams.append('end_date', filters.endDate);
          }
          break;
      }

      // Updated API endpoint to include tenant
      const response = await fetch(`/api/${tenant}/stock/movements?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch movements');
      }

      const data = await response.json();

      // Transform data to match the UI requirements
      const transformedMovements = data.map(movement => ({
        _id: movement._id,
        type: movement.type,
        quantity: movement.quantity,
        observations: movement.observations,
        expiration_date: movement.expiration_date,
        createdAt: movement.created_at,
        product: products.find(p => p._id === movement.product_id)
      }));

      setMovements(transformedMovements);
    } catch (error) {
      console.error('Error fetching movements:', error);
    }
  };

  const getMovementTypeColor = (type) => {
    return type === 'incoming' 
      ? 'text-green-600 dark:text-green-400'
      : 'text-red-600 dark:text-red-400';
  };

  const getMovementTypeText = (type) => {
    return type === 'incoming' ? 'Entrada' : 'Saída';
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="space-y-6 p-6 bg-[#F9FAFB] dark:bg-gray-900 min-h-screen">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div className="flex flex-col">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    onClick={() => router.push(`/${tenant}/stock`)}
                    className="p-0 hover:bg-transparent"
                  >
                    <ArrowLeft size={24} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" />
                  </Button>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <History size={20} />
                    Histórico de Movimentações
                  </h1>
                </div>
              </div>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Filtros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label>Tipo de Movimentação</Label>
                    <Select 
                      value={filters.type}
                      onValueChange={(value) => setFilters({...filters, type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="incoming">Entradas</SelectItem>
                        <SelectItem value="outgoing">Saídas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Período</Label>
                    <Select 
                      value={filters.period}
                      onValueChange={(value) => setFilters({...filters, period: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o período" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="today">Hoje</SelectItem>
                        <SelectItem value="week">Esta semana</SelectItem>
                        <SelectItem value="month">Este mês</SelectItem>
                        <SelectItem value="30days">Últimos 30 dias</SelectItem>
                        <SelectItem value="custom">Período personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Produto</Label>
                    <Select 
                      value={filters.product}
                      onValueChange={(value) => setFilters({...filters, product: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o produto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {products.map((product) => (
                          <SelectItem key={product._id} value={product._id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {filters.period === 'custom' && (
                    <div className="col-span-1 md:col-span-2 lg:col-span-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Data Inicial</Label>
                        <Input
                          type="date"
                          value={filters.startDate}
                          onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>Data Final</Label>
                        <Input
                          type="date"
                          value={filters.endDate}
                          onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Movimentações</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Observações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((movement) => (
                      <TableRow key={movement._id}>
                        <TableCell>
                          {format(new Date(movement.createdAt), 'dd/MM/yyyy HH:mm')}
                        </TableCell>
                        <TableCell className={getMovementTypeColor(movement.type)}>
                          {getMovementTypeText(movement.type)}
                        </TableCell>
                        <TableCell>{movement.product?.name || 'N/A'}</TableCell>
                        <TableCell>{movement.quantity}</TableCell>
                        <TableCell>
                          {movement.expiration_date 
                            ? format(new Date(movement.expiration_date), 'dd/MM/yyyy')
                            : 'N/A'}
                        </TableCell>
                        <TableCell>{movement.observations || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}