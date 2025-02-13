import { MongoClient } from 'mongodb';

export async function verifyDatabase(dbName) {
  if (!dbName || typeof dbName !== 'string') {
    throw new Error('Invalid database name');
  }

  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    
    // Get list of all databases
    const adminDb = client.db('admin');
    const dbs = await adminDb.admin().listDatabases();
    
    // Check if database exists
    return dbs.databases.some(db => db.name === dbName);
  } finally {
    await client.close();
  }
}