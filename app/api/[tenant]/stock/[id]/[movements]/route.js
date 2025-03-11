//api/[tenant]/stock/[id]/[movements]/route.js

import { MongoClient, ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export async function POST(request, { params }) {
  try {
    // Await the params object before destructuring
    const paramsObj = await params;
    const { id, movements } = paramsObj;
    const { quantity, observations, expiration_date } = await request.json();

    await client.connect();
    const database = client.db('hospital');
    const collection = database.collection('stock');

    // Busca o produto atual
    const product = await collection.findOne({ _id: new ObjectId(id) });
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    let newQuantity;
    let updateData = {};

    if (movements === 'incoming') {
      newQuantity = product.quantity + quantity;
      // Se for uma entrada, atualiza a data de vencimento
      if (expiration_date) {
        updateData.expiration_date = new Date(expiration_date);
      }
    } else if (movements === 'outgoing') {
      newQuantity = product.quantity - quantity;
      
      if (newQuantity < 0) {
        return NextResponse.json(
          { error: 'Insufficient stock' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid movement type' },
        { status: 400 }
      );
    }

    // Registra a movimentação
    const movementRecord = {
      product_id: new ObjectId(id),
      type: movements,
      quantity,
      previous_quantity: product.quantity,
      new_quantity: newQuantity,
      observations,
      expiration_date: expiration_date ? new Date(expiration_date) : undefined,
      created_at: new Date()
    };

    // Atualiza o estoque e registra a movimentação em uma transação
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        // Atualiza a quantidade do produto e a data de vencimento se aplicável
        await collection.updateOne(
          { _id: new ObjectId(id) },
          { 
            $set: { 
              quantity: newQuantity,
              ...updateData,
              updated_at: new Date()
            }
          },
          { session }
        );

        // Registra a movimentação
        await database.collection('stock_movements').insertOne(
          movementRecord,
          { session }
        );
      });

      return NextResponse.json({
        success: true,
        new_quantity: newQuantity
      });
    } finally {
      await session.endSession();
    }
  } catch (error) {
    console.error('Movement error:', error);
    return NextResponse.json(
      { error: 'Failed to process movement' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}