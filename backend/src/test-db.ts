import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function testConnection() {
    const client = new Client({
        host: process.env.DATABASE_HOST,
        port: parseInt(process.env.DATABASE_PORT || '5432'),
        user: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
    });

    try {
        await client.connect();
        console.log('Connected to database successfully');
        const res = await client.query('SELECT current_database(), current_user');
        console.log('DB Info:', res.rows[0]);
        await client.end();
    } catch (err) {
        console.error('Connection error:', err);
    }
}

testConnection();
