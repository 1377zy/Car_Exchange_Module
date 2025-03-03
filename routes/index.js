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

module.exports = router;
