import { MongoClient, ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const product_id = searchParams.get('product_id');
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');

    await client.connect();
    const database = client.db('hospital');
    const collection = database.collection('stock_movements');

    // Build query
    const query = {};

    // Add type filter
    if (type) {
      query.type = type;
    }

    // Add product filter
    if (product_id) {
      query.product_id = new ObjectId(product_id);
    }

    // Add date range filter
    if (start_date || end_date) {
      query.created_at = {};
      if (start_date) {
        query.created_at.$gte = new Date(start_date);
      }
      if (end_date) {
        query.created_at.$lte = new Date(end_date);
      }
    }

    // Fetch movements with sorting
    const movements = await collection
      .find(query)
      .sort({ created_at: -1 })
      .toArray();

    return NextResponse.json(movements);
  } catch (error) {
    console.error('Error fetching movements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch movements' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}