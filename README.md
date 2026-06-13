<h1 align="center">⚡ SkillBrix</h1>

<p align="center"><b>Find the nearest worker for every small problem — plumbing, electrical, tutoring & more.</b></p>

<p align="center">
  🏆 College Hackathon Project
</p>

---

## About

**SkillBrix** is a location-aware marketplace that connects clients with nearby skilled workers for everyday repairs and services — from fixing a leaky pipe to tutoring math. Workers bid on posted jobs, and an **AI-powered ranking engine** scores each bid across skill match, location proximity, reputation, price competitiveness, and performance history to recommend the best worker for every job.

---

## Features

### For Clients
- Post jobs with description, budget, and location
- Receive and compare AI-ranked bids from workers
- View detailed score breakdowns (skill match, location, reputation, price, performance)
- Hire workers and manage orders
- Secure payments via **Razorpay**

### For Workers
- Register with skills, location, and portfolio
- Browse location-matched job recommendations
- Place bids with estimated time and proposal
- Build reputation through ratings and completed jobs
- Real-time chat with clients

### AI Worker Ranking
The ranking engine (`server/utils/workerRanking.js`) evaluates bids on five weighted dimensions:

| Factor | Weight | Description |
|--------|--------|-------------|
| Performance Score | 30% | On-time delivery, completed jobs, response time, acceptance rate |
| Reputation Score | 25% | Rating, reliability score, review count |
| Skill Match Score | 20% | Canonical skill matching with alias resolution |
| Price Score | 15% | Competitiveness relative to lowest bid |
| Location Score | 10% | City/state proximity & token overlap |

### Location-Based Job Allocation
Workers see jobs relevant to their area via `server/utils/locationAllocation.js`, which parses location strings (supporting city, state, and aliases like "dl" → "delhi", "ncr" → "delhi") and scores proximity.

### Categories Supported
Plumbing · Electrical · Carpentry · Tutoring · Graphic Design · Content Writing · Technical Help · Delivery & Errands · Cleaning & Organizing · Event Support · Home Repairs

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, React Router v6, TanStack React Query, Axios |
| **Backend** | Node.js, Express.js, JWT Authentication |
| **Database** | MongoDB, Mongoose |
| **Payments** | Razorpay |
| **UI** | CSS |

---

## Project Structure

```
skillbrix/
├── frontend/                 # React client
│   ├── public/
│   └── src/
│       ├── components/       # Navbar, Footer, GigCard, CatCard, RankedWorkers, CheckoutForm, etc.
│       ├── pages/            # Home, Gigs, Gig, MyGigs, Orders, Messages, Login, Register, Pay, etc.
│       ├── styles/           # CSS modules
│       ├── utils/            # newRequest, gigReducer, AutoLogout, voiceParser, categoryMedia
│       ├── App.js
│       └── data.js           # Category/project seed data
│
├── server/                   # Express API
│   ├── controllers/          # auth, user, gig, job, bid, order, conversation, message, review
│   ├── models/               # User, Gig, Bid, Order, Conversation, Message, Review
│   ├── routes/               # RESTful route definitions
│   ├── middleware/           # JWT verification
│   ├── utils/                # workerRanking.js, locationAllocation.js, voiceParser.js
│   └── server.js             # Entry point, MongoDB connection, route registration
│
├── package.json
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js ≥ 16
- MongoDB instance (local or Atlas)
- Razorpay account (for payments)

### Environment Variables

Create `server/.env`:

```
MONGO=<your-mongodb-connection-string>
JWT_KEY=<your-jwt-secret>
RAZORPAY_KEY_ID=<your-razorpay-key>
RAZORPAY_KEY_SECRET=<your-razorpay-secret>
```

### Installation

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../frontend
npm install
```

### Run Locally

```bash
# Start backend (with nodemon)
cd server
npm start

# Start frontend (in a separate terminal)
cd frontend
npm start
```

Backend runs on `http://localhost:8800`, frontend on `http://localhost:3000`.

---

## API Routes

| Prefix | Endpoints |
|--------|-----------|
| `/api/auth` | Register, Login, Logout |
| `/api/users` | User profile, skills, location |
| `/api/gigs` | Gig CRUD, search, filter by category |
| `/api/jobs` | Job posting, location-based allocation |
| `/api/bids` | Bid creation, AI ranking |
| `/api/orders` | Order management |
| `/api/conversations` | Chat conversation threads |
| `/api/messages` | Real-time messaging |

---

## Screenshots

*(Add screenshots of your app here)*

---

## Team

Built with ❤️ for the college hackathon.
