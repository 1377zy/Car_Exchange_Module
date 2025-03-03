/**
 * Mock Database Service
 * This script creates a mock database service that simulates MongoDB functionality
 * for development and testing purposes when a real MongoDB instance is not available.
 */

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

// Create a data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Mock MongoDB connection
class MockMongoose extends EventEmitter {
  constructor() {
    super();
    this.connection = {
      readyState: 1,
      db: {
        listCollections: () => ({
          toArray: (callback) => {
            const collections = this.getCollections();
            callback(null, collections);
          }
        })
      },
      close: () => {
        console.log('Mock MongoDB connection closed');
        return Promise.resolve();
      }
    };
    this.models = {};
    this.Schema = function(definition) {
      this.definition = definition;
      this.methods = {};
      this.statics = {};
    };
    console.log('Mock MongoDB initialized');
  }

  connect(uri, options) {
    console.log(`Mock connecting to: ${uri}`);
    setTimeout(() => {
      this.emit('connected');
    }, 100);
    return Promise.resolve();
  }

  model(name, schema) {
    if (this.models[name]) {
      return this.models[name];
    }

    const dataFile = path.join(dataDir, `${name}.json`);
    let data = [];

    // Load existing data if file exists
    if (fs.existsSync(dataFile)) {
      try {
        data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
      } catch (err) {
        console.error(`Error reading data file for ${name}:`, err);
      }
    }

    // Create model class
    class Model {
      constructor(doc) {
        Object.assign(this, doc);
        this._id = this._id || `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.save = this.save.bind(this);
      }

      save() {
        // Find if this document already exists
        const index = data.findIndex(item => item._id === this._id);
        
        if (index !== -1) {
          // Update existing document
          data[index] = { ...this };
        } else {
          // Add new document
          data.push({ ...this });
        }
        
        // Save to file
        fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
        return Promise.resolve(this);
      }
    }

    // Add static methods to model
    Model.find = (query = {}) => {
      return Promise.resolve(data.filter(item => this.matchQuery(item, query)));
    };

    Model.findById = (id) => {
      const doc = data.find(item => item._id === id);
      return Promise.resolve(doc ? new Model(doc) : null);
    };

    Model.findOne = (query = {}) => {
      const doc = data.find(item => this.matchQuery(item, query));
      return Promise.resolve(doc ? new Model(doc) : null);
    };

    Model.findByIdAndUpdate = (id, update) => {
      const index = data.findIndex(item => item._id === id);
      if (index !== -1) {
        data[index] = { ...data[index], ...update };
        fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
        return Promise.resolve(new Model(data[index]));
      }
      return Promise.resolve(null);
    };

    Model.findOneAndUpdate = (query, update, options = {}) => {
      const index = data.findIndex(item => this.matchQuery(item, query));
      if (index !== -1) {
        data[index] = { ...data[index], ...update };
        fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
        return Promise.resolve(new Model(data[index]));
      } else if (options.upsert) {
        const newDoc = { ...query, ...update };
        newDoc._id = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        data.push(newDoc);
        fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
        return Promise.resolve(new Model(newDoc));
      }
      return Promise.resolve(null);
    };

    Model.deleteOne = (query) => {
      const index = data.findIndex(item => this.matchQuery(item, query));
      if (index !== -1) {
        data.splice(index, 1);
        fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
        return Promise.resolve({ deletedCount: 1 });
      }
      return Promise.resolve({ deletedCount: 0 });
    };

    Model.deleteMany = (query) => {
      const initialLength = data.length;
      data = data.filter(item => !this.matchQuery(item, query));
      fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
      return Promise.resolve({ deletedCount: initialLength - data.length });
    };

    this.models[name] = Model;
    return Model;
  }

  matchQuery(item, query) {
    for (const key in query) {
      if (key === '_id') {
        if (item._id !== query._id) {
          return false;
        }
      } else if (typeof query[key] === 'object' && query[key] !== null) {
        // Handle operators like $eq, $gt, etc.
        for (const op in query[key]) {
          switch (op) {
            case '$eq':
              if (item[key] !== query[key].$eq) return false;
              break;
            case '$ne':
              if (item[key] === query[key].$ne) return false;
              break;
            case '$gt':
              if (item[key] <= query[key].$gt) return false;
              break;
            case '$gte':
              if (item[key] < query[key].$gte) return false;
              break;
            case '$lt':
              if (item[key] >= query[key].$lt) return false;
              break;
            case '$lte':
              if (item[key] > query[key].$lte) return false;
              break;
            case '$in':
              if (!query[key].$in.includes(item[key])) return false;
              break;
            case '$nin':
              if (query[key].$nin.includes(item[key])) return false;
              break;
            default:
              break;
          }
        }
      } else if (item[key] !== query[key]) {
        return false;
      }
    }
    return true;
  }

  getCollections() {
    // Get all JSON files in the data directory
    const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.json'));
    return files.map(file => ({
      name: file.replace('.json', '')
    }));
  }
}

// Create and export mock mongoose instance
const mockMongoose = new MockMongoose();

// Override the real mongoose with our mock
module.exports = mockMongoose;
