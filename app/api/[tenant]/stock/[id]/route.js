//api/stock/[id]/route.js

import { MongoClient, ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

// PUT /api/stock/[id] - Atualiza um produto
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const updates = await request.json();
    
    await client.connect();
    const database = client.db('hospital');
    const collection = database.collection('stock');

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: {
          ...updates,
          updated_at: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}

// DELETE /api/stock/[id] - Remove um produto
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    await client.connect();
    const database = client.db('hospital');
    const collection = database.collection('stock');

    const result = await collection.deleteOne({
      _id: new ObjectId(id)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}