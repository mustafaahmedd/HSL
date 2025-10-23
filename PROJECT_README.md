# Hikmah Institute Cricket Auction Application

A full-stack auction application built with Next.js 14, TypeScript, MongoDB, and Tailwind CSS.

## Features

### Public Features
- **Tournament View**: View all current and upcoming tournaments
- **Player Registration**: Register for tournaments with detailed information
- **Photo Upload**: Players can upload their photos during registration

### Admin Features
- **Secure Authentication**: JWT-based admin login system
- **Player Management**: Review and override player types, categories, and roles
- **Tournament Setup**: Create and manage tournaments
- **Team Configuration**: Create teams with owners and budgets
- **Live Auction Control**: 
  - Select categories for auction
  - View randomized player queue
  - Enter bids with automatic validation
  - Track team budgets and squad caps
  - View transaction history

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or cloud instance)

### Installation

1. Clone the repository:
```bash
cd hikmah-auction
```

2. Install dependencies:
```bash
npm install
```

3. Update environment variables in `.env.local`:
```env
MONGODB_URI=mongodb://localhost:27017/hikmah-auction
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
JWT_SECRET=your-secret-key-here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Usage Guide

### For Players
1. Visit the home page to see available tournaments
2. Click "Register Now" on any tournament in registration phase
3. Fill out the registration form with your details
4. Upload your photo
5. Submit the form

### For Admins

#### Initial Setup
1. Click "Admin Login" on the home page
2. Login with credentials (default: admin/admin123)
3. Create a tournament from the dashboard
4. Create teams with owners and budgets
5. Review registered players and assign types/categories

#### Running an Auction
1. Navigate to "Auction Control" from the admin dashboard
2. Select the tournament and category to auction
3. Players will appear in randomized order
4. For each player:
   - Review their details and minimum bid
   - Select the winning team
   - Enter the final bid amount
   - Click "Confirm Sale"
5. The system automatically:
   - Updates team budgets
   - Checks squad cap constraints
   - Assigns the player to the team
   - Tracks all transactions

### Tournament Configuration

When creating a tournament, you can set:
- **Minimum Bids by Category**: Set different minimum bid amounts for each category
- **Squad Caps by Category**: Limit how many players of each category a team can buy

Example configuration:
```javascript
minBidByCategory: {
  "Platinum": 500,
  "Diamond": 300,
  "Gold": 100
}

squadCapByCategory: {
  "Platinum": 2,  // Max 2 Platinum players per team
  "Diamond": 3,   // Max 3 Diamond players per team
  "Gold": 5       // Max 5 Gold players per team
}
```

## API Endpoints

### Public Endpoints
- `POST /api/register` - Player registration
- `GET /api/admin/config` - Get tournaments (public view)

### Admin Endpoints (Authentication Required)
- `POST /api/auth/login` - Admin login
- `PUT /api/admin/config` - Update tournament configuration
- `POST /api/admin/config` - Create tournament/team
- `PUT /api/admin/players/[id]` - Update player details
- `GET /api/auction/queue?category=X` - Get randomized player queue
- `POST /api/auction/bid` - Process a bid

## Data Models

### Tournament
- Status: registration, setup, live, completed
- Minimum bid configuration by category
- Squad cap configuration by category

### Player
- Registration details (name, contact, etc.)
- Self-assigned category
- Admin-overridden type and category
- Auction status and bid price
- Team assignment

### Team
- Owner and captain
- Total budget and spending tracking
- Player roster
- Squad constraints

## Security
- Admin routes are protected with JWT authentication
- Environment variables for sensitive configuration
- Input validation on all forms
- Constraint checking during auction

## Future Enhancements
- Real-time updates using WebSockets
- Cloud storage for player photos
- Export functionality for team rosters
- Mobile app support
- Multi-tournament support
