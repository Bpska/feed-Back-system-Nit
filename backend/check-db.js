const { Client } = require('pg');

async function listTables() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'bps',
        database: 'propoly',
    });

    try {
        await client.connect();
        console.log('✅ Connected to database: propoly');

        const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

        console.log('\n📊 Database Tables:');
        if (res.rows.length === 0) {
            console.log('No tables found (Backend might still be initializing schema)');
        } else {
            res.rows.forEach(row => {
                console.log(` - ${row.table_name}`);
            });
        }

    } catch (err) {
        console.error('Database Connection Error:', err.message);
    } finally {
        await client.end();
    }
}

listTables();
