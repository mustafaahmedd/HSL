import dbConnect from '../src/lib/mongodb.js';
import Event from '../src/models/Event.js';

const sampleEvents = [
  {
    name: 'Winter Cricket Championship 2024',
    description: 'Join us for an exciting cricket tournament featuring teams from across the university. This championship brings together the best cricket talent for competitive matches, team building, and sportsmanship.',
    eventType: 'tournament',
    status: 'upcoming',
    startDate: new Date('2024-02-15T09:00:00Z'),
    endDate: new Date('2024-02-18T18:00:00Z'),
    venue: 'Hikmah University Cricket Ground',
    registrationType: 'team',
    pricePerPerson: 0,
    pricePerTeam: 2000,
    amenities: ['Refreshments', 'Equipment', 'Transport', 'Certificates'],
    facilities: ['Cricket Ground', 'Changing Rooms', 'First Aid', 'Scoreboard'],
    maxParticipants: 80,
    minParticipants: 2,
    images: [
      {
        url: '/api/placeholder/400/300',
        caption: 'Cricket Championship Action',
        isPrimary: true
      }
    ],
    totalParticipants: 0,
    totalRevenue: 0,
    organizer: 'Hikmah Sports Committee',
    contactInfo: {
      email: 'sports@hikmah.edu.pk',
      phone: '+92-300-1234567',
      whatsapp: '+92-300-1234567'
    },
    tags: ['Sports', 'Cricket', 'Competition', 'Team Building'],
    isPublished: true
  },
  {
    name: 'Cultural Night 2024',
    description: 'Experience the rich diversity of our university community through music, dance, drama, and cultural performances. A night of celebration, creativity, and cultural exchange.',
    eventType: 'event',
    status: 'upcoming',
    startDate: new Date('2024-03-10T18:00:00Z'),
    endDate: new Date('2024-03-10T23:00:00Z'),
    venue: 'Hikmah University Auditorium',
    registrationType: 'individual',
    pricePerPerson: 500,
    pricePerTeam: 0,
    amenities: ['Dinner', 'Cultural Performances', 'Photography', 'Certificates'],
    facilities: ['Auditorium', 'Sound System', 'Lighting', 'Backstage Area'],
    maxParticipants: 200,
    minParticipants: 1,
    images: [
      {
        url: '/api/placeholder/400/300',
        caption: 'Cultural Night Performance',
        isPrimary: true
      }
    ],
    totalParticipants: 0,
    totalRevenue: 0,
    organizer: 'Hikmah Cultural Society',
    contactInfo: {
      email: 'cultural@hikmah.edu.pk',
      phone: '+92-300-2345678',
      whatsapp: '+92-300-2345678'
    },
    tags: ['Culture', 'Music', 'Dance', 'Community'],
    isPublished: true
  },
  {
    name: 'Tech Innovation Hackathon',
    description: 'A 48-hour coding marathon where students collaborate to build innovative solutions for real-world problems. Perfect for tech enthusiasts and aspiring developers.',
    eventType: 'competition',
    status: 'upcoming',
    startDate: new Date('2024-03-20T08:00:00Z'),
    endDate: new Date('2024-03-22T18:00:00Z'),
    venue: 'Hikmah University Computer Lab',
    registrationType: 'team',
    pricePerPerson: 0,
    pricePerTeam: 1000,
    amenities: ['Meals', 'Snacks', 'Coffee', 'Mentorship', 'Prizes'],
    facilities: ['Computer Lab', 'High-Speed Internet', 'Projector', 'Workspace'],
    maxParticipants: 60,
    minParticipants: 2,
    images: [
      {
        url: '/api/placeholder/400/300',
        caption: 'Hackathon Coding Session',
        isPrimary: true
      }
    ],
    totalParticipants: 0,
    totalRevenue: 0,
    organizer: 'Hikmah Computer Science Department',
    contactInfo: {
      email: 'cs@hikmah.edu.pk',
      phone: '+92-300-3456789',
      whatsapp: '+92-300-3456789'
    },
    tags: ['Technology', 'Programming', 'Innovation', 'Competition'],
    isPublished: true
  },
  {
    name: 'Outdoor Adventure Camp',
    description: 'Join us for an exciting outdoor adventure including hiking, team building activities, and nature exploration. Perfect for adventure enthusiasts and those looking to step out of their comfort zone.',
    eventType: 'activity',
    status: 'upcoming',
    startDate: new Date('2024-04-05T07:00:00Z'),
    endDate: new Date('2024-04-07T17:00:00Z'),
    venue: 'Margalla Hills National Park',
    registrationType: 'individual',
    pricePerPerson: 1500,
    pricePerTeam: 0,
    amenities: ['Transport', 'Camping Equipment', 'Meals', 'Guide', 'Safety Gear'],
    facilities: ['Camping Site', 'Hiking Trails', 'Rest Areas', 'Emergency Services'],
    maxParticipants: 40,
    minParticipants: 1,
    images: [
      {
        url: '/api/placeholder/400/300',
        caption: 'Adventure Camp Hiking',
        isPrimary: true
      }
    ],
    totalParticipants: 0,
    totalRevenue: 0,
    organizer: 'Hikmah Adventure Club',
    contactInfo: {
      email: 'adventure@hikmah.edu.pk',
      phone: '+92-300-4567890',
      whatsapp: '+92-300-4567890'
    },
    tags: ['Adventure', 'Outdoor', 'Hiking', 'Nature'],
    isPublished: true
  },
  {
    name: 'Academic Quiz Competition',
    description: 'Test your knowledge across various subjects in this exciting quiz competition. Categories include Science, Literature, History, and Current Affairs.',
    eventType: 'competition',
    status: 'upcoming',
    startDate: new Date('2024-04-15T14:00:00Z'),
    endDate: new Date('2024-04-15T18:00:00Z'),
    venue: 'Hikmah University Conference Hall',
    registrationType: 'both',
    pricePerPerson: 200,
    pricePerTeam: 800,
    amenities: ['Refreshments', 'Certificates', 'Prizes', 'Study Materials'],
    facilities: ['Conference Hall', 'Audio-Visual Equipment', 'Seating', 'Registration Desk'],
    maxParticipants: 100,
    minParticipants: 1,
    images: [
      {
        url: '/api/placeholder/400/300',
        caption: 'Quiz Competition in Progress',
        isPrimary: true
      }
    ],
    totalParticipants: 0,
    totalRevenue: 0,
    organizer: 'Hikmah Academic Society',
    contactInfo: {
      email: 'academic@hikmah.edu.pk',
      phone: '+92-300-5678901',
      whatsapp: '+92-300-5678901'
    },
    tags: ['Academic', 'Quiz', 'Knowledge', 'Competition'],
    isPublished: true
  },
  {
    name: 'Summer Football League 2023',
    description: 'Our annual football league featuring teams from different departments. Experience the thrill of competitive football with professional referees and exciting matches.',
    eventType: 'tournament',
    status: 'completed',
    startDate: new Date('2023-08-01T09:00:00Z'),
    endDate: new Date('2023-08-15T18:00:00Z'),
    venue: 'Hikmah University Football Ground',
    registrationType: 'team',
    pricePerPerson: 0,
    pricePerTeam: 1500,
    amenities: ['Refreshments', 'Equipment', 'Transport', 'Trophies'],
    facilities: ['Football Ground', 'Changing Rooms', 'First Aid', 'Scoreboard'],
    maxParticipants: 64,
    minParticipants: 2,
    images: [
      {
        url: '/api/placeholder/400/300',
        caption: 'Football League Final Match',
        isPrimary: true
      }
    ],
    totalParticipants: 64,
    totalRevenue: 24000,
    organizer: 'Hikmah Sports Committee',
    contactInfo: {
      email: 'sports@hikmah.edu.pk',
      phone: '+92-300-1234567',
      whatsapp: '+92-300-1234567'
    },
    tags: ['Sports', 'Football', 'Competition', 'Team Building'],
    isPublished: true
  }
];

async function createSampleEvents() {
  try {
    await dbConnect();
    console.log('Connected to MongoDB');

    // Clear existing events
    await Event.deleteMany({});
    console.log('Cleared existing events');

    // Create sample events
    const createdEvents = await Event.insertMany(sampleEvents);
    console.log(`Created ${createdEvents.length} sample events`);

    console.log('Sample events created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating sample events:', error);
    process.exit(1);
  }
}

createSampleEvents();
