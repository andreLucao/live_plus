//api/[tenant]/stock/route.js

import { MongoClient, ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import { addDays } from 'date-fns';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';
    
    await client.connect();
    const database = client.db('hospital');
    const collection = database.collection('stock');

    let query = {};
    const currentDate = new Date();

    switch (filter) {
      case 'low':
        query = {
          $expr: { $lt: ['$quantity', '$minimum_stock'] }
        };
        break;
      case 'expiring':
        query = {
          expiration_date: {
            $gte: currentDate,
            $lte: addDays(currentDate, 30)
          }
        };
        break;
      case 'expired':
        query = {
          expiration_date: { $lt: currentDate }
        };
        break;
    }

    const products = await collection.find(query).toArray();
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}

export async function POST(request) {
  try {
    const product = await request.json();
    
    await client.connect();
    const database = client.db('hospital');
    const collection = database.collection('stock');

    const result = await collection.insertOne({
      ...product,
      expiration_date: new Date(product.expiration_date),
      created_at: new Date(),
      updated_at: new Date()
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}