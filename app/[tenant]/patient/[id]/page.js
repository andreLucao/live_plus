'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Calendar, Clock, User, Heart, Pill, AlertTriangle, Edit, X, Check, Download, Upload, File, Trash2 } from 'lucide-react';
import Sidebar from "@/components/Sidebar";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

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
  const [documents, setDocuments] = useState([]);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [documentName, setDocumentName] = useState('');
  const [documentDescription, setDocumentDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [deletingDocumentId, setDeletingDocumentId] = useState(null);

  useEffect(() => {
    if (tenant && id) {
      fetchPatientDetails();
      fetchPatientDocuments();
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

  const fetchPatientDocuments = async () => {
    try {
      const response = await fetch(`/api/${tenant}/patients/${id}/documents`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch patient documents: ${response.statusText}`);
      }
      
      const data = await response.json();
      setDocuments(data);
    } catch (err) {
      console.error('Error fetching patient documents:', err);
      toast.error(`Failed to fetch documents: ${err.message}`);
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Use the file name as default document name if not set
      if (!documentName) {
        setDocumentName(file.name);
      }
    }
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }
    
    try {
      setUploadingDocument(true);
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('name', documentName || selectedFile.name);
      formData.append('description', documentDescription);
      
      const response = await fetch(`/api/${tenant}/patients/${id}/documents`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to upload document: ${response.statusText}`);
      }
      
      // Reset form
      setSelectedFile(null);
      setDocumentName('');
      setDocumentDescription('');
      setDocumentDialogOpen(false);
      
      // Refresh documents list
      await fetchPatientDocuments();
      
      toast.success('Document uploaded successfully');
    } catch (err) {
      console.error('Error uploading document:', err);
      toast.error(`Failed to upload document: ${err.message}`);
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleDownloadDocument = async (documentId, documentName) => {
    try {
      const response = await fetch(`/api/${tenant}/patients/${id}/documents/${documentId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to download document: ${response.statusText}`);
      }
      
      // Get the document blob
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = documentName;
      
      // Trigger the download
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("Document downloaded successfully");
    } catch (err) {
      console.error('Error downloading document:', err);
      toast.error(`Failed to download document: ${err.message}`);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    try {
      setDeletingDocumentId(documentId);
      
      const response = await fetch(`/api/${tenant}/patients/${id}/documents/${documentId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete document: ${response.statusText}`);
      }
      
      // Refresh documents list
      await fetchPatientDocuments();
      
      toast.success('Document deleted successfully');
    } catch (err) {
      console.error('Error deleting document:', err);
      toast.error(`Failed to delete document: ${err.message}`);
    } finally {
      setDeletingDocumentId(null);
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

  const renderDocuments = () => (
    <Card className="bg-white">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-medium">Patient Documents</CardTitle>
        <Dialog open={documentDialogOpen} onOpenChange={setDocumentDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Upload className="h-4 w-4 mr-1" /> Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUploadDocument} className="space-y-4">
              <div>
                <Label htmlFor="file">Select File</Label>
                <Input 
                  id="file" 
                  type="file" 
                  onChange={handleFileChange} 
                  required 
                />
              </div>
              <div>
                <Label htmlFor="documentName">Document Name</Label>
                <Input 
                  id="documentName" 
                  value={documentName} 
                  onChange={(e) => setDocumentName(e.target.value)} 
                  placeholder="Enter document name" 
                />
              </div>
              <div>
                <Label htmlFor="documentDescription">Description (Optional)</Label>
                <Textarea 
                  id="documentDescription" 
                  value={documentDescription} 
                  onChange={(e) => setDocumentDescription(e.target.value)} 
                  placeholder="Enter document description" 
                  rows={3} 
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDocumentDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={uploadingDocument || !selectedFile}
                >
                  {uploadingDocument ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </div>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-1" /> Upload
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {documents.length > 0 ? (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div key={doc._id} className="flex items-center justify-between p-2 border rounded hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <File className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="font-medium">{doc.name}</div>
                    {doc.description && <div className="text-sm text-gray-500">{doc.description}</div>}
                    <div className="text-xs text-gray-400">
                      {new Date(doc.uploadedAt).toLocaleDateString()} • {(doc.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDownloadDocument(doc._id, doc.name)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDeleteDocument(doc._id)}
                    disabled={deletingDocumentId === doc._id}
                  >
                    {deletingDocumentId === doc._id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                    ) : (
                      <Trash2 className="h-4 w-4 text-red-500" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No documents uploaded yet</p>
        )}
      </CardContent>
    </Card>
  );

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
                              Download PDF
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {renderDiagnoses()}
                  {renderDocuments()}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}