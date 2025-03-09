import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import mongoose from 'mongoose'

// GET handler para buscar glosas
export async function GET(request) {
  try {
    // Extract the tenant from the URL path
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const tenant = pathParts[2] // Assuming path is /api/[tenant]/glosas
    
    // Connect to the tenant's database
    const connection = await connectDB(tenant)
    
    // Use Mongoose's connection to access the native MongoDB collection
    const glosas = await connection.db.collection(`${tenant}_glosas`).find({}).toArray()
    
    return NextResponse.json(glosas)
  } catch (error) {
    console.error('Erro ao buscar glosas:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST handler para registrar nova glosa
export async function POST(request) {
  try {
    // Extract the tenant from the URL path
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const tenant = pathParts[2] // Assuming path is /api/[tenant]/glosas
    
    const data = await request.json()
    
    // Connect to the tenant's database
    const connection = await connectDB(tenant)
    
    // Preparar documento para inserção com valorRecuperado como número
    const novaGlosa = {
      ...data,
      valorRecuperado: parseFloat(data.valorRecuperado) || 0, // Converter para número
      createdAt: new Date(),
      tenant: tenant,
      // Converter o status para o formato adequado para o gráfico
      status: data.status === 'total' ? 'recuperado' : 'pendente'
    }
    
    // Inserir na coleção de glosas do tenant usando o driver nativo
    const result = await connection.db.collection(`${tenant}_glosas`).insertOne(novaGlosa)
    
    return NextResponse.json({ 
      success: true, 
      id: result.insertedId,
      message: 'Glosa registrada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao registrar glosa:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}