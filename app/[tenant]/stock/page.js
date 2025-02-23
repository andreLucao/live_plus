'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from "@/components/ui/badge";
import { FileBox } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from 'date-fns';
import { Trash2, AlertCircle, PackageCheck, Calendar, AlertTriangle, Pencil } from 'lucide-react';
import Sidebar from "@/components/Sidebar";
import { useRouter } from 'next/navigation';

const AVAILABLE_UNITS = [
    'Comprimido',
    'Ampola',
    'Frasco Ampola',
    'Cápsula',
    'Miligrama',
    'Mililitro',
    'Frasco',
    'Seringa',
    'Unidade Internacional',
    'Gotas',
    'Bisnaga',
    'Drágea',
    'Flaconete',
    'Bolsa',
    'Adesivo Transdérmico',
    'Comprimido Efervecente',
    'Comprimido Mastigável',
    'Supositório',
    'Caixa',
    'Tubo',
    'Envelope',
    'Carpule',
    'Dose',
    'Óvulo',
    'Pastilha',
    'Glóbulo',
    'Grama',
    'Litro',
    'Microgramas',
    'Quilograma',
    'Tablete',
    'Tubete',
    'Unidade',
    'Centímetro',
    'Kit',
    'Metro',
    'Pacote',
    'Sache',
    'Pote',
    'Lata',
    'Pérola',
    'Pílula',
    'Galão',
    'Milhões de Unidades Internac',
    'Bilhões de Unidades Internac',
    'Conjunto',
    'Maço',
    'Peça',
    'Rolo',
    'Gray',
    'Centgray',
    'Par',
    'Metro Linear',
    'Metro Quadrado',
    'Metro Cúbico',
    'Miligrama / peso',
    'Miligrama por metro quadrado',
    'Calorias',
    'Unidade internacional por metr',
    'Unidade internacional por mili',
    'Centímetro cúbico'
];

export default function StockPage() {
  const router = useRouter();
  const { tenant } = useParams();
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isAddingMovement, setIsAddingMovement] = useState(false);
  const [movementType, setMovementType] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [itemToDelete, setItemToDelete] = useState(null);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [editedProduct, setEditedProduct] = useState({
    code: '',
    unit: '',
    minimum_stock: 0,
    observations: ''
  });
  const [newProduct, setNewProduct] = useState({
    name: '',
    code: '',
    minimum_stock: 0,
    unit: '',
    quantity: 0,
    observations: ''
  });
  const [movement, setMovement] = useState({
    product_id: '',
    quantity: 0,
    expiration_date: '',
    observations: ''
  });

  useEffect(() => {
    fetchProducts();
  }, [filter, tenant]);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`/api/${tenant}/stock?filter=${filter}`);
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/${tenant}/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });
      
      if (response.ok) {
        setIsAddingProduct(false);
        fetchProducts();
        setNewProduct({
          name: '',
          code: '',
          minimum_stock: 0,
          unit: '',
          quantity: 0,
          observations: ''
        });
      }
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  const handleMovement = async (e) => {
    e.preventDefault();
    try {
      const movementData = {
        ...movement,
        expiration_date: movementType === 'incoming' ? movement.expiration_date : undefined
      };

      const response = await fetch(`/api/${tenant}/stock/${movement.product_id}/${movementType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(movementData)
      });
      
      if (response.ok) {
        setIsAddingMovement(false);
        fetchProducts();
        setMovement({
          product_id: '',
          quantity: 0,
          expiration_date: '',
          observations: ''
        });
      }
    } catch (error) {
      console.error('Error registering movement:', error);
    }
  };

  const handleDeleteClick = (product) => {
    setItemToDelete(product);
    setIsDeleteModalOpen(true);
    setDeleteConfirmation("");
  };

  const handleEditClick = (product) => {
    setItemToEdit(product);
    setEditedProduct({
      code: product.code || '',
      unit: product.unit || '',
      minimum_stock: product.minimum_stock || 0,
      observations: product.observations || ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!itemToEdit?._id) {
      console.error('No item selected for editing');
      return;
    }

    try {
      const response = await fetch(`/api/${tenant}/stock/${itemToEdit._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: itemToEdit.name,
          code: editedProduct.code,
          unit: editedProduct.unit,
          minimum_stock: parseInt(editedProduct.minimum_stock),
          observations: editedProduct.observations,
          quantity: itemToEdit.quantity
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(`HTTP error! status: ${response.status}${errorData ? ` - ${JSON.stringify(errorData)}` : ''}`);
      }
      
      await fetchProducts();
      setIsEditModalOpen(false);
      setItemToEdit(null);
      setEditedProduct({
        code: '',
        unit: '',
        minimum_stock: 0,
        observations: ''
      });
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmation === itemToDelete?.name) {
      try {
        const response = await fetch(`/api/${tenant}/stock/${itemToDelete._id}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          setIsDeleteModalOpen(false);
          fetchProducts();
          setItemToDelete(null);
          setDeleteConfirmation("");
        }
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const getStockStatus = (product) => {
    if (product.quantity <= product.minimum_stock) {
      return {
        label: "Estoque Baixo",
        badge: (
          <Badge 
            variant="secondary" 
            className="bg-[#fff4e5] text-[#ff9500] dark:bg-orange-900 dark:text-orange-100"
          >
            <AlertCircle className="h-3 w-3 mr-1" />
            Estoque Baixo
          </Badge>
        )
      };
    }
    return null;
  };

  const isValidDate = (date) => {
    if (!date) return false;
    const parsedDate = new Date(date);
    return parsedDate instanceof Date && !isNaN(parsedDate) && parsedDate.getFullYear() > 1970;
  };

  const getExpirationStatus = (date) => {
    if (!isValidDate(date)) return null;
    
    const expirationDate = new Date(date);
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    if (expirationDate < today) {
      return {
        label: "Vencido",
        badge: (
          <Badge 
            variant="secondary" 
            className="bg-[#fde7e7] text-[#e32400] dark:bg-red-900 dark:text-red-100"
          >
            <AlertTriangle className="h-3 w-3 mr-1" />
            Vencido
          </Badge>
        )
      };
    } else if (expirationDate <= thirtyDaysFromNow) {
      return {
        label: "Vence em breve",
        badge: (
          <Badge 
            variant="secondary" 
            className="bg-[#fff4e5] text-[#ff9500] dark:bg-orange-900 dark:text-orange-100"
          >
            <Calendar className="h-3 w-3 mr-1" />
            Vence em {Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24))} dias
          </Badge>
        )
      };
    }
    return {
      label: "Em dia",
      badge: (
        <Badge 
          variant="secondary" 
          className="bg-[#e7f5e7] text-[#00b341] dark:bg-green-900 dark:text-green-100"
        >
          <PackageCheck className="h-3 w-3 mr-1" />
          Dentro da validade
        </Badge>
      )
    };
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="space-y-6 p-6 bg-[#F9FAFB] dark:bg-gray-900 min-h-screen">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FileBox size={20} />
                  Gestão de Estoque
                </h1>
              </div>
              
              <div className="flex items-center gap-2">
                <Dialog open={isAddingProduct} onOpenChange={setIsAddingProduct}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#009EE3] hover:bg-[#0080B7] text-white">
                      Adicionar Produto
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Novo Produto</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddProduct} className="space-y-4">
                      <div>
                        <Label htmlFor="productName">Nome do Produto</Label>
                        <Input
                          id="productName"
                          placeholder="Digite o nome do produto"
                          value={newProduct.name}
                          onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="productCode">Código</Label>
                        <Input
                          id="productCode"
                          placeholder="Digite o código (opcional)"
                          value={newProduct.code}
                          onChange={(e) => setNewProduct({...newProduct, code: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="minimumStock">Estoque Mínimo</Label>
                        <Input
                          id="minimumStock"
                          type="number"
                          placeholder="Digite o estoque mínimo"
                          value={newProduct.minimum_stock}
                          onChange={(e) => setNewProduct({...newProduct, minimum_stock: parseInt(e.target.value)})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="unit">
                          Unidade <span className="text-sm text-gray-500">(digite ou selecione)</span>
                        </Label>
                        <Select 
                          value={newProduct.unit}
                          onValueChange={(value) => setNewProduct({...newProduct, unit: value})}
                          required
                        >
                          <SelectTrigger id="unit" className="border-[#009EE3] focus:ring-2 focus:ring-[#009EE3]">
                            <SelectValue placeholder="Digite ou selecione a unidade" />
                          </SelectTrigger>
                          <SelectContent>
                            <div className="px-3 py-2 text-sm text-gray-500">
                              Digite para filtrar ou selecione uma opção
                            </div>
                            {AVAILABLE_UNITS.map((unit) => (
                              <SelectItem key={unit} value={unit}>
                                {unit}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="observations">Observações</Label>
                        <Input
                          id="observations"
                          placeholder="Observações (opcional)"
                          value={newProduct.observations}
                          onChange={(e) => setNewProduct({...newProduct, observations: e.target.value})}
                        />
                      </div>
                      <Button type="submit" className="w-full bg-[#009EE3] hover:bg-[#0080B7] text-white">
                        Salvar
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>

                <Dialog open={isAddingMovement} onOpenChange={setIsAddingMovement}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      onClick={() => setMovementType('incoming')}
                      className="hover:bg-[#009EE3] hover:text-white"
                    >
                      Entrada
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {movementType === 'incoming' ? 'Nova Entrada' : 'Nova Saída'}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleMovement} className="space-y-4">
                      <div>
                        <Label>Produto</Label>
                        <Select 
                          onValueChange={(value) => setMovement({...movement, product_id: value})}
                          required
                        >
                          <SelectTrigger className="border-[#009EE3] focus:ring-2 focus:ring-[#009EE3]">
                            <SelectValue placeholder="Selecione um produto" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product._id} value={product._id}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Quantidade</Label>
                        <Input
                          type="number"
                          placeholder="Quantidade"
                          value={movement.quantity}
                          onChange={(e) => setMovement({...movement, quantity: parseInt(e.target.value)})}
                          required
                        />
                      </div>
                      {movementType === 'incoming' && (
                        <div>
                          <Label>Data de Vencimento</Label>
                          <Input
                            type="date"
                            value={movement.expiration_date}
                            onChange={(e) => setMovement({...movement, expiration_date: e.target.value})}
                            required
                          />
                        </div>
                      )}
                      <div>
                        <Label>Observações</Label>
                        <Input
                          placeholder="Observações (opcional)"
                          value={movement.observations}
                          onChange={(e) => setMovement({...movement, observations: e.target.value})}
                        />
                      </div>
                      <Button type="submit" className="w-full bg-[#009EE3] hover:bg-[#0080B7] text-white">
                        Salvar
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>

                <Button 
                  variant="outline" 
                  onClick={() => {
                    setMovementType('outgoing');
                    setIsAddingMovement(true);
                  }}
                  className="hover:bg-[#009EE3] hover:text-white"
                >
                  Saída
                </Button>

                <Button 
                  variant="outline" 
                  onClick={() => router.push(`/${tenant}/stock/history`)}
                  className="hover:bg-[#009EE3] hover:text-white"
                >
                  Meu Histórico
                </Button>
              </div>
            </div>

            <div className="mb-6">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrar produtos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="low">Estoque Baixo</SelectItem>
                  <SelectItem value="expiring">Vence em 30 dias</SelectItem>
                  <SelectItem value="expired">Produtos Vencidos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Lista de Produtos</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead>Estoque Mínimo</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Observações</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => {
                      const stockStatus = getStockStatus(product);
                      const expirationStatus = getExpirationStatus(product.expiration_date);
                      
                      return (
                        <TableRow 
                          key={product._id}
                          className="transition-all duration-300 hover:shadow-md"
                        >
                          <TableCell>
                            <div className="space-y-1">
                              <div>{product.name}</div>
                              <div className="flex flex-wrap gap-2">
                                {stockStatus?.badge}
                                {expirationStatus?.badge}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{product.code || 'N/A'}</TableCell>
                          <TableCell className={product.quantity <= product.minimum_stock ? 'text-[#ff9500] font-medium' : ''}>
                            {product.quantity}
                          </TableCell>
                          <TableCell>{product.unit}</TableCell>
                          <TableCell>{product.minimum_stock}</TableCell>
                          <TableCell>
                            {isValidDate(product.expiration_date)
                              ? format(new Date(product.expiration_date), 'dd/MM/yyyy')
                              : 'N/A'}
                          </TableCell>
                          <TableCell>{product.observations || 'N/A'}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleEditClick(product)}
                                className="text-[#009EE3] hover:text-[#009EE3] hover:bg-[#F5F5F5]"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDeleteClick(product)}
                                className="text-red-500 hover:text-red-500 hover:bg-[#F5F5F5]"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Editar Produto: {itemToEdit?.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="editCode">Código</Label>
                    <Input
                      id="editCode"
                      value={editedProduct.code}
                      onChange={(e) => setEditedProduct({...editedProduct, code: e.target.value})}
                      placeholder="Digite o código (opcional)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editUnit">
                      Unidade <span className="text-sm text-gray-500">(digite ou selecione)</span>
                    </Label>
                    <Select 
                      value={editedProduct.unit}
                      onValueChange={(value) => setEditedProduct({...editedProduct, unit: value})}
                    >
                      <SelectTrigger id="editUnit" className="border-[#009EE3] focus:ring-2 focus:ring-[#009EE3]">
                        <SelectValue placeholder="Digite ou selecione a unidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="px-3 py-2 text-sm text-gray-500">
                          Digite para filtrar ou selecione uma opção
                        </div>
                        {AVAILABLE_UNITS.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="editMinStock">Estoque Mínimo</Label>
                    <Input
                      id="editMinStock"
                      type="number"
                      value={editedProduct.minimum_stock}
                      onChange={(e) => setEditedProduct({...editedProduct, minimum_stock: parseInt(e.target.value)})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="editObservations">Observações</Label>
                    <Input
                      id="editObservations"
                      value={editedProduct.observations}
                      onChange={(e) => setEditedProduct({...editedProduct, observations: e.target.value})}
                      placeholder="Observações (opcional)"
                    />
                  </div>
                  <div className="flex justify-end gap-4">
                    <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleEditSubmit}
                      className="bg-[#009EE3] hover:bg-[#0080B7] text-white"
                    >
                      Salvar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirmar Exclusão</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p>Para confirmar a exclusão, digite o nome do produto: <strong>{itemToDelete?.name}</strong></p>
                  <Input
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder="Digite o nome do produto"
                  />
                  <div className="flex justify-end gap-4">
                    <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                      Cancelar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteConfirm}
                      disabled={deleteConfirmation !== itemToDelete?.name}
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