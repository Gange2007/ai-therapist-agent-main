# AI Therapist Backend API

Complete Node.js + Express backend for the AI Therapist Agent project.

## Features

- **JWT Authentication**: Secure token-based authentication with bcrypt password hashing
- **REST API Architecture**: Clean, scalable API design
- **MongoDB Integration**: Mongoose ODM for database operations
- **Chat Session Management**: Create, manage, and delete therapy chat sessions
- **Message History**: Store and retrieve chat messages with metadata
- **Mood Tracking**: Track user mood entries with trend analysis
- **Activity Logging**: Log therapeutic activities with statistics
- **ML Service Integration**: Connects to Python ML service for sentiment analysis and crisis detection
- **Error Handling**: Comprehensive error handling middleware
- **Environment Variables**: Secure configuration management

## Project Structure

```
backend-new/
├── config/
│   └── database.js          # MongoDB connection configuration
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── chatController.js    # Chat session management
│   ├── moodController.js    # Mood tracking logic
│   └── activityController.js # Activity logging logic
├── middleware/
│   ├── auth.js              # JWT authentication middleware
│   ├── errorHandler.js      # Error handling middleware
│   └── asyncHandler.js      # Async error wrapper
├── models/
│   ├── User.js              # User model with bcrypt hashing
│   ├── ChatSession.js       # Chat session model
│   ├── Message.js           # Message model
│   ├── Mood.js              # Mood entry model
│   └── Activity.js          # Activity model
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── chat.js              # Chat session routes
│   ├── mood.js              # Mood tracking routes
│   └── activity.js          # Activity logging routes
├── utils/
│   └── mlService.js         # ML service integration helper
├── server.js                # Main server file
├── package.json             # Dependencies
└── env.example              # Environment variables template
```

## Installation

1. **Install dependencies:**
   ```bash
   cd backend-new
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp env.example .env
   ```
   Edit `.env` with your configuration:
   - `MONGODB_URI`: MongoDB connection string
   - `JWT_SECRET`: Secret key for JWT tokens
   - `ML_SERVICE_URL`: URL of the Python ML service

3. **Start MongoDB:**
   Make sure MongoDB is running on your system or update `MONGODB_URI` with your MongoDB Atlas connection string.

4. **Start the server:**
   ```bash
   # Development mode with nodemon
   npm run dev

   # Production mode
   npm start
   ```

The server will start on port 5000 (or the port specified in `.env`).

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get user profile (protected)
- `PUT /api/auth/update-profile` - Update user profile (protected)

### Chat Sessions

- `POST /api/chat/sessions` - Create a new chat session (protected)
- `GET /api/chat/sessions` - Get all user's chat sessions (protected)
- `GET /api/chat/sessions/:id` - Get a specific chat session (protected)
- `POST /api/chat/sessions/:id/messages` - Send a message in a session (protected)
- `GET /api/chat/sessions/:id/history` - Get chat history for a session (protected)
- `POST /api/chat/sessions/:id/complete` - Mark a session as completed (protected)
- `DELETE /api/chat/sessions/:id` - Delete a chat session (protected)

### Mood Tracking

- `POST /api/mood` - Create a mood entry (protected)
- `GET /api/mood` - Get all mood entries (protected)
- `GET /api/mood/trend` - Get mood trend analysis (protected)
- `DELETE /api/mood/:id` - Delete a mood entry (protected)

### Activity Logging

- `POST /api/activity` - Log an activity (protected)
- `GET /api/activity` - Get all activities (protected)
- `GET /api/activity/stats` - Get activity statistics (protected)
- `DELETE /api/activity/:id` - Delete an activity (protected)

### Health Check

- `GET /health` - Server health check

## Authentication

All protected endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## ML Service Integration

The backend integrates with the Python ML service for:
- Sentiment analysis of user messages
- Crisis detection and risk assessment
- Therapeutic technique recommendations
- Theme extraction
- Mood trend analysis

The ML service should be running on `http://localhost:8000` (configurable via `ML_SERVICE_URL`).

## Database Models

### User
- `name`: User's name
- `email`: User's email (unique)
- `password`: Hashed password
- `createdAt`: Account creation date
- `updatedAt`: Last update date

### ChatSession
- `userId`: Reference to User
- `title`: Session title
- `status`: active, completed, or archived
- `summary`: Session summary
- `messages`: Array of Message objects
- `createdAt`: Session creation date
- `updatedAt`: Last update date

### Message
- `role`: 'user' or 'assistant'
- `content`: Message content
- `timestamp`: Message timestamp
- `metadata`: Technique, goal, progress, and analysis data

### Mood
- `userId`: Reference to User
- `score`: Mood score (0-100)
- `emotion`: Emotion label
- `notes`: Optional notes
- `timestamp`: Entry timestamp

### Activity
- `userId`: Reference to User
- `type`: Activity type (breathing, garden, forest, waves, etc.)
- `duration`: Duration in seconds
- `completed`: Completion status
- `timestamp`: Activity timestamp

## Error Handling

The API uses standard HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

Error responses follow this format:
```json
{
  "success": false,
  "error": "Error message"
}
```

## Security Features

- **Password Hashing**: All passwords are hashed using bcrypt
- **JWT Authentication**: Secure token-based authentication
- **Protected Routes**: All sensitive endpoints require authentication
- **CORS**: Configured for frontend-backend communication
- **Input Validation**: Basic validation on all inputs

## Development

The backend is designed to work with:
- Frontend: Next.js 14 (port 3000)
- ML Service: Python Flask (port 8000)
- Database: MongoDB (default port 27017)

## Notes

- The backend was created in `backend-new/` directory because the original `backend/` directory is gitignored
- To use this backend, either:
  1. Move contents to the original `backend/` directory
  2. Update the frontend's `BACKEND_API_URL` environment variable to point to `http://localhost:5000`
  3. Update the Next.js API proxy routes to point to the correct backend location

## License

MIT
