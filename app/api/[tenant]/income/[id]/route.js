// app/api/[tenant]/income/[id]/route.js

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getIncomeModel } from '@/lib/models/Income';

// Endpoint para excluir uma receita
export async function DELETE(request, { params }) {
  try {
    const { id, tenant } = params;

    // Conectar ao banco de dados específico do tenant
    const connection = await connectDB(tenant);
    const Income = getIncomeModel(connection);

    // Excluir a receita pelo ID
    const result = await Income.findByIdAndDelete(id);
    
    if (!result) {
      return NextResponse.json(
        { error: 'Receita não encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      message: 'Receita excluída com sucesso',
      deletedId: id
    });
  } catch (error) {
    console.error('Erro ao excluir receita:', error);
    return NextResponse.json(
      { error: 'Falha ao excluir o registro de receita' }, 
      { status: 500 }
    );
  }
}

// Novo endpoint para atualizar o valor conciliado
export async function PATCH(request, { params }) {
  try {
    const { id, tenant } = params;
    const body = await request.json();
    const { valorConciliado, statusConciliacao } = body;

    if (valorConciliado === undefined) {
      return NextResponse.json(
        { error: 'O valor conciliado é obrigatório' },
        { status: 400 }
      );
    }

    // Conectar ao banco de dados específico do tenant
    const connection = await connectDB(tenant);
    const Income = getIncomeModel(connection);

    // Buscar a receita atual para verificar se existe
    const existingIncome = await Income.findById(id);
    if (!existingIncome) {
      return NextResponse.json(
        { error: 'Receita não encontrada' },
        { status: 404 }
      );
    }

    // Preparar os campos a serem atualizados
    const updateFields = {
      valorConciliado: valorConciliado
    };

    // Adicionar status de conciliação se fornecido
    if (statusConciliacao) {
      updateFields.statusConciliacao = statusConciliacao;
    } else {
      // Calcular automaticamente o status se não fornecido
      // Lógica: Comparar o valor original com o valor conciliado
      const originalAmount = existingIncome.amount;
      const paymentType = existingIncome.paymentType;

      if (valorConciliado === 0) {
        updateFields.statusConciliacao = 'Não conciliado';
      } else if (valorConciliado === originalAmount) {
        updateFields.statusConciliacao = 'Conciliado';
      } else if (paymentType === 'PJ' && valorConciliado < originalAmount) {
        updateFields.statusConciliacao = 'Pendente: PJ maior';
      } else if (paymentType === 'PF' && valorConciliado < originalAmount) {
        updateFields.statusConciliacao = 'Pendente: PF maior';
      } else {
        updateFields.statusConciliacao = 'Não conciliado';
      }
    }

    // Atualizar o documento
    const updatedIncome = await Income.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true } // Retorna o documento atualizado
    );

    return NextResponse.json({
      message: 'Valor conciliado atualizado com sucesso',
      income: updatedIncome
    });
  } catch (error) {
    console.error('Erro ao atualizar valor conciliado:', error);
    return NextResponse.json(
      { error: 'Falha ao atualizar o valor conciliado' }, 
      { status: 500 }
    );
  }
}

// Endpoint para obter uma receita específica
export async function GET(request, { params }) {
  try {
    const { id, tenant } = params;

    // Conectar ao banco de dados específico do tenant
    const connection = await connectDB(tenant);
    const Income = getIncomeModel(connection);

    // Buscar a receita pelo ID
    const income = await Income.findById(id);
    
    if (!income) {
      return NextResponse.json(
        { error: 'Receita não encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(income);
  } catch (error) {
    console.error('Erro ao buscar receita:', error);
    return NextResponse.json(
      { error: 'Falha ao buscar o registro de receita' }, 
      { status: 500 }
    );
  }
}