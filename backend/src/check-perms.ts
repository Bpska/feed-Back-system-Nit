import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function fixPermissions() {
    // We need to connect as a superuser to grant permissions if app_user is restricted
    // But we likely only have app_user's credentials.
    // Wait, let's see if app_user can grant to themselves or if we can use postgres user?
    // I don't have postgres user password.

    // Let's try to run a simple ALTER as app_user and see if it fails.
    const client = new Client({
        host: process.env.DATABASE_HOST,
        port: parseInt(process.env.DATABASE_PORT || '5432'),
        user: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
    });

    try {
        await client.connect();
        console.log('Checking permissions...');

        // Check if we can alter faculty table
        await client.query('ALTER TABLE faculty ADD COLUMN test_col int');
        console.log('Successfully altered faculty table');
        await client.query('ALTER TABLE faculty DROP COLUMN test_col');
        console.log('Successfully dropped test column');

        await client.end();
    } catch (err) {
        console.error('Permission check failed:', err);
    }
}

fixPermissions();
