const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/User');
const Lead = require('../models/Lead');
const Vehicle = require('../models/Vehicle');
const Template = require('../models/Template');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false
})
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error('MongoDB Connection Error:', err.message);
    process.exit(1);
  });

// Sample data
const users = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'password123',
    role: 'admin',
    department: 'Management',
    phone: '555-123-4567',
    isActive: true
  },
  {
    name: 'Sales Manager',
    email: 'manager@example.com',
    password: 'password123',
    role: 'manager',
    department: 'Sales',
    phone: '555-234-5678',
    isActive: true
  },
  {
    name: 'Sales Agent',
    email: 'agent@example.com',
    password: 'password123',
    role: 'agent',
    department: 'Sales',
    phone: '555-345-6789',
    isActive: true
  }
];

const leads = [
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '555-111-2222',
    address: {
      street: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zipCode: '90210'
    },
    source: 'website',
    status: 'new',
    tags: ['interested', 'financing']
  },
  {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    phone: '555-222-3333',
    address: {
      street: '456 Oak Ave',
      city: 'Somewhere',
      state: 'NY',
      zipCode: '10001'
    },
    source: 'referral',
    status: 'contacted',
    tags: ['test-drive', 'cash-buyer']
  },
  {
    firstName: 'Bob',
    lastName: 'Johnson',
    email: 'bob.johnson@example.com',
    phone: '555-333-4444',
    address: {
      street: '789 Pine Rd',
      city: 'Elsewhere',
      state: 'TX',
      zipCode: '75001'
    },
    source: 'walk-in',
    status: 'qualified',
    tags: ['trade-in', 'financing']
  }
];

const vehicles = [
  {
    make: 'Toyota',
    model: 'Camry',
    year: 2022,
    trim: 'XSE',
    vin: '1HGCM82633A123456',
    stockNumber: 'TC22-001',
    condition: 'new',
    exteriorColor: 'Midnight Black',
    interiorColor: 'Black',
    mileage: 15,
    price: 32999,
    msrp: 35000,
    transmission: 'automatic',
    drivetrain: 'fwd',
    engine: '2.5L 4-Cylinder',
    fuelType: 'gasoline',
    mpg: {
      city: 28,
      highway: 39
    },
    features: ['Bluetooth', 'Backup Camera', 'Sunroof', 'Navigation'],
    description: 'Beautiful new Toyota Camry with all the features you need!',
    images: [
      {
        url: 'https://example.com/images/camry1.jpg',
        isPrimary: true
      },
      {
        url: 'https://example.com/images/camry2.jpg',
        isPrimary: false
      }
    ],
    status: 'available',
    location: 'Main Lot'
  },
  {
    make: 'Honda',
    model: 'Accord',
    year: 2021,
    trim: 'Sport',
    vin: '1HGCV1F34MA123789',
    stockNumber: 'HA21-002',
    condition: 'used',
    exteriorColor: 'Modern Steel',
    interiorColor: 'Black',
    mileage: 12500,
    price: 27999,
    msrp: 32000,
    transmission: 'automatic',
    drivetrain: 'fwd',
    engine: '1.5L Turbo 4-Cylinder',
    fuelType: 'gasoline',
    mpg: {
      city: 30,
      highway: 38
    },
    features: ['Apple CarPlay', 'Android Auto', 'Heated Seats', 'Lane Assist'],
    description: 'Low mileage Honda Accord in excellent condition!',
    images: [
      {
        url: 'https://example.com/images/accord1.jpg',
        isPrimary: true
      },
      {
        url: 'https://example.com/images/accord2.jpg',
        isPrimary: false
      }
    ],
    status: 'available',
    location: 'Main Lot'
  },
  {
    make: 'Ford',
    model: 'F-150',
    year: 2020,
    trim: 'Lariat',
    vin: '1FTEW1E53LFA98765',
    stockNumber: 'FF20-003',
    condition: 'used',
    exteriorColor: 'Oxford White',
    interiorColor: 'Tan',
    mileage: 28750,
    price: 42999,
    msrp: 52000,
    transmission: 'automatic',
    drivetrain: '4wd',
    engine: '5.0L V8',
    fuelType: 'gasoline',
    mpg: {
      city: 17,
      highway: 23
    },
    features: ['Leather Seats', 'Towing Package', 'Bed Liner', 'Navigation'],
    description: 'Powerful Ford F-150 with 4WD and all the features you need for work or play!',
    images: [
      {
        url: 'https://example.com/images/f150-1.jpg',
        isPrimary: true
      },
      {
        url: 'https://example.com/images/f150-2.jpg',
        isPrimary: false
      }
    ],
    status: 'available',
    location: 'Truck Lot'
  }
];

const templates = [
  {
    name: 'Welcome Email',
    type: 'email',
    subject: 'Welcome to Our Dealership!',
    content: `
      <p>Hello {{lead.firstName}},</p>
      <p>Thank you for your interest in our dealership. We're excited to help you find the perfect vehicle!</p>
      <p>Your dedicated sales representative will be in touch with you shortly to discuss your needs and preferences.</p>
      <p>In the meantime, feel free to browse our inventory on our website or visit our showroom.</p>
      <p>Best regards,</p>
      <p>The Sales Team</p>
    `,
    isGlobal: true
  },
  {
    name: 'Appointment Confirmation',
    type: 'email',
    subject: 'Your Appointment Confirmation',
    content: `
      <p>Hello {{lead.firstName}},</p>
      <p>This email confirms your appointment at our dealership on {{appointment.date}} at {{appointment.time}}.</p>
      <p>If you need to reschedule or have any questions, please don't hesitate to contact us.</p>
      <p>We look forward to seeing you!</p>
      <p>Best regards,</p>
      <p>The Sales Team</p>
    `,
    isGlobal: true
  },
  {
    name: 'Welcome SMS',
    type: 'sms',
    content: `Hi {{lead.firstName}}! Thank you for your interest in our dealership. Your sales rep will contact you shortly. Reply STOP to opt out.`,
    isGlobal: true
  },
  {
    name: 'Appointment Reminder',
    type: 'sms',
    content: `Reminder: You have an appointment at our dealership tomorrow at {{appointment.time}}. Reply C to confirm or R to reschedule.`,
    isGlobal: true
  }
];

// Seed database
const seedDatabase = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Lead.deleteMany({});
    await Vehicle.deleteMany({});
    await Template.deleteMany({});

    console.log('Database cleared');

    // Create users
    const createdUsers = [];
    for (const user of users) {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(user.password, salt);

      const newUser = new User({
        ...user,
        password: hashedPassword
      });

      const savedUser = await newUser.save();
      createdUsers.push(savedUser);
      console.log(`User created: ${savedUser.name}`);
    }

    // Create leads
    for (const lead of leads) {
      // Assign to a random agent or manager
      const assignableUsers = createdUsers.filter(user => 
        user.role === 'agent' || user.role === 'manager'
      );
      const randomUser = assignableUsers[Math.floor(Math.random() * assignableUsers.length)];

      const newLead = new Lead({
        ...lead,
        assignedTo: randomUser._id,
        notes: [
          {
            text: 'Initial contact made',
            createdBy: randomUser._id
          }
        ]
      });

      const savedLead = await newLead.save();
      console.log(`Lead created: ${savedLead.firstName} ${savedLead.lastName}`);
    }

    // Create vehicles
    for (const vehicle of vehicles) {
      const newVehicle = new Vehicle(vehicle);
      const savedVehicle = await newVehicle.save();
      console.log(`Vehicle created: ${savedVehicle.year} ${savedVehicle.make} ${savedVehicle.model}`);
    }

    // Create templates
    for (const template of templates) {
      // Assign to admin user
      const adminUser = createdUsers.find(user => user.role === 'admin');

      const newTemplate = new Template({
        ...template,
        createdBy: adminUser._id
      });

      const savedTemplate = await newTemplate.save();
      console.log(`Template created: ${savedTemplate.name}`);
    }

    console.log('Database seeded successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();
