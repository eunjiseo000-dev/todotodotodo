const { Client } = require('pg');

// Load environment variables
require('dotenv').config();

async function testDatabaseConnection() {
  const connectionString = process.env.POSTGRES_CONNECTION_STRING;

  if (!connectionString) {
    console.error('Error: POSTGRES_CONNECTION_STRING is not defined in .env file');
    return;
  }

  const client = new Client({
    connectionString: connectionString,
  });

  try {
    await client.connect();
    console.log('✓ Successfully connected to PostgreSQL database');
    
    // Test query to verify the connection works
    const result = await client.query('SELECT NOW() as now');
    console.log('✓ Database query test successful:', result.rows[0].now);
    
    // Check if the 'todo' database exists
    const dbExistsResult = await client.query(`
      SELECT 1 FROM pg_database WHERE datname = 'todo'
    `);
    
    if (dbExistsResult.rows.length > 0) {
      console.log('✓ Todo database already exists');
    } else {
      console.log('ℹ Todo database does not exist yet');
    }
    
    return true;
  } catch (err) {
    console.error('✗ Database connection failed:', err.message);
    return false;
  } finally {
    await client.end();
  }
}

// Run the test
testDatabaseConnection().then(success => {
  if (success) {
    console.log('\n🎉 Database connection test completed successfully!');
  } else {
    console.log('\n❌ Database connection test failed!');
    process.exit(1);
  }
});