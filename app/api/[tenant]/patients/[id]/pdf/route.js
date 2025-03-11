import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getUserModel } from '@/lib/models/User';
import { jsPDF } from 'jspdf';

export async function POST(request, { params }) {
  try {
    const id = await params;
    const tenant = id.tenant;
    const userId = id.id;

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant é obrigatório' }, { status: 400 });
    }

    // Conectar ao banco de dados específico do tenant
    const connection = await connectDB(tenant);
    const User = getUserModel(connection);

    // Encontrar usuário com caminho específico do tenant e role='user'
    const user = await User.findOne({
      _id: userId,
      tenantPath: tenant,
      role: 'user'
    }).select('-password');

    if (!user) {
      return NextResponse.json(
        { error: 'Paciente não encontrado' },
        { status: 404 }
      );
    }

    // Criar um documento PDF
    const doc = new jsPDF();
    
    // Função auxiliar para adicionar texto com quebras de linha
    const addWrappedText = (text, x, y, maxWidth) => {
      const lines = doc.splitTextToSize(text || 'Nenhuma informação disponível', maxWidth);
      doc.text(lines, x, y);
      return y + (lines.length * 7); // Retorna a nova posição Y
    };
    
    // Adicionar conteúdo ao PDF
    let yPos = 20;
    
    // Título
    doc.setFontSize(20);
    doc.text('Registro Médico do Paciente', 105, yPos, { align: 'center' });
    yPos += 15;
    
    // Informações do paciente
    doc.setFontSize(16);
    doc.text('Informações do Paciente', 20, yPos);
    yPos += 10;
    
    doc.setFontSize(12);
    doc.text(`Email: ${user.email || 'N/A'}`, 20, yPos);
    yPos += 7;
    doc.text(`Criado em: ${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}`, 20, yPos);
    yPos += 7;
    doc.text(`Último login: ${user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'N/A'}`, 20, yPos);
    yPos += 15;
    
    // Detalhes médicos
    const medicalDetails = user.medicalDetails || {};
    
    // Histórico Clínico
    doc.setFontSize(16);
    doc.text('Histórico Clínico', 20, yPos);
    yPos += 10;
    doc.setFontSize(12);
    yPos = addWrappedText(medicalDetails.clinicalHistory, 20, yPos, 170);
    yPos += 10;
    
    // Histórico Cirúrgico
    doc.setFontSize(16);
    doc.text('Histórico Cirúrgico', 20, yPos);
    yPos += 10;
    doc.setFontSize(12);
    yPos = addWrappedText(medicalDetails.surgicalHistory, 20, yPos, 170);
    yPos += 10;
    
    // Adicionar uma nova página se estiver ficando sem espaço
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    // Histórico Familiar
    doc.setFontSize(16);
    doc.text('Histórico Familiar', 20, yPos);
    yPos += 10;
    doc.setFontSize(12);
    yPos = addWrappedText(medicalDetails.familyHistory, 20, yPos, 170);
    yPos += 10;
    
    // Hábitos
    doc.setFontSize(16);
    doc.text('Hábitos', 20, yPos);
    yPos += 10;
    doc.setFontSize(12);
    yPos = addWrappedText(medicalDetails.habits, 20, yPos, 170);
    yPos += 10;
    
    // Adicionar uma nova página se estiver ficando sem espaço
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    // Alergias
    doc.setFontSize(16);
    doc.text('Alergias', 20, yPos);
    yPos += 10;
    doc.setFontSize(12);
    yPos = addWrappedText(medicalDetails.allergies, 20, yPos, 170);
    yPos += 10;
    
    // Medicamentos
    doc.setFontSize(16);
    doc.text('Medicamentos Atuais', 20, yPos);
    yPos += 10;
    doc.setFontSize(12);
    yPos = addWrappedText(medicalDetails.medications, 20, yPos, 170);
    yPos += 10;
    
    // Adicionar uma nova página se estiver ficando sem espaço
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    // Último Diagnóstico
    if (medicalDetails.lastDiagnosis) {
      doc.setFontSize(16);
      doc.text('Último Diagnóstico', 20, yPos);
      yPos += 10;
      doc.setFontSize(12);
      doc.text(`Data: ${new Date(medicalDetails.lastDiagnosis.date).toLocaleDateString()}`, 20, yPos);
      yPos += 7;
      doc.text(`Diagnóstico: ${medicalDetails.lastDiagnosis.diagnosis || 'Nenhum título de diagnóstico'}`, 20, yPos);
      yPos += 7;
      yPos = addWrappedText(`Observações: ${medicalDetails.lastDiagnosis.notes || 'Nenhuma observação disponível'}`, 20, yPos, 170);
    }
    
    // Obter o PDF como um buffer
    const pdfOutput = doc.output('arraybuffer');
    
    return new NextResponse(Buffer.from(pdfOutput), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="paciente_${userId}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    return NextResponse.json(
      { error: `Falha ao gerar PDF: ${error.message}` },
      { status: 500 }
    );
  }
}