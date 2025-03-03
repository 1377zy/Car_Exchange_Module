/**
 * MongoDB Connection Test Script
 * This script tests the connection to MongoDB using the configuration in .env
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Get MongoDB URI from environment
const mongoURI = process.env.MONGODB_URI;

console.log('Attempting to connect to MongoDB...');
console.log(`MongoDB URI: ${mongoURI}`);

// Connect to MongoDB
mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('MongoDB Connection Successful!');
    console.log('Connection State:', mongoose.connection.readyState);
    
    // List available collections
    mongoose.connection.db.listCollections().toArray((err, collections) => {
      if (err) {
        console.error('Error listing collections:', err);
      } else {
        console.log('Available collections:');
        collections.forEach(collection => {
          console.log(`- ${collection.name}`);
        });
      }
      
      // Close connection
      mongoose.connection.close();
      console.log('Connection closed.');
    });
  })
  .catch(err => {
    console.error('MongoDB Connection Error:', err.message);
    process.exit(1);
  });
