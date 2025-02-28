'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Calendar, Clock, User, Heart, Pill, AlertTriangle, Edit, X, Check, Download } from 'lucide-react';
import Sidebar from "@/components/Sidebar";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

export default function PatientPage() {
  const { tenant, id } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    clinicalHistory: '',
    surgicalHistory: '',
    familyHistory: '',
    habits: '',
    allergies: '',
    medications: '',
    lastDiagnosis: {
      date: new Date().toISOString().split('T')[0],
      diagnosis: '',
      notes: ''
    }
  });
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (tenant && id) {
      fetchPatientDetails();
    }
  }, [tenant, id]);

  useEffect(() => {
    if (patient?.medicalDetails) {
      setFormData({
        clinicalHistory: patient.medicalDetails.clinicalHistory || '',
        surgicalHistory: patient.medicalDetails.surgicalHistory || '',
        familyHistory: patient.medicalDetails.familyHistory || '',
        habits: patient.medicalDetails.habits || '',
        allergies: patient.medicalDetails.allergies || '',
        medications: patient.medicalDetails.medications || '',
        lastDiagnosis: {
          date: patient.medicalDetails.lastDiagnosis?.date 
            ? new Date(patient.medicalDetails.lastDiagnosis.date).toISOString().split('T')[0] 
            : new Date().toISOString().split('T')[0],
          diagnosis: patient.medicalDetails.lastDiagnosis?.diagnosis || '',
          notes: patient.medicalDetails.lastDiagnosis?.notes || ''
        }
      });
    }
  }, [patient]);

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

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDiagnosisChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      lastDiagnosis: {
        ...prev.lastDiagnosis,
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch(`/api/${tenant}/patients/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update patient: ${response.statusText}`);
      }
      
      const updatedPatient = await response.json();
      setPatient(updatedPatient);
      setEditMode(false);
      toast.success("Patient information updated successfully");
    } catch (err) {
      console.error('Error updating patient:', err);
      toast.error(`Failed to update patient: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      
      // Call the PDF generation API
      const response = await fetch(`/api/${tenant}/patients/${id}/pdf`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate PDF: ${response.statusText}`);
      }
      
      // Get the PDF blob
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `patient_${id}.pdf`;
      
      // Trigger the download
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("PDF downloaded successfully");
    } catch (err) {
      console.error('Error downloading PDF:', err);
      toast.error(`Failed to download PDF: ${err.message}`);
    } finally {
      setDownloading(false);
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
      field: 'clinicalHistory',
      content: formatContent(patient?.medicalDetails?.clinicalHistory)
    },
    {
      title: 'Surgical History',
      icon: User,
      field: 'surgicalHistory',
      content: formatContent(patient?.medicalDetails?.surgicalHistory)
    },
    {
      title: 'Family History',
      icon: User,
      field: 'familyHistory',
      content: formatContent(patient?.medicalDetails?.familyHistory)
    },
    {
      title: 'Habits',
      icon: User,
      field: 'habits',
      content: formatContent(patient?.medicalDetails?.habits)
    },
    {
      title: 'Allergies',
      icon: AlertTriangle,
      field: 'allergies',
      content: formatContent(patient?.medicalDetails?.allergies)
    },
    {
      title: 'Current Medications',
      icon: Pill,
      field: 'medications',
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

  const renderMedicalSections = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {sections.map(({ title, icon: Icon, field, content }) => (
        <Card key={title} className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center space-x-2">
              <Icon className="w-4 h-4" />
              <span>{title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {editMode ? (
              <Textarea
                value={formData[field]}
                onChange={(e) => handleInputChange(field, e.target.value)}
                placeholder={`Enter ${title.toLowerCase()}`}
                className="w-full"
              />
            ) : (
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
            )}
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
          {editMode ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <Input
                  type="date"
                  value={formData.lastDiagnosis.date}
                  onChange={(e) => handleDiagnosisChange('date', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Diagnosis</label>
                <Input
                  value={formData.lastDiagnosis.diagnosis}
                  onChange={(e) => handleDiagnosisChange('diagnosis', e.target.value)}
                  placeholder="Enter diagnosis"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <Textarea
                  value={formData.lastDiagnosis.notes}
                  onChange={(e) => handleDiagnosisChange('notes', e.target.value)}
                  placeholder="Enter notes"
                  rows={4}
                />
              </div>
            </div>
          ) : (
            diagnoses.length > 0 ? (
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
            )
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <Toaster />
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
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-start space-x-4">
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
                  <div className="flex space-x-2">
                    {editMode ? (
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setEditMode(false)}
                          disabled={saving}
                        >
                          <X className="h-4 w-4 mr-1" /> Cancel
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={handleSave}
                          disabled={saving}
                        >
                          {saving ? (
                            <div className="flex items-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Saving...
                            </div>
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-1" /> Save
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setEditMode(true)}
                        >
                          <Edit className="h-4 w-4 mr-1" /> Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleDownloadPDF}
                          disabled={downloading}
                        >
                          {downloading ? (
                            <div className="flex items-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                              Downloading...
                            </div>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-1" /> Download PDF
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
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