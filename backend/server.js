const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const initSocket = require('./socket/index');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// Init Socket.IO
const io = initSocket(server);
app.set('io', io);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/workspaces', require('./routes/workspaces'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'Momentum API running' }));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Momentum server running on port ${PORT}`));
