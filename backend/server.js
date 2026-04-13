require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// PostgreSQL Connection Pool
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

app.get('/', (req, res) => {
    res.send('<h1>✅ Robo Learn AI Backend (PostgreSQL) is Running!</h1>');
});

// ============================================
// API: Projects & Flows
// ============================================

// 1. Get all projects
app.get('/api/projects', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM projects ORDER BY updated_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Save Canvas (Smart Save)
app.post('/api/save-flow', async (req, res) => {
    const { name, flow_data, project_id } = req.body;
    
    if (!name || !flow_data) return res.status(400).json({ error: 'Name and flow_data are required' });

    try {
        let finalProjectId = project_id;

        // If no project_id, create a new project
        if (!finalProjectId) {
            const projectRes = await pool.query(
                'INSERT INTO projects (name) VALUES ($1) RETURNING id', 
                [name]
            );
            finalProjectId = projectRes.rows[0].id;
        } else {
            // Update project timestamp
            await pool.query('UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [finalProjectId]);
        }

        // Insert new flow version
        // JSONB handles objects directly in PG
        const flowRes = await pool.query(
            'INSERT INTO canvas_flows (project_id, flow_data) VALUES ($1, $2) RETURNING id',
            [finalProjectId, flow_data]
        );

        res.json({ success: true, project_id: finalProjectId, flow_id: flowRes.rows[0].id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Get latest flow for a project
app.get('/api/projects/:id/flow', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM canvas_flows WHERE project_id = $1 ORDER BY created_at DESC LIMIT 1',
            [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Flow not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// API: Training Sessions
// ============================================

app.post('/api/train/start', async (req, res) => {
    const { project_id, hyperparams } = req.body;
    
    try {
        const result = await pool.query(
            'INSERT INTO training_sessions (project_id, status, hyperparameters, start_time) VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING id',
            [project_id, 'training', hyperparams || {}]
        );
        
        res.json({ 
            success: true, 
            session_id: result.rows[0].id, 
            message: 'Training session started in PostgreSQL (Phase 3 ready)' 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// Delete Project
// ============================================
app.delete('/api/projects/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM projects WHERE id = $1', [req.params.id]);
        res.json({ success: true, message: `Deleted project ${req.params.id}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
