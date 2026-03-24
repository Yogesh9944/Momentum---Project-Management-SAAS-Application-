const { Server } = require('socket.io');

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(` Socket connected: ${socket.id}`);

    // Join user-specific room
    socket.on('join:user', (userId) => {
      socket.join(`user:${userId}`);
    });

    // Join workspace room
    socket.on('join:workspace', (workspaceId) => {
      socket.join(`workspace:${workspaceId}`);
    });

    // Join project room
    socket.on('join:project', (projectId) => {
      socket.join(`project:${projectId}`);
    });

    // Leave rooms
    socket.on('leave:workspace', (workspaceId) => socket.leave(`workspace:${workspaceId}`));
    socket.on('leave:project', (projectId) => socket.leave(`project:${projectId}`));

    // User typing in task
    socket.on('task:typing', ({ projectId, taskId, user }) => {
      socket.to(`project:${projectId}`).emit('task:typing', { taskId, user });
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

module.exports = initSocket;
