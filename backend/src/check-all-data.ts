import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkAllData() {
    const client = new Client({
        host: process.env.DATABASE_HOST,
        port: parseInt(process.env.DATABASE_PORT || '5432'),
        user: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
    });

    try {
        await client.connect();
        console.log('--- DATABASE CONNECTION ESTABLISHED ---');
        console.log(`Connected to: ${process.env.DATABASE_NAME} as ${process.env.DATABASE_USERNAME}\n`);

        const tables = ['users', 'profiles', 'faculty', 'faculty_assignments', 'ratings', 'app_settings'];

        for (const table of tables) {
            console.log(`--- DATA FROM TABLE: ${table.toUpperCase()} ---`);
            try {
                const res = await client.query(`SELECT * FROM "${table}"`);
                if (res.rows.length === 0) {
                    console.log(`No records found in ${table}.`);
                } else {
                    console.table(res.rows);
                }
            } catch (err: any) {
                console.error(`Error fetching data from ${table}:`, err.message);
            }
            console.log('\n');
        }

        await client.end();
    } catch (err: any) {
        console.error('--- DATABASE CONNECTION FAILED ---');
        console.error('Error:', err.message);
    }
}

checkAllData();
