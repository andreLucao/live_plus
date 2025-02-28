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

export default function PaginaPaciente() {
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
        throw new Error(`Falha ao buscar detalhes do paciente: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data || typeof data !== 'object') {
        throw new Error('Dados de paciente inválidos recebidos');
      }
      
      setPatient(data);
    } catch (err) {
      console.error('Erro ao buscar paciente:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientDocuments = async () => {
    try {
      const response = await fetch(`/api/${tenant}/patients/${id}/documents`);
      
      if (!response.ok) {
        throw new Error(`Falha ao buscar documentos do paciente: ${response.statusText}`);
      }
      
      const data = await response.json();
      setDocuments(data);
    } catch (err) {
      console.error('Erro ao buscar documentos do paciente:', err);
      toast.error(`Falha ao buscar documentos: ${err.message}`);
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
        throw new Error(`Falha ao atualizar paciente: ${response.statusText}`);
      }
      
      const updatedPatient = await response.json();
      setPatient(updatedPatient);
      setEditMode(false);
      toast.success("Informações do paciente atualizadas com sucesso");
    } catch (err) {
      console.error('Erro ao atualizar paciente:', err);
      toast.error(`Falha ao atualizar paciente: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      
      // Chama a API de geração de PDF
      const response = await fetch(`/api/${tenant}/patients/${id}/pdf`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`Falha ao gerar PDF: ${response.statusText}`);
      }
      
      // Obtém o blob do PDF
      const blob = await response.blob();
      
      // Cria um link de download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `paciente_${id}.pdf`;
      
      // Aciona o download
      document.body.appendChild(a);
      a.click();
      
      // Limpeza
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("PDF baixado com sucesso");
    } catch (err) {
      console.error('Erro ao baixar PDF:', err);
      toast.error(`Falha ao baixar PDF: ${err.message}`);
    } finally {
      setDownloading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Usa o nome do arquivo como nome padrão do documento se não estiver definido
      if (!documentName) {
        setDocumentName(file.name);
      }
    }
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast.error('Por favor, selecione um arquivo para upload');
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
        throw new Error(`Falha ao fazer upload do documento: ${response.statusText}`);
      }
      
      // Resetar formulário
      setSelectedFile(null);
      setDocumentName('');
      setDocumentDescription('');
      setDocumentDialogOpen(false);
      
      // Atualizar lista de documentos
      await fetchPatientDocuments();
      
      toast.success('Documento enviado com sucesso');
    } catch (err) {
      console.error('Erro ao fazer upload do documento:', err);
      toast.error(`Falha ao fazer upload do documento: ${err.message}`);
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleDownloadDocument = async (documentId, documentName) => {
    try {
      const response = await fetch(`/api/${tenant}/patients/${id}/documents/${documentId}`);
      
      if (!response.ok) {
        throw new Error(`Falha ao baixar documento: ${response.statusText}`);
      }
      
      // Obtém o blob do documento
      const blob = await response.blob();
      
      // Cria um link de download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = documentName;
      
      // Aciona o download
      document.body.appendChild(a);
      a.click();
      
      // Limpeza
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("Documento baixado com sucesso");
    } catch (err) {
      console.error('Erro ao baixar documento:', err);
      toast.error(`Falha ao baixar documento: ${err.message}`);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    try {
      setDeletingDocumentId(documentId);
      
      const response = await fetch(`/api/${tenant}/patients/${id}/documents/${documentId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Falha ao excluir documento: ${response.statusText}`);
      }
      
      // Atualizar lista de documentos
      await fetchPatientDocuments();
      
      toast.success('Documento excluído com sucesso');
    } catch (err) {
      console.error('Erro ao excluir documento:', err);
      toast.error(`Falha ao excluir documento: ${err.message}`);
    } finally {
      setDeletingDocumentId(null);
    }
  };

  // Função auxiliar para lidar com conteúdo de string e array
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
      title: 'Histórico Clínico',
      icon: Heart,
      field: 'clinicalHistory',
      content: formatContent(patient?.medicalDetails?.clinicalHistory)
    },
    {
      title: 'Histórico Cirúrgico',
      icon: User,
      field: 'surgicalHistory',
      content: formatContent(patient?.medicalDetails?.surgicalHistory)
    },
    {
      title: 'Histórico Familiar',
      icon: User,
      field: 'familyHistory',
      content: formatContent(patient?.medicalDetails?.familyHistory)
    },
    {
      title: 'Hábitos',
      icon: User,
      field: 'habits',
      content: formatContent(patient?.medicalDetails?.habits)
    },
    {
      title: 'Alergias',
      icon: AlertTriangle,
      field: 'allergies',
      content: formatContent(patient?.medicalDetails?.allergies)
    },
    {
      title: 'Medicamentos Atuais',
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
      <AlertTitle>Erro ao carregar detalhes do paciente</AlertTitle>
      <p className="mt-2 text-sm">{error}</p>
    </Alert>
  );

  const renderMedicalSections = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {sections.map(({ title, icon: Icon, field, content }) => (
        <Card key={title} className="bg-white dark:bg-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center space-x-2">
              <Icon className="w-4 h-4 text-[#009EE3]" />
              <span>{title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {editMode ? (
              <Textarea
                value={formData[field]}
                onChange={(e) => handleInputChange(field, e.target.value)}
                placeholder={`Digite ${title.toLowerCase()}`}
                className="w-full"
              />
            ) : (
              <div className="text-gray-600 dark:text-gray-400 text-sm">
                {content.length > 0 ? (
                  content.map((item, idx) => (
                    <div key={idx} className="mb-1 last:mb-0">
                      {item}
                    </div>
                  ))
                ) : (
                  <div>Nenhuma informação disponível</div>
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
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-base font-medium">Últimos Diagnósticos</CardTitle>
        </CardHeader>
        <CardContent>
          {editMode ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Data</label>
                <Input
                  type="date"
                  value={formData.lastDiagnosis.date}
                  onChange={(e) => handleDiagnosisChange('date', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Diagnóstico</label>
                <Input
                  value={formData.lastDiagnosis.diagnosis}
                  onChange={(e) => handleDiagnosisChange('diagnosis', e.target.value)}
                  placeholder="Digite o diagnóstico"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Observações</label>
                <Textarea
                  value={formData.lastDiagnosis.notes}
                  onChange={(e) => handleDiagnosisChange('notes', e.target.value)}
                  placeholder="Digite observações"
                  rows={4}
                />
              </div>
            </div>
          ) : (
            diagnoses.length > 0 ? (
              diagnoses.map((diagnosis, index) => (
                <div key={index} className="mb-4 last:mb-0">
                  <div className="flex items-center mb-2">
                    <div className="bg-[#009EE3] text-white rounded p-2 mr-4">
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
                      <div className="font-medium dark:text-gray-200">
                        {diagnosis.diagnosis || 'Sem título de diagnóstico'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(diagnosis.date).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  {diagnosis.notes && (
                    <div className="ml-16">
                      <p className="text-gray-600 dark:text-gray-400">{diagnosis.notes}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">Nenhum diagnóstico registrado</p>
            )
          )}
        </CardContent>
      </Card>
    );
  };

  const renderDocuments = () => (
    <Card className="bg-white dark:bg-gray-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-medium">Documentos do Paciente</CardTitle>
        <Dialog open={documentDialogOpen} onOpenChange={setDocumentDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-[#009EE3] hover:bg-[#0080B7] text-white">
              <Upload className="h-4 w-4 mr-1" /> Enviar Documento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enviar Documento</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUploadDocument} className="space-y-4">
              <div>
                <Label htmlFor="file">Selecionar Arquivo</Label>
                <Input 
                  id="file" 
                  type="file" 
                  onChange={handleFileChange} 
                  required 
                />
              </div>
              <div>
                <Label htmlFor="documentName">Nome do Documento</Label>
                <Input 
                  id="documentName" 
                  value={documentName} 
                  onChange={(e) => setDocumentName(e.target.value)} 
                  placeholder="Digite o nome do documento" 
                />
              </div>
              <div>
                <Label htmlFor="documentDescription">Descrição (Opcional)</Label>
                <Textarea 
                  id="documentDescription" 
                  value={documentDescription} 
                  onChange={(e) => setDocumentDescription(e.target.value)} 
                  placeholder="Digite a descrição do documento" 
                  rows={3} 
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDocumentDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={uploadingDocument || !selectedFile}
                  className="bg-[#009EE3] hover:bg-[#0080B7] text-white"
                >
                  {uploadingDocument ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Enviando...
                    </div>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-1" /> Enviar
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
              <div key={doc._id} className="flex items-center justify-between p-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <File className="h-5 w-5 text-[#009EE3]" />
                  <div>
                    <div className="font-medium dark:text-gray-200">{doc.name}</div>
                    {doc.description && <div className="text-sm text-gray-500 dark:text-gray-400">{doc.description}</div>}
                    <div className="text-xs text-gray-400 dark:text-gray-500">
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
                    <Download className="h-4 w-4 text-[#009EE3]" />
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
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">Nenhum documento enviado ainda</p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <Toaster />
      <main className="flex-1 overflow-y-auto">
        <div className="space-y-6 p-6">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              renderLoadingState()
            ) : error ? (
              renderError()
            ) : !patient ? (
              <Alert><AlertTitle>Paciente não encontrado</AlertTitle></Alert>
            ) : (
              <>
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-start space-x-4">
                    <div className="bg-[#009EE3] rounded-full w-16 h-16 flex items-center justify-center text-white text-2xl">
                      {patient?.email?.charAt(0).toUpperCase() || 'P'}
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detalhes do Paciente</h1>
                      <div className="text-gray-600 dark:text-gray-300">
                        <p>Email: {patient?.email || 'N/A'}</p>
                        <p>Criado: {patient?.createdAt ? new Date(patient.createdAt).toLocaleDateString() : 'N/A'}</p>
                        <p>Último Login: {patient?.lastLoginAt ? new Date(patient.lastLoginAt).toLocaleDateString() : 'N/A'}</p>
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
                          <X className="h-4 w-4 mr-1" /> Cancelar
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={handleSave}
                          disabled={saving}
                          className="bg-[#009EE3] hover:bg-[#0080B7] text-white"
                        >
                          {saving ? (
                            <div className="flex items-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Salvando...
                            </div>
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-1" /> Salvar
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
                          <Edit className="h-4 w-4 mr-1" /> Editar
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
                              Baixar PDF
                            </div>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-1" /> Baixar PDF
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