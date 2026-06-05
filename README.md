# AI Therapist Chatbot

A simple, student-level full-stack AI Therapist Chatbot application providing mental health support through AI-powered conversations.

## 🌟 Key Features

### 🤖 AI Therapy System
- AI-powered chat conversations for mental health support
- Chat history storage and retrieval
- Session management (create, view, complete therapy sessions)
- Real-time conversation with AI therapist

### � Authentication
- JWT-based secure authentication
- User registration and login
- Protected API routes
- Password hashing with bcrypt

### 📊 Mood Tracking
- Daily mood entry logging
- Mood trend analysis
- Emotion tracking over time

### 🧘 Mindfulness Activities
- Breathing exercises
- Meditation activities
- Activity logging and statistics

### 🤖 Optional ML Features
- Sentiment analysis integration (Flask service)
- Crisis detection support
- Therapeutic technique recommendations

## 🛠 Tech Stack

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components

### Backend
- **Node.js + Express** - API server
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Optional ML Service
- **Python Flask** - ML service for sentiment analysis
- **ML models** - Sentiment analysis and crisis detection

## 📁 Project Structure

```
ai-therapist-agent-main/
├── app/                      # Next.js frontend
│   ├── api/                 # API routes
│   ├── dashboard/           # Dashboard pages
│   ├── therapy/             # Therapy chat pages
│   ├── login/               # Login page
│   ├── signup/              # Signup page
│   └── layout.tsx           # Root layout
├── backend/                 # Express backend
│   ├── config/             # Database configuration
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Auth & error handling
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── utils/              # Utility functions
│   └── server.js           # Main server file
├── components/             # React components
└── package.json            # Frontend dependencies
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-therapist-agent-main
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

4. **Configure environment variables**

   Create `.env` file in the backend directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/ai-therapist
   JWT_SECRET=your-secret-key-here
   ML_SERVICE_URL=http://localhost:8000
   ```

5. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   ```

6. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```
   Backend will run on `http://localhost:5000`

7. **Start the frontend development server**
   ```bash
   # From root directory
   npm run dev
   ```
   Frontend will run on `http://localhost:3000`

### Optional: ML Service Setup

If you want to use sentiment analysis features:

1. **Set up Python Flask service**
   ```bash
   cd ml-service
   pip install -r requirements.txt
   python app.py
   ```
   ML service will run on `http://localhost:8000`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Chat Sessions
- `POST /api/chat/sessions` - Create new session (protected)
- `GET /api/chat/sessions` - Get all sessions (protected)
- `GET /api/chat/sessions/:id` - Get specific session (protected)
- `POST /api/chat/sessions/:id/messages` - Send message (protected)
- `GET /api/chat/sessions/:id/history` - Get chat history (protected)
- `DELETE /api/chat/sessions/:id` - Delete session (protected)

### Mood Tracking
- `POST /api/mood` - Create mood entry (protected)
- `GET /api/mood` - Get all mood entries (protected)
- `GET /api/mood/trend` - Get mood trend (protected)

### Activities
- `POST /api/activity` - Log activity (protected)
- `GET /api/activity` - Get all activities (protected)
- `GET /api/activity/stats` - Get activity stats (protected)

## �️ Database Models

### User
- name, email, password (hashed)
- createdAt, updatedAt

### ChatSession
- userId, title, status, summary
- messages array
- createdAt, updatedAt

### Message
- role (user/assistant), content
- timestamp, metadata

### Mood
- userId, score (0-100), emotion
- notes, timestamp

### Activity
- userId, type, duration
- completed, timestamp

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token authentication
- Protected routes middleware
- CORS configuration
- Input validation

## 📝 Environment Variables

### Backend (.env)
- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `ML_SERVICE_URL` - ML service URL (optional)

### Frontend (.env.local)
- `NEXT_PUBLIC_API_URL` - Backend API URL

## 🤝 Contributing

This is a student-level project. Contributions are welcome for:
- Bug fixes
- Feature improvements
- Documentation updates
- Code refactoring

## 📄 License

MIT License

---

Built with ❤️ for better mental health support
