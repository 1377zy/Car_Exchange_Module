/**
 * Seed Mock Database
 * This script populates the mock database with initial data for development
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
  console.log('Created data directory for mock database');
}

// Helper function to write data to a file
const writeData = (collection, data) => {
  const filePath = path.join(dataDir, `${collection}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`Seeded ${data.length} records to ${collection}`);
};

// Generate a hashed password
const generateHashedPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Seed users
const seedUsers = async () => {
  const adminPassword = await generateHashedPassword('admin123');
  const managerPassword = await generateHashedPassword('manager123');
  const agentPassword = await generateHashedPassword('agent123');
  
  const users = [
    {
      _id: 'user_admin_001',
      name: 'Admin User',
      email: 'admin@carexchange.com',
      password: adminPassword,
      role: 'admin',
      phone: '555-123-4567',
      department: 'Administration',
      isActive: true,
      lastActive: new Date(),
      date: new Date()
    },
    {
      _id: 'user_manager_001',
      name: 'Manager User',
      email: 'manager@carexchange.com',
      password: managerPassword,
      role: 'manager',
      phone: '555-234-5678',
      department: 'Sales',
      isActive: true,
      lastActive: new Date(),
      date: new Date()
    },
    {
      _id: 'user_agent_001',
      name: 'Agent User',
      email: 'agent@carexchange.com',
      password: agentPassword,
      role: 'agent',
      phone: '555-345-6789',
      department: 'Sales',
      isActive: true,
      lastActive: new Date(),
      date: new Date()
    }
  ];
  
  writeData('user', users);
};

// Seed vehicles
const seedVehicles = () => {
  const vehicles = [
    {
      _id: 'vehicle_001',
      make: 'Toyota',
      model: 'Camry',
      year: 2022,
      trim: 'XSE',
      price: 28500,
      mileage: 12500,
      exteriorColor: 'Midnight Black',
      interiorColor: 'Black',
      vin: 'ABC123XYZ456789',
      stockNumber: 'T12345',
      fuelType: 'Gasoline',
      transmission: 'Automatic',
      engine: '2.5L 4-Cylinder',
      description: 'Well-maintained Toyota Camry with low mileage.',
      features: ['Bluetooth', 'Backup Camera', 'Leather Seats', 'Sunroof'],
      status: 'available',
      images: [
        'https://example.com/images/camry1.jpg',
        'https://example.com/images/camry2.jpg'
      ],
      createdBy: 'user_admin_001',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: 'vehicle_002',
      make: 'Honda',
      model: 'Accord',
      year: 2021,
      trim: 'Sport',
      price: 26800,
      mileage: 18000,
      exteriorColor: 'Crystal White',
      interiorColor: 'Gray',
      vin: 'DEF456UVW789012',
      stockNumber: 'H54321',
      fuelType: 'Gasoline',
      transmission: 'Automatic',
      engine: '1.5L Turbo 4-Cylinder',
      description: 'Sporty Honda Accord with excellent fuel economy.',
      features: ['Apple CarPlay', 'Android Auto', 'Heated Seats', 'Lane Assist'],
      status: 'available',
      images: [
        'https://example.com/images/accord1.jpg',
        'https://example.com/images/accord2.jpg'
      ],
      createdBy: 'user_manager_001',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: 'vehicle_003',
      make: 'Ford',
      model: 'F-150',
      year: 2020,
      trim: 'XLT',
      price: 35900,
      mileage: 25000,
      exteriorColor: 'Race Red',
      interiorColor: 'Black',
      vin: 'GHI789RST012345',
      stockNumber: 'F98765',
      fuelType: 'Gasoline',
      transmission: 'Automatic',
      engine: '3.5L V6 EcoBoost',
      description: 'Powerful Ford F-150 with towing package.',
      features: ['4WD', 'Towing Package', 'Bed Liner', 'Navigation'],
      status: 'available',
      images: [
        'https://example.com/images/f150_1.jpg',
        'https://example.com/images/f150_2.jpg'
      ],
      createdBy: 'user_agent_001',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  
  writeData('vehicle', vehicles);
};

// Seed leads
const seedLeads = () => {
  const leads = [
    {
      _id: 'lead_001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '555-111-2222',
      source: 'Website',
      status: 'new',
      assignedTo: 'user_agent_001',
      notes: 'Interested in Toyota Camry',
      vehicleInterests: ['vehicle_001'],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: 'lead_002',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      phone: '555-333-4444',
      source: 'Phone Call',
      status: 'contacted',
      assignedTo: 'user_agent_001',
      notes: 'Looking for a family SUV',
      vehicleInterests: [],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: 'lead_003',
      firstName: 'Robert',
      lastName: 'Johnson',
      email: 'robert.johnson@example.com',
      phone: '555-555-6666',
      source: 'Referral',
      status: 'qualified',
      assignedTo: 'user_manager_001',
      notes: 'Interested in Ford F-150, has trade-in',
      vehicleInterests: ['vehicle_003'],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  
  writeData('lead', leads);
};

// Seed appointments
const seedAppointments = () => {
  const appointments = [
    {
      _id: 'appointment_001',
      lead: 'lead_001',
      vehicle: 'vehicle_001',
      type: 'test_drive',
      date: new Date(Date.now() + 86400000), // Tomorrow
      status: 'scheduled',
      notes: 'Test drive for Toyota Camry',
      assignedTo: 'user_agent_001',
      createdBy: 'user_agent_001',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: 'appointment_002',
      lead: 'lead_003',
      vehicle: 'vehicle_003',
      type: 'sales_consultation',
      date: new Date(Date.now() + 172800000), // Day after tomorrow
      status: 'scheduled',
      notes: 'Discuss financing options for F-150',
      assignedTo: 'user_manager_001',
      createdBy: 'user_manager_001',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  
  writeData('appointment', appointments);
};

// Seed communications
const seedCommunications = () => {
  const communications = [
    {
      _id: 'communication_001',
      lead: 'lead_001',
      type: 'email',
      direction: 'outbound',
      subject: 'Toyota Camry Information',
      content: 'Thank you for your interest in the Toyota Camry. Here are the details you requested...',
      sentBy: 'user_agent_001',
      sentAt: new Date(Date.now() - 86400000), // Yesterday
      status: 'sent',
      createdAt: new Date(Date.now() - 86400000),
      updatedAt: new Date(Date.now() - 86400000)
    },
    {
      _id: 'communication_002',
      lead: 'lead_001',
      type: 'email',
      direction: 'inbound',
      subject: 'Re: Toyota Camry Information',
      content: 'Thank you for the information. I would like to schedule a test drive...',
      receivedAt: new Date(Date.now() - 43200000), // 12 hours ago
      status: 'read',
      createdAt: new Date(Date.now() - 43200000),
      updatedAt: new Date(Date.now() - 43200000)
    },
    {
      _id: 'communication_003',
      lead: 'lead_003',
      type: 'sms',
      direction: 'outbound',
      content: 'Hi Robert, just confirming your appointment tomorrow at 2 PM to discuss the Ford F-150.',
      sentBy: 'user_manager_001',
      sentAt: new Date(Date.now() - 3600000), // 1 hour ago
      status: 'sent',
      createdAt: new Date(Date.now() - 3600000),
      updatedAt: new Date(Date.now() - 3600000)
    }
  ];
  
  writeData('communication', communications);
};

// Seed notifications
const seedNotifications = () => {
  const notifications = [
    {
      _id: 'notification_001',
      user: 'user_agent_001',
      type: 'lead',
      title: 'New Lead Assigned',
      message: 'You have been assigned a new lead: John Doe',
      priority: 'high',
      link: '/leads/lead_001',
      read: false,
      createdAt: new Date(Date.now() - 86400000) // Yesterday
    },
    {
      _id: 'notification_002',
      user: 'user_agent_001',
      type: 'communication',
      title: 'New Email Received',
      message: 'John Doe has replied to your email',
      priority: 'medium',
      link: '/communications/communication_002',
      read: true,
      createdAt: new Date(Date.now() - 43200000) // 12 hours ago
    },
    {
      _id: 'notification_003',
      user: 'user_manager_001',
      type: 'appointment',
      title: 'Upcoming Appointment',
      message: 'You have an appointment with Robert Johnson tomorrow at 2 PM',
      priority: 'medium',
      link: '/appointments/appointment_002',
      read: false,
      createdAt: new Date(Date.now() - 3600000) // 1 hour ago
    }
  ];
  
  writeData('notification', notifications);
};

// Seed vehicle interests
const seedVehicleInterests = () => {
  const vehicleInterests = [
    {
      _id: 'vehicleInterest_001',
      lead: 'lead_001',
      vehicle: 'vehicle_001',
      interestLevel: 'high',
      notes: 'Very interested in the Camry, scheduled test drive',
      createdBy: 'user_agent_001',
      createdAt: new Date(Date.now() - 86400000), // Yesterday
      updatedAt: new Date(Date.now() - 86400000)
    },
    {
      _id: 'vehicleInterest_002',
      lead: 'lead_003',
      vehicle: 'vehicle_003',
      interestLevel: 'medium',
      notes: 'Interested in the F-150, but concerned about price',
      createdBy: 'user_manager_001',
      createdAt: new Date(Date.now() - 172800000), // 2 days ago
      updatedAt: new Date(Date.now() - 172800000)
    }
  ];
  
  writeData('vehicleInterest', vehicleInterests);
};

// Seed templates
const seedTemplates = () => {
  const templates = [
    {
      _id: 'template_001',
      name: 'New Lead Welcome',
      type: 'email',
      subject: 'Welcome to Car Exchange',
      content: 'Dear {{lead.firstName}},\n\nThank you for your interest in our dealership. We are excited to help you find your perfect vehicle.\n\nBest regards,\n{{user.name}}',
      createdBy: 'user_admin_001',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: 'template_002',
      name: 'Appointment Confirmation',
      type: 'email',
      subject: 'Your Appointment Confirmation',
      content: 'Dear {{lead.firstName}},\n\nThis is to confirm your appointment on {{appointment.date}} for a {{appointment.type}}.\n\nWe look forward to seeing you!\n\nBest regards,\n{{user.name}}',
      createdBy: 'user_admin_001',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: 'template_003',
      name: 'Appointment Reminder',
      type: 'sms',
      content: 'Hi {{lead.firstName}}, just a reminder about your appointment tomorrow at {{appointment.time}} for your {{appointment.type}}. Reply Y to confirm or call us to reschedule.',
      createdBy: 'user_admin_001',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  
  writeData('template', templates);
};

// Run all seed functions
const seedAll = async () => {
  try {
    await seedUsers();
    seedVehicles();
    seedLeads();
    seedAppointments();
    seedCommunications();
    seedNotifications();
    seedVehicleInterests();
    seedTemplates();
    
    console.log('All mock data has been seeded successfully!');
  } catch (err) {
    console.error('Error seeding mock data:', err);
  }
};

// Execute the seeding
seedAll();
