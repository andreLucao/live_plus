'use client';

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Plus, Search, Calendar, Clock, AlertCircle, Users, Mail, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";




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

  // Effect for loading patients
  useEffect(() => {
    fetchPatients();
  }, []);

  // Effect for dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

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
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
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

              <div className="flex items-center gap-4">
                <Switch checked={darkMode} onCheckedChange={setDarkMode} />
              </div>
            </div>

            {/* Error message */}
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
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
                      placeholder="Buscar por email..."
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
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                {patient.email}
                              </span>
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
    </div>
  );
}