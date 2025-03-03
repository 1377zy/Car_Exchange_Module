const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const http = require('http');
const socketManager = require('./utils/socketManager');
const errorHandler = require('./middleware/errorHandler');

// Load env vars
dotenv.config();

const app = express();

// Init Middleware
app.use(express.json({ extended: false }));
app.use(cors());

// Define Routes
app.use('/', require('./routes/index'));
app.use('/api/users', require('./routes/users'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/communications', require('./routes/communications'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/vehicle-interests', require('./routes/vehicleInterests'));
app.use('/api/notifications', require('./routes/notifications'));

// Global error handler
app.use(errorHandler);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static('client/build'));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('MongoDB Connected...');
    
    // Initialize Socket.io
    socketManager.initialize(server);
    
    // Start server
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error(err.message);
    // Exit process with failure
    process.exit(1);
  });
