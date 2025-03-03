const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

console.log('Testing MongoDB connection...');

// MongoDB connection string
const MONGODB_URI = 'mongodb+srv://Car_User:carsforlife@cluster0.e6b7c.mongodb.net/car_exchange?retryWrites=true&w=majority&appName=Cluster0';

console.log('Using MongoDB URI:', MONGODB_URI.replace(/:[^:]*@/, ':****@')); // Hide password in logs

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('MongoDB Connected Successfully!');
    
    // List all collections
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
      console.log('Connection closed');
    });
  })
  .catch(err => {
    console.error('MongoDB Connection Error:', err.message);
    process.exit(1);
  });
