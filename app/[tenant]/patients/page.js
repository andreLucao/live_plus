'use client';

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, Search, Calendar, Clock, AlertCircle, Users, Mail, Filter, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";




export default function PatientsPage() {
  // States for patients and UI controls
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const { tenant } = useParams();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  
  // Estados para o modal de novo paciente
  const [showNewPatientDialog, setShowNewPatientDialog] = useState(false);
  const [newPatientEmail, setNewPatientEmail] = useState("");
  const [newPatientCellphone, setNewPatientCellphone] = useState("");
  const [newPatientCPF, setNewPatientCPF] = useState("");
  const [isCreatingPatient, setIsCreatingPatient] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Effect for loading user and patients
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      // Redirect users with role 'user' to the appointments page
      if (currentUser.role === 'user') {
        router.push(`/${tenant}/appointments`);
        return;
      }
      
      fetchPatients();
    }
  }, [currentUser, router, tenant]);

  // Effect for dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Function to fetch current user
  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/user');
      if (!response.ok) throw new Error('Failed to fetch user');
      const userData = await response.json();
      console.log('Current user:', userData);
      setCurrentUser(userData);
    } catch (error) {
      console.error('Error fetching current user:', error);
      setError("Falha ao carregar informações do usuário");
    }
  };

  // Function to fetch patients
  const fetchPatients = async () => {
    try {
      const response = await fetch(`/api/${tenant}/patients`);
      if (!response.ok) throw new Error('Failed to fetch patients');
      const data = await response.json();
      setPatients(data);
      setError("");
    } catch (err) {
      console.error('Error fetching patients:', err);
      setError("Falha ao carregar os pacientes. Por favor, tente novamente mais tarde.");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to create a new patient using the existing users API
  const createNewPatient = async () => {
    if (!newPatientEmail) {
      setError("O email do paciente é obrigatório");
      return;
    }
    
    setIsCreatingPatient(true);
    setError("");
    
    try {
      // Usando o endpoint existente de usuários
      const tempId = "new"; // ID especial para indicar criação
      
      const response = await fetch(`/api/${tenant}/users/${tempId}`, {
        method: 'PUT', // Usando PUT conforme a API existente
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newPatientEmail,
          cellphone: newPatientCellphone || undefined, // Only send if not empty
          cpf: newPatientCPF || undefined, // Only send if not empty
          role: 'user', // Garantindo que o papel será 'user'
          status: 'Active',
          tenantPath: tenant // Enviando o tenant atual como tenantPath
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao criar paciente');
      }
      
      const data = await response.json();
      
      // Feedback de sucesso
      setSuccessMessage("Paciente criado com sucesso!");
      setNewPatientEmail("");
      setNewPatientCellphone("");
      setNewPatientCPF("");
      
      // Atualiza a lista de pacientes
      fetchPatients();
      
      // Fecha o modal após 2 segundos
      setTimeout(() => {
        setShowNewPatientDialog(false);
        setSuccessMessage("");
      }, 2000);
      
    } catch (err) {
      console.error('Error creating patient:', err);
      setError(err.message || "Falha ao criar paciente. Verifique se o email é válido e não existe no sistema.");
    } finally {
      setIsCreatingPatient(false);
    }
  };

  // Function to filter data by date range
  const filterByDateRange = (data) => {
    if (!startDate && !endDate) return data;
    
    return data.filter(patient => {
      const patientDate = new Date(patient.createdAt);
      const start = startDate ? new Date(startDate) : new Date(0);
      const end = endDate ? new Date(endDate) : new Date();
      end.setHours(23, 59, 59, 999);
      
      return patientDate >= start && patientDate <= end;
    });
  };

  // Filter patients based on search term and date range
  const filteredPatients = filterByDateRange(patients).filter(patient => 
    patient.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (patient.cellphone && patient.cellphone.includes(searchTerm))
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </main>
      </div>
    );
  }

  // If user role is 'user', don't render the page (they should be redirected)
  if (currentUser && currentUser.role === 'user') {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="flex justify-center items-center h-full">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
              <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="h-full p-6">
          <div className="h-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Users size={20} />
                  Gestão de Pacientes
                </h1>
                <span className="text-lg text-gray-600 dark:text-gray-400 mt-2">
                  Total de Pacientes: {filteredPatients.length}
                </span>
              </div>

              {/* Botão Novo Paciente */}
              <Button 
                onClick={() => setShowNewPatientDialog(true)}
                className="bg-[#009EE3] hover:bg-[#0289C4]"
              >
                <Plus className="mr-1 h-4 w-4" /> Novo Paciente
              </Button>
            </div>

            {/* Error message */}
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Success message (mostra fora do modal também) */}
            {successMessage && (
              <Alert className="mb-4 bg-green-50 border-green-200 text-green-800 dark:bg-green-900 dark:border-green-800 dark:text-green-100">
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}

            {/* Filters */}
            <div className="flex flex-col md:flex-row justify-end items-start md:items-center gap-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4 items-end w-full">
                <div className="flex flex-col gap-2 flex-1">
                  <Label htmlFor="search">
                    Buscar Pacientes
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="search"
                      placeholder="Buscar por email ou celular..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="start-date">
                    Data Inicial
                  </Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full md:w-40"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="end-date">
                    Data Final
                  </Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full md:w-40"
                  />
                </div>
              </div>
            </div>

            {/* Patients List */}
            <Card className="h-[calc(100vh-230px)]">
              <CardHeader>
                <CardTitle>Lista de Pacientes</CardTitle>
              </CardHeader>
              <CardContent className="h-[calc(100%-5rem)] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-4 auto-rows-fr">
                  {filteredPatients.map(patient => (
                    <Link key={patient._id} href={`/${tenant}/patient/${patient._id}`}>
                      <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-white dark:bg-gray-800 h-full">
                        <CardContent className="pt-6 h-full">
                          <div className="space-y-4">
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {patient.email}
                                </span>
                              </div>
                              {patient.cellphone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                  <span className="text-gray-700 dark:text-gray-300 truncate">
                                    {patient.cellphone}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col gap-2">
                              <Badge variant="secondary" className="w-fit flex items-center gap-1 bg-[#eaf5fd] text-[#009EE3] dark:bg-blue-900 dark:text-blue-100">
                                <Calendar className="h-3 w-3" />
                                Criado em: {new Date(patient.createdAt).toLocaleDateString('pt-BR')}
                              </Badge>
                              {patient.lastLoginAt && (
                                <Badge variant="secondary" className="w-fit flex items-center gap-1 bg-[#eaf5fd] text-[#009EE3] dark:bg-blue-900 dark:text-blue-100">
                                  <Clock className="h-3 w-3" />
                                  Último login: {new Date(patient.lastLoginAt).toLocaleDateString('pt-BR')}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>

                {filteredPatients.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Nenhum paciente encontrado
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Modal para criar novo paciente */}
      <Dialog open={showNewPatientDialog} onOpenChange={setShowNewPatientDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Paciente</DialogTitle>
            <DialogDescription>
              Insira as informações do paciente para criar uma nova conta.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Campo de email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-right">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="email@exemplo.com"
                value={newPatientEmail}
                onChange={(e) => setNewPatientEmail(e.target.value)}
                disabled={isCreatingPatient}
              />
            </div>
            
            {/* Campo de celular */}
            <div className="space-y-2">
              <Label htmlFor="cellphone" className="text-right">
                Celular
              </Label>
              <Input
                id="cellphone"
                type="tel"
                placeholder="(00) 00000-0000"
                value={newPatientCellphone}
                onChange={(e) => setNewPatientCellphone(e.target.value)}
                disabled={isCreatingPatient}
              />
            </div>
            
            {/* Campo de CPF */}
            <div className="space-y-2">
              <Label htmlFor="cpf" className="text-right">
                CPF
              </Label>
              <Input
                id="cpf"
                type="text"
                placeholder="000.000.000-00"
                value={newPatientCPF}
                onChange={(e) => setNewPatientCPF(e.target.value)}
                disabled={isCreatingPatient}
              />
            </div>
            
            {/* Mensagem de erro */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {/* Mensagem de sucesso */}
            {successMessage && (
              <Alert className="bg-green-50 border-green-200 text-green-800 dark:bg-green-900 dark:border-green-800 dark:text-green-100">
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewPatientDialog(false)}
              disabled={isCreatingPatient}
            >
              Cancelar
            </Button>
            <Button 
              onClick={createNewPatient}
              disabled={isCreatingPatient || !newPatientEmail}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
            >
              {isCreatingPatient ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Criando...
                </>
              ) : "Criar Paciente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}