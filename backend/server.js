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

app.get('/', (req, res) => {
  res.send('🚀 Momentum Backend is Live');
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/workspaces', require('./routes/workspaces'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));


app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Momentum API running'
  });
});


app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found'
  });
});


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong'
  });
});

// Server start
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Momentum server running on port ${PORT}`);
});
