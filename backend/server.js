const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app); // ทำ http serverคลุม express
const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});
const PORT = 3000;
const SECRET_KEY = 'robo-learn-ai-secret-key';

app.use(cors());
app.use(bodyParser.json());

const dbPath = path.resolve(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

// Middleware: ตรวจสอบ Token (Authentication)
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
        req.user = user;
        next();
    });
};

app.get('/', (req, res) => {
    res.send('<h1>✅ Robo Learn AI Backend (Auth Mode) is Running!</h1>');
});

// ============================================
// API: Authentication (Register & Login)
// ============================================

// 1. Register
app.post('/api/auth/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    const sql = `INSERT INTO users (username, password_hash) VALUES (?, ?)`;
    db.run(sql, [username, hash], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Username already exists' });
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, message: 'User registered successfully' });
    });
});

// 2. Login
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const sql = `SELECT * FROM users WHERE username = ?`;
    
    db.get(sql, [username], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(400).json({ error: 'User not found' });

        const validPassword = bcrypt.compareSync(password, user.password_hash);
        if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET_KEY, { expiresIn: '12h' });
        res.json({ success: true, token, user: { id: user.id, username: user.username, role: user.role } });
    });
});

// ============================================
// API: Projects (Filtered by User)
// ============================================

// 1. Get all projects for the logged-in user
app.get('/api/projects', authenticateToken, (req, res) => {
    const sql = `SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC`;
    db.all(sql, [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 2. Save Flow
app.post('/api/save-flow', authenticateToken, (req, res) => {
    const { name, flow_data, project_id } = req.body;
    const userId = req.user.id;

    db.serialize(() => {
        const handleUpsertFlow = (pId) => {
            const dataString = typeof flow_data === 'object' ? JSON.stringify(flow_data) : flow_data;
            
            // Check if flow exists for this project
            db.get(`SELECT id FROM canvas_flows WHERE project_id = ?`, [pId], (err, row) => {
                if (err) return res.status(500).json({ error: err.message });
                
                if (row) {
                    // Update existing
                    const sqlUpdate = `UPDATE canvas_flows SET flow_data = ?, created_at = CURRENT_TIMESTAMP WHERE project_id = ?`;
                    db.run(sqlUpdate, [dataString, pId], function(err) {
                        if (err) return res.status(500).json({ error: err.message });
                        res.json({ success: true, project_id: pId, flow_id: row.id, action: 'updated' });
                    });
                } else {
                    // Insert new
                    const sqlInsert = `INSERT INTO canvas_flows (project_id, flow_data) VALUES (?, ?)`;
                    db.run(sqlInsert, [pId, dataString], function(err) {
                        if (err) return res.status(500).json({ error: err.message });
                        res.json({ success: true, project_id: pId, flow_id: this.lastID, action: 'created' });
                    });
                }
            });
        };

        if (!finalProjectId) {
            db.run(`INSERT INTO projects (name, user_id) VALUES (?, ?)`, [name, userId], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                finalProjectId = this.lastID;
                handleUpsertFlow(finalProjectId);
            });
        } else {
            // Verify ownership before updating
            db.get(`SELECT id FROM projects WHERE id = ? AND user_id = ?`, [finalProjectId, userId], (err, row) => {
                if (!row) return res.status(403).json({ error: 'Unauthorized project update' });
                db.run(`UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [finalProjectId]);
                handleUpsertFlow(finalProjectId);
            });
        }
    });
});

// 3. Get latest flow
app.get('/api/projects/:id/flow', authenticateToken, (req, res) => {
    const sql = `SELECT * FROM canvas_flows f JOIN projects p ON f.project_id = p.id 
                 WHERE f.project_id = ? AND p.user_id = ? 
                 ORDER BY f.created_at DESC LIMIT 1`;
    db.get(sql, [req.params.id, req.user.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Flow not found or unauthorized' });
        res.json({ ...row, flow_data: JSON.parse(row.flow_data) });
    });
});

// ============================================
// API: Training Sessions
// ============================================

app.post('/api/train/start', authenticateToken, (req, res) => {
    const { project_id, hyperparams } = req.body;
    
    // Check ownership
    db.get(`SELECT id FROM projects WHERE id = ? AND user_id = ?`, [project_id, req.user.id], (err, row) => {
        if (!row) return res.status(403).json({ error: 'Unauthorized training request' });

        const sql = `INSERT INTO training_sessions (project_id, status, hyperparameters, start_time) VALUES (?, 'training', ?, CURRENT_TIMESTAMP)`;
        const paramsString = JSON.stringify(hyperparams || {});
        
        db.run(sql, [project_id, paramsString], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, session_id: this.lastID, message: 'Training session started (Secured)' });
        });
    });
});

// ============================================
// API: Models Management
// ============================================

// 1. Get all trained models for a project
app.get('/api/projects/:id/models', authenticateToken, (req, res) => {
    const sql = `SELECT * FROM models WHERE project_id = ? ORDER BY created_at DESC`;
    db.all(sql, [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// ============================================
// API: User Settings
// ============================================

app.get('/api/user/settings', authenticateToken, (req, res) => {
    db.get(`SELECT * FROM user_settings WHERE user_id = ?`, [req.user.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) {
            // Create default settings if not exist
            db.run(`INSERT INTO user_settings (user_id) VALUES (?)`, [req.user.id]);
            return res.json({ user_id: req.user.id, theme: 'light', language: 'th', auto_save: 1 });
        }
        res.json(row);
    });
});

app.post('/api/user/settings', authenticateToken, (req, res) => {
    const { theme, language, auto_save } = req.body;
    db.run(`INSERT OR REPLACE INTO user_settings (user_id, theme, language, auto_save) VALUES (?, ?, ?, ?)`,
        [req.user.id, theme, language, auto_save], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'Settings updated' });
    });
});

// ============================================
// Delete Project
// ============================================
app.delete('/api/projects/:id', authenticateToken, (req, res) => {
    db.run(`DELETE FROM projects WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: `Deleted project ${req.params.id}` });
    });
});

// ============================================
// Socket.IO - Robot Camera Streaming
// ============================================
io.on('connection', (socket) => {
    console.log(`[Socket] เชื่อมต่อใหม่: ${socket.id}`);

    // Web: ขอเข้าห้องของหุ่นยนต์
    socket.on('join_robot_room', (robotId) => {
        socket.join(robotId);
        console.log(`[Socket] Web เข้าห้อง Robot ID: ${robotId}`);
        socket.emit('room_joined', { robotId, status: 'connected' });
    });

    // Robot: ส่งภาพมาสเหนอร์ฟเวอร์ไปยัง Web ที่เข้าห้องนั้น
    socket.on('video_frame_from_robot', (data) => {
        // data = { robotId: 'ROBOT_01', image: 'data:image/jpeg;base64,...' }
        socket.to(data.robotId).emit('stream_to_web', data.image);
    });

    // Robot: ส่งสัญญาณ ping เพื่อยืนยันว่ายังออนไลน์อยู่
    socket.on('robot_ping', (data) => {
        io.to(data.robotId).emit('robot_online', { robotId: data.robotId, ts: Date.now() });
        console.log(`[Socket] Robot ให้สัญญาณ: ${data.robotId}`);
    });

    socket.on('disconnect', () => {
        console.log(`[Socket] หลุด: ${socket.id}`);
    });
});

// เปลี่ยน app.listen เป็น server.listen เพื่อให้ Socket.IO ทำงานเสมอกัน
server.listen(PORT, () => {
    console.log(`🚀 Server (HTTP + Socket.IO) is running on http://localhost:${PORT}`);
});
