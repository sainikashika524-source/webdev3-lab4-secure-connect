const path = require('path');
const express = require('express');
const authRoutes = require('./routes/authRoutes');
const noteRoutes = require('./routes/noteRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '50kb' }));

// Basic security headers (no helmet — only listed libraries allowed)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

// Browser chat client for the real-time demo
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api', (req, res) =>
  res.json({
    message: 'Secure Connect API is running',
    endpoints: [
      'POST   /api/auth/signup',
      'POST   /api/auth/login',
      'POST   /api/auth/logout',
      'GET    /api/auth/me          (protected)',
      'GET    /api/notes            (protected)',
      'POST   /api/notes            (protected)',
      'GET    /api/notes/:id        (protected, owner)',
      'PUT    /api/notes/:id        (protected, owner)',
      'DELETE /api/notes/:id        (protected, owner)',
      'GET    /api/admin/users      (admin only)',
      'GET    /api/admin/stats      (admin only)',
      'Socket.IO chat at /          (JWT required)',
    ],
  })
);

app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
