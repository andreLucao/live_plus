'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Calendar, Clock, User, Heart, Pill, AlertTriangle } from 'lucide-react';
import Sidebar from "@/components/Sidebar";

export default function PatientPage() {
  const { tenant, id } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (tenant && id) {
      fetchPatientDetails();
    }
  }, [tenant, id]);

  const fetchPatientDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/${tenant}/patients/${id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch patient details: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid patient data received');
      }
      
      setPatient(data);
    } catch (err) {
      console.error('Error fetching patient:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to handle both string and array content
  const formatContent = (content) => {
    if (Array.isArray(content)) {
      return content;
    }
    if (typeof content === 'string' && content.trim()) {
      return [content];
    }
    return [];
  };

  const sections = [
    {
      title: 'Clinical History',
      icon: Heart,
      content: formatContent(patient?.medicalDetails?.clinicalHistory)
    },
    {
      title: 'Surgical History',
      icon: User,
      content: formatContent(patient?.medicalDetails?.surgicalHistory)
    },
    {
      title: 'Family History',
      icon: User,
      content: formatContent(patient?.medicalDetails?.familyHistory)
    },
    {
      title: 'Habits',
      icon: User,
      content: formatContent(patient?.medicalDetails?.habits)
    },
    {
      title: 'Allergies',
      icon: AlertTriangle,
      content: formatContent(patient?.medicalDetails?.allergies)
    },
    {
      title: 'Current Medications',
      icon: Pill,
      content: formatContent(patient?.medicalDetails?.medications)
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
      <p className="mt-2 text-sm">{error}</p>
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
          <p>Email: {patient?.email || 'N/A'}</p>
          <p>Created: {patient?.createdAt ? new Date(patient.createdAt).toLocaleDateString() : 'N/A'}</p>
          <p>Last Login: {patient?.lastLoginAt ? new Date(patient.lastLoginAt).toLocaleDateString() : 'N/A'}</p>
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
              {content.length > 0 ? (
                content.map((item, idx) => (
                  <div key={idx} className="mb-1 last:mb-0">
                    {item}
                  </div>
                ))
              ) : (
                <div>No information available</div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderDiagnoses = () => {
    const diagnoses = patient?.medicalDetails?.lastDiagnosis ? [patient.medicalDetails.lastDiagnosis] : [];
    
    return (
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-base font-medium">Latest Diagnoses</CardTitle>
        </CardHeader>
        <CardContent>
          {diagnoses.length > 0 ? (
            diagnoses.map((diagnosis, index) => (
              <div key={index} className="mb-4 last:mb-0">
                <div className="flex items-center mb-2">
                  <div className="bg-blue-500 text-white rounded p-2 mr-4">
                    <div className="text-center">
                      <div className="text-sm">
                        {new Date(diagnosis.date).getDate()}
                      </div>
                      <div className="text-xs">
                        {new Date(diagnosis.date).toLocaleString('default', { month: 'short' }).toUpperCase()}
                      </div>
                      <div className="text-xs">
                        {new Date(diagnosis.date).getFullYear()}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">
                      {diagnosis.diagnosis || 'No diagnosis title'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(diagnosis.date).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                {diagnosis.notes && (
                  <div className="ml-16">
                    <p className="text-gray-600">{diagnosis.notes}</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500">No diagnoses recorded</p>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6">
          <div className="max-w-6xl mx-auto">
            {loading ? (
              renderLoadingState()
            ) : error ? (
              renderError()
            ) : !patient ? (
              <Alert><AlertTitle>Patient not found</AlertTitle></Alert>
            ) : (
              <>
                {renderPatientHeader()}
                {renderMedicalSections()}
                {renderDiagnoses()}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}