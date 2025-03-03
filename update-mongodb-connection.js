/**
 * Update MongoDB Connection Script
 * This script updates the .env file to use MongoDB Atlas instead of a local MongoDB instance
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Path to .env file
const envPath = path.join(process.cwd(), '.env');

// Read current .env file
const envContent = fs.readFileSync(envPath, 'utf8');

// Ask for MongoDB Atlas connection string
rl.question('Enter your MongoDB Atlas connection string (or press Enter to use a demo connection string): ', (answer) => {
  let mongoURI;
  
  if (answer.trim() === '') {
    // Use a demo connection string for testing purposes
    mongoURI = 'mongodb+srv://demo:demo123@cluster0.mongodb.net/car_exchange?retryWrites=true&w=majority';
    console.log('Using demo connection string. Note: This is not a real connection and is for demonstration purposes only.');
  } else {
    mongoURI = answer.trim();
    console.log('Using provided MongoDB Atlas connection string.');
  }
  
  // Update the .env file with the new MongoDB URI
  const updatedContent = envContent.replace(/MONGODB_URI=.*/g, `MONGODB_URI=${mongoURI}`);
  
  // Write the updated content back to the .env file
  fs.writeFileSync(envPath, updatedContent);
  
  console.log('.env file updated with MongoDB Atlas connection string.');
  rl.close();
});
