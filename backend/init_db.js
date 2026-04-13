require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

async function initDB() {
    try {
        await client.connect();
        console.log('✅ Connected to PostgreSQL database.');

        // 1. Projects Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS projects (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 2. Canvas Flows Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS canvas_flows (
                id SERIAL PRIMARY KEY,
                project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
                flow_data JSONB NOT NULL,
                version INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 3. Datasets Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS datasets (
                id SERIAL PRIMARY KEY,
                project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
                name TEXT NOT NULL,
                source_type TEXT,
                config_path TEXT,
                classes JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 4. Training Sessions Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS training_sessions (
                id SERIAL PRIMARY KEY,
                project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
                status TEXT DEFAULT 'pending',
                hyperparameters JSONB,
                start_time TIMESTAMP,
                end_time TIMESTAMP,
                best_map REAL,
                log_path TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 5. Models Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS models (
                id SERIAL PRIMARY KEY,
                session_id INTEGER REFERENCES training_sessions(id) ON DELETE CASCADE,
                name TEXT NOT NULL,
                format TEXT,
                file_path TEXT NOT NULL,
                accuracy REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('🚀 PostgreSQL schema initialized successfully.');
    } catch (err) {
        console.error('❌ Error initializing database:', err.stack);
    } finally {
        await client.end();
    }
}

initDB();
