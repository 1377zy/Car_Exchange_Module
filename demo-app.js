/**
 * Car Exchange Module - Demo Application
 * 
 * This is a simplified version of the Car Exchange Module that demonstrates
 * the core functionality without requiring external dependencies like MongoDB.
 */

const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

// Create Express app
const app = express();
const server = http.createServer(app);

// In-memory data store
const db = {
  users: [],
  vehicles: [],
  leads: [],
  appointments: []
};

// Load sample data if available
try {
  if (fs.existsSync('./data')) {
    const files = fs.readdirSync('./data');
    files.forEach(file => {
      if (file.endsWith('.json')) {
        const collection = file.replace('.json', '');
        const data = JSON.parse(fs.readFileSync(`./data/${file}`, 'utf8'));
        db[collection] = data;
        console.log(`Loaded ${data.length} records from ${file}`);
      }
    });
  }
} catch (err) {
  console.error('Error loading sample data:', err);
}

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the client/build directory if it exists
if (fs.existsSync(path.join(__dirname, 'client', 'build'))) {
  app.use(express.static(path.join(__dirname, 'client', 'build')));
}

// API Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: 'development',
    version: '1.0.0'
  });
});

// Auth endpoints
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Find user by email (simplified auth for demo)
  const user = db.users.find(u => u.email === email);
  
  if (!user) {
    return res.status(400).json({ error: { message: 'Invalid credentials' } });
  }
  
  // In a real app, we would verify the password hash here
  
  // Return user data with a mock token
  res.json({
    token: 'demo-jwt-token-' + Date.now(),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

// User endpoints
app.get('/api/users', (req, res) => {
  // Return users without sensitive information
  const safeUsers = db.users.map(user => ({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    isActive: user.isActive
  }));
  
  res.json(safeUsers);
});

// Vehicle endpoints
app.get('/api/vehicles', (req, res) => {
  res.json(db.vehicles);
});

app.get('/api/vehicles/:id', (req, res) => {
  const vehicle = db.vehicles.find(v => v._id === req.params.id);
  
  if (!vehicle) {
    return res.status(404).json({ error: { message: 'Vehicle not found' } });
  }
  
  res.json(vehicle);
});

// Lead endpoints
app.get('/api/leads', (req, res) => {
  res.json(db.leads);
});

app.get('/api/leads/:id', (req, res) => {
  const lead = db.leads.find(l => l._id === req.params.id);
  
  if (!lead) {
    return res.status(404).json({ error: { message: 'Lead not found' } });
  }
  
  res.json(lead);
});

// Appointment endpoints
app.get('/api/appointments', (req, res) => {
  res.json(db.appointments);
});

// Catch-all route to serve React app
app.get('*', (req, res) => {
  if (fs.existsSync(path.join(__dirname, 'client', 'build', 'index.html'))) {
    res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
  } else {
    res.json({
      message: 'Car Exchange Module API',
      endpoints: [
        '/api/health',
        '/api/auth/login',
        '/api/users',
        '/api/vehicles',
        '/api/leads',
        '/api/appointments'
      ]
    });
  }
});

// Start server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`
==========================================================
  Car Exchange Module - Demo Server
==========================================================
  Server running on port ${PORT}
  
  Available endpoints:
    - GET  /api/health
    - POST /api/auth/login
    - GET  /api/users
    - GET  /api/vehicles
    - GET  /api/vehicles/:id
    - GET  /api/leads
    - GET  /api/leads/:id
    - GET  /api/appointments
    
  Sample credentials:
    - Admin:   admin@carexchange.com / admin123
    - Manager: manager@carexchange.com / manager123
    - Agent:   agent@carexchange.com / agent123
==========================================================
`);
});
