'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Calendar, Clock, User, Heart, Pill, AlertTriangle } from 'lucide-react';
import Sidebar from "@/components/Sidebar";

export default function PatientPage({ params }) {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { tenant } = useParams()

  useEffect(() => {
    fetchPatientDetails();
  }, []);

  const fetchPatientDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/${tenant}/patients/${params.id}`);
      if (!response.ok) throw new Error('Failed to fetch patient details');
      const data = await response.json();
      setPatient(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    {
      title: 'Antecedentes Clínicos',
      icon: Heart,
      content: patient?.clinicalHistory || []
    },
    {
      title: 'Antecedentes Cirúrgicos',
      icon: User,
      content: patient?.surgicalHistory || []
    },
    {
      title: 'Antecedentes Familiares',
      icon: User,
      content: patient?.familyHistory || []
    },
    {
      title: 'Hábitos',
      icon: User,
      content: patient?.habits || []
    },
    {
      title: 'Alergias',
      icon: AlertTriangle,
      content: patient?.allergies || []
    },
    {
      title: 'Medicamentos em Uso',
      icon: Pill,
      content: patient?.medications || []
    }
  ];

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertTitle>Erro ao carregar detalhes do paciente</AlertTitle>
          {error}
        </Alert>
      );
    }

    if (!patient) {
      return (
        <Alert variant="destructive">
          <AlertTitle>Paciente não encontrado</AlertTitle>
          O paciente solicitado não foi encontrado.
        </Alert>
      );
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Paciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="font-medium">Email:</span>
                <span>{patient.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="font-medium">Criado em:</span>
                <span>{new Date(patient.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="font-medium">Último login:</span>
                <span>{new Date(patient.lastLoginAt).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sections.map(({ title, icon: Icon, content }) => (
            <Card key={title}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Icon className="w-5 h-5" />
                  <span>{title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {content.length === 0 ? (
                  <p className="text-gray-500">Nenhum registro encontrado</p>
                ) : (
                  <ul className="list-disc list-inside space-y-2">
                    {content.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Últimos Diagnósticos</CardTitle>
            </CardHeader>
            <CardContent>
              {patient.lastDiagnoses?.length > 0 ? (
                <div className="space-y-4">
                  {patient.lastDiagnoses.map((diagnosis, index) => (
                    <div key={index} className="border-b pb-4 last:border-b-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{diagnosis.diagnosis}</h4>
                          <p className="text-gray-600">{diagnosis.notes}</p>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(diagnosis.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Nenhum diagnóstico registrado</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6">
          <div className="max-w-6xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}