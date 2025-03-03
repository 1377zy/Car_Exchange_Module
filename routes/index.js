const express = require('express');
const router = express.Router();

/**
 * @route   GET /
 * @desc    API status check
 * @access  Public
 */
router.get('/', (req, res) => {
  res.json({
    message: 'Car Exchange Module API is running',
    version: '1.0.0',
    status: 'OK'
  });
});

/**
 * @route   GET /api/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    message: 'Car Exchange Module API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

module.exports = router;
