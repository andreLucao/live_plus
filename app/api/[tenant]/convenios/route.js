import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import mongoose from 'mongoose'

export async function GET(request) {
  try {
    // Extract the tenant from the URL path
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const tenant = pathParts[2] // Assuming path is /api/[tenant]/convenios
    
    // Connect to the tenant's database
    const connection = await connectDB(tenant)
    
    // Use Mongoose's native connection to access the database
    // Get the native MongoDB connection from the Mongoose connection
    const convenios = await connection.db.collection(`${tenant}_convenios`).find({}).toArray()
    
    return NextResponse.json(convenios)
  } catch (error) {
    console.error('Erro ao buscar convênios:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}