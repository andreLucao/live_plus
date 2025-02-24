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
  const { tenant } = useParams();

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
      title: 'Clinical History',
      icon: Heart,
      content: patient?.clinicalHistory || []
    },
    {
      title: 'Surgical History',
      icon: User,
      content: patient?.surgicalHistory || []
    },
    {
      title: 'Family History',
      icon: User,
      content: patient?.familyHistory || []
    },
    {
      title: 'Habits',
      icon: User,
      content: patient?.habits || []
    },
    {
      title: 'Allergies',
      icon: AlertTriangle,
      content: patient?.allergies || []
    },
    {
      title: 'Current Medications',
      icon: Pill,
      content: patient?.medications || []
    }
  ];

  const renderLoadingState = () => (
    <div className="flex justify-center items-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  const renderError = () => (
    <Alert variant="destructive">
      <AlertTitle>Error loading patient details</AlertTitle>
      {error}
    </Alert>
  );

  const renderPatientHeader = () => (
    <div className="flex items-start space-x-4 mb-6">
      <div className="bg-gray-400 rounded-full w-16 h-16 flex items-center justify-center text-white text-2xl">
        {patient?.email?.charAt(0).toUpperCase() || 'P'}
      </div>
      <div>
        <h1 className="text-xl font-medium">Patient Details</h1>
        <div className="text-gray-600">
          <p>Email: {patient?.email}</p>
          <p>Created: {patient?.createdAt && new Date(patient.createdAt).toLocaleDateString()}</p>
          <p>Last Login: {patient?.lastLoginAt && new Date(patient.lastLoginAt).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );

  const renderMedicalSections = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {sections.map(({ title, icon: Icon, content }) => (
        <Card key={title} className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center space-x-2">
              <Icon className="w-4 h-4" />
              <span>{title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-gray-600 text-sm">
              {content.length === 0 ? (
                <div>No information available</div>
              ) : (
                content.map((item, idx) => (
                  <div key={idx}>{item}</div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderDiagnoses = () => (
    <Card className="bg-white">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-medium">Latest Diagnoses</CardTitle>

      </CardHeader>
      <CardContent>
        {patient?.lastDiagnoses?.length > 0 ? (
          patient.lastDiagnoses.map((diagnosis, index) => (
            <div key={index} className="mb-4 last:mb-0">
              <div className="flex items-center mb-2">
                <div className="bg-blue-500 text-white rounded p-2 mr-4">
                  <div className="text-center">
                    <div className="text-sm">{new Date(diagnosis.date).getDate()}</div>
                    <div className="text-xs">{new Date(diagnosis.date).toLocaleString('default', { month: 'short' }).toUpperCase()}</div>
                    <div className="text-xs">{new Date(diagnosis.date).getFullYear()}</div>
                  </div>
                </div>
                <div>
                  <div className="font-medium">Diagnosis: {diagnosis.diagnosis}</div>
                  <div className="text-sm text-gray-500">{new Date(diagnosis.date).toLocaleTimeString()}</div>
                </div>
              </div>
              <div className="ml-16">
                <p className="text-gray-600">{diagnosis.notes}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No diagnoses recorded</p>
        )}
      </CardContent>
    </Card>
  );

  const renderContent = () => {
    if (loading) return renderLoadingState();
    if (error) return renderError();
    if (!patient) return <Alert><AlertTitle>Patient not found</AlertTitle></Alert>;

    return (
      <>
        {renderPatientHeader()}
        {renderMedicalSections()}
        {renderDiagnoses()}
      </>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100">
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