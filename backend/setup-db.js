const { Client } = require('pg');

// Connection configuration
const config = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'bps',
  // Don't specify database initially to create it
};

async function setupDatabase() {
  let client = new Client(config);
  
  try {
    // Connect to PostgreSQL
    await client.connect();
    console.log('✅ Connected to PostgreSQL server');

    // Check if database exists
    const dbCheckQuery = `
      SELECT 1 FROM pg_database WHERE datname = 'propoly'
    `;
    const dbExists = await client.query(dbCheckQuery);

    if (dbExists.rows.length === 0) {
      // Create database
      await client.query('CREATE DATABASE propoly');
      console.log('✅ Database "propoly" created successfully');
    } else {
      console.log('ℹ️  Database "propoly" already exists');
    }

    await client.end();

    // Now connect to the propoly database
    client = new Client({
      ...config,
      database: 'propoly'
    });

    await client.connect();
    console.log('✅ Connected to "propoly" database');

    // Create tables
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createFeedItemsTable = `
      CREATE TABLE IF NOT EXISTS feed_items (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        content TEXT,
        author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        published BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_feed_items_author ON feed_items(author_id);
      CREATE INDEX IF NOT EXISTS idx_feed_items_published ON feed_items(published);
    `;

    await client.query(createUsersTable);
    console.log('✅ Table "users" created successfully');

    await client.query(createFeedItemsTable);
    console.log('✅ Table "feed_items" created successfully');

    await client.query(createIndexes);
    console.log('✅ Indexes created successfully');

    // List all tables
    const listTablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    const tables = await client.query(listTablesQuery);
    console.log('\n📋 Tables in database:');
    tables.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    // Get table details
    console.log('\n📊 Table Structure:');
    
    const usersColumnsQuery = `
      SELECT column_name, data_type, character_maximum_length, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `;
    
    const usersColumns = await client.query(usersColumnsQuery);
    console.log('\n  Users Table:');
    usersColumns.rows.forEach(col => {
      const type = col.character_maximum_length 
        ? `${col.data_type}(${col.character_maximum_length})`
        : col.data_type;
      console.log(`    - ${col.column_name}: ${type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
    });

    const feedItemsColumnsQuery = `
      SELECT column_name, data_type, character_maximum_length, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'feed_items'
      ORDER BY ordinal_position;
    `;
    
    const feedItemsColumns = await client.query(feedItemsColumnsQuery);
    console.log('\n  Feed Items Table:');
    feedItemsColumns.rows.forEach(col => {
      const type = col.character_maximum_length 
        ? `${col.data_type}(${col.character_maximum_length})`
        : col.data_type;
      console.log(`    - ${col.column_name}: ${type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
    });

    console.log('\n✅ Database setup completed successfully!');
    console.log('\n🔗 Connection String: postgresql://postgres:bps@localhost:5432/propoly\n');

    await client.end();
    process.exit(0);

  } catch (err) {
    console.error('❌ Error:', err.message);
    if (client) {
      await client.end();
    }
    process.exit(1);
  }
}

setupDatabase();
