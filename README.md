# FSAI – AI-Powered Full-Stack Chat Application

A modern, full-stack web application that leverages **Mistral AI Agent** to provide intelligent conversational experiences with persistent user sessions, real-time chat management, and seamless cloud deployment.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Architecture](#architecture)
- [Key Components](#key-components)
- [State Management](#state-management)
- [Authentication & Security](#authentication--security)
- [Development Guide](#development-guide)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)

---

## 🎯 Project Overview

**FSAI** is a comprehensive AI chat application that combines a responsive React frontend with a robust Express backend to deliver intelligent conversations powered by Mistral AI. The application supports multi-turn conversations, user authentication, persistent chat history, and theme customization.

### Key Goals
- Provide an intuitive chat interface for AI-powered conversations
- Maintain conversation context across multiple interactions
- Ensure secure user authentication without sensitive data exposure
- Enable seamless conversation history management
- Support both dark and light themes
- Deploy efficiently to modern cloud platforms

---

## ✨ Features

### Core Chat Features
- **Multi-Turn Conversations**: Maintain full context across conversation threads
- **Real-Time Chat Interface**: Live message updates with typing indicators
- **Conversation History**: Automatically store and retrieve recent conversations per user
- **Message Parsing**: Intelligent parsing of agent responses with special formatting support

### User Management
- **User Authentication**: Secure session-based authentication using SHA-256 hashing
- **Per-User Data Isolation**: Each user has isolated conversation history and preferences
- **Session Persistence**: User sessions persist across browser sessions using sessionStorage
- **Multi-User Support**: Support for multiple users with separate chat histories

### Theme & UI
- **Dark/Light Mode Toggle**: Customizable theme preference with localStorage persistence
- **Responsive Design**: Mobile-friendly interface with sidebar collapse functionality
- **Animated Background**: Smooth, professional animated background effects
- **Modern UI Components**: Clean, reusable component architecture

### Sidebar Features
- **Quick Prompts**: Pre-defined prompts for quick message sending
- **Conversation Recents**: Quick-access list of recent conversations (20 most recent)
- **Clear History**: One-click clearing of all conversation history
- **Mobile Overlay**: Sidebar overlay for mobile navigation

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 19.2.4** | UI framework and component library |
| **Redux Toolkit 2.3.0** | State management and chat message storage |
| **React Redux 9.1.0** | Redux bindings for React |
| **React Scripts 5.0.1** | Build and development tools |

### Backend
| Technology | Purpose |
|-----------|---------|
| **Express.js 4.18.2** | REST API server and proxy |
| **Node.js 18+** | Runtime environment |
| **CORS 2.8.5** | Cross-origin request handling |
| **Node Fetch 3.3.2** | HTTP client for API calls |

### AI Integration
| Technology | Purpose |
|-----------|---------|
| **Mistral AI SDK 1.3.4** | AI agent communication |
| **Mistral Agent v3** | Enhanced AI reasoning with text-based inputs |

### Deployment & Build
| Technology | Purpose |
|-----------|---------|
| **Netlify** | Serverless deployment and hosting |
| **Netlify Functions** | Serverless backend functions |
| **Concurrently 8.2.2** | Run multiple npm scripts simultaneously |

### Testing & Dev Tools
| Technology | Purpose |
|-----------|---------|
| **Jest** | Testing framework |
| **React Testing Library** | Component testing utilities |
| **React DevTools** | Browser extensions for debugging |

---

## 📁 Project Structure

```
fsai/
├── public/                          # Static public assets
│   ├── index.html                  # Main HTML entry point
│   ├── manifest.json               # PWA manifest
│   └── robots.txt                  # SEO robots instructions
│
├── src/                             # React application source
│   ├── components/                  # Reusable React components
│   │   ├── AgentResponse.js         # Displays parsed AI responses
│   │   ├── AnimatedBackground.js    # Animated background visual
│   │   ├── AuthPage.js              # Authentication UI
│   │   ├── ChatInput.js             # Message input component (forwarded ref)
│   │   ├── Header.js                # Top navigation bar
│   │   ├── MessageBubble.js         # Individual message display
│   │   ├── MessageList.js           # Chat message container
│   │   ├── Sidebar.js               # Navigation sidebar
│   │   ├── TypingIndicator.js       # Loading animation
│   │   ├── WelcomeScreen.js         # Initial greeting
│   │   └── *.css                    # Component-specific styles
│   │
│   ├── context/                     # React Context API
│   │   ├── AuthContext.js           # User authentication state (sessionStorage-based)
│   │   └── ThemeContext.js          # Theme toggle state (localStorage-based)
│   │
│   ├── hooks/                       # Custom React hooks
│   │   └── useChat.js               # Chat state and message handling logic
│   │
│   ├── store/                       # Redux state management
│   │   ├── chatSlics.js             # Redux slices for chat state
│   │   └── index.js                 # Redux store configuration
│   │
│   ├── utils/                       # Utility functions
│   │   ├── agent.js                 # Mistral AI API communication
│   │   ├── parser.js                # Response parsing and formatting
│   │   └── prompts.js               # Pre-defined prompt templates
│   │
│   ├── App.js                       # Root component with layout
│   ├── App.css                      # Global app styles
│   ├── index.js                     # React DOM render entry
│   ├── index.css                    # Global styles
│   ├── setupTests.js                # Test configuration
│   └── reportWebVitals.js           # Performance metrics
│
├── netlify/                         # Netlify serverless functions
│   └── functions/
│       └── chat.js                  # Serverless chat endpoint
│
├── server.js                        # Express proxy server (local dev)
├── netlify.toml                     # Netlify configuration
├── package.json                     # Dependencies and scripts
└── README.md                        # This file
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: Version 18 or higher
- **npm**: Version 9 or higher
- **Mistral AI API Key**: Obtain from [Mistral AI Console](https://console.mistral.ai)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fsai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Edit `server.js` and update:
   ```javascript
   const MISTRAL_API_KEY = 'YOUR_API_KEY_HERE';
   const MISTRAL_AGENT_ID = 'YOUR_AGENT_ID_HERE';
   ```

### Running Locally

**Development Mode (Frontend + Backend)**
```bash
npm run dev
```
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

**Frontend Only**
```bash
npm start
```

**Backend Only**
```bash
npm run server
```

**Build for Production**
```bash
npm run build
```

**Run Tests**
```bash
npm test
```

---

## 🏗️ Architecture

### Request Flow

```
User Input (React)
    ↓
ChatInput Component
    ↓
useChat Hook (Redux)
    ↓
callFSAI() [utils/agent.js]
    ↓
Express Server (server.js) OR Netlify Function
    ↓
Mistral AI API
    ↓
Response received
    ↓
parseAgentResponse() [utils/parser.js]
    ↓
Redux Store Updated
    ↓
Components Re-render with new message
    ↓
Persistent Storage (localStorage for history)
```

### State Management Flow

```
Redux Store (Chat State)
    ├── messages: Message[]
    ├── isLoading: boolean
    ├── error: string | null
    └── userId: string

User Actions trigger:
    ├── sendMessage()          → callFSAI API
    ├── clearChat()            → reset messages
    ├── addMessage()           → update store
    └── setLoading()           → loading state
```

### Authentication Flow

```
User Registration/Login
    ↓
SHA-256 Password Hash (Web Crypto API)
    ↓
Verify against sessionStorage database
    ↓
Create session user object
    ↓
Store in sessionStorage (NOT localStorage)
    ↓
Redirect to App (if logged in)
    ↓
Load user-specific chat history
```

---

## 🧩 Key Components

### App.js (Root Component)
- **Role**: Main component managing overall layout and state
- **Features**: Conversation history management, sidebar control, theme integration
- **Props**: None (uses Context APIs)
- **State**: `sidebarOpen`, `sidebarCollapsed`, `quickInput`, `conversationHistory`

### ChatInput.js
- **Role**: User message input and submission
- **Features**: Text input, forwarded ref for focus management, quick input integration
- **Props**: `ref`, `onSend`, `isLoading`, `quickInput`, `onQuickInputConsumed`
- **Emits**: Message submission via `onSend` callback

### MessageList.js
- **Role**: Display all messages in conversation
- **Features**: Auto-scroll, loading indicators, chip suggestions
- **Props**: `messages`, `isLoading`, `onChipClick`
- **Children**: MessageBubble, TypingIndicator

### Sidebar.js
- **Role**: Navigation and quick access to previous conversations
- **Features**: Conversation recents, quick prompts, theme toggle, mobile overlay
- **Props**: Multiple callbacks for user interactions
- **State**: Mobile/desktop responsive behavior

### AuthPage.js
- **Role**: User authentication interface
- **Features**: Login and registration forms, password hashing
- **Props**: None (accesses AuthContext)
- **Callbacks**: Updates AuthContext on successful auth

### MessageBubble.js
- **Role**: Individual message display with role differentiation
- **Features**: User/Agent message styling, AgentResponse parsing
- **Props**: `message` (role, content, timestamp)

### TypingIndicator.js
- **Role**: Loading state animation
- **Features**: Animated dots indicating AI is processing
- **Props**: None
- **Use**: Shown when `isLoading` is true

---

## 📦 State Management

### Redux Store Structure (`src/store/`)

**Chat Slice** (`chatSlics.js`)
```javascript
{
  chat: {
    messages: [
      { id, role, content, timestamp, raw },
      // ...
    ],
    isLoading: false,
    error: null,
    userId: "user123"
  }
}
```

**Actions**
| Action | Payload | Effect |
|--------|---------|--------|
| `addMessage` | `{ role, content, timestamp }` | Add message to state |
| `setLoading` | `true/false` | Toggle loading state |
| `setError` | `error string` | Set error message |
| `clearMessages` | None | Empty message array |
| `hydrateMessages` | `{ messages, userId }` | Load user's saved messages |
| `loadMessages` | `userId` | Retrieve from localStorage |

### Local Storage Schema

**Chat History** (`fsai_messages_{userId}`)
```json
[
  { "id": 1, "role": "user", "content": "...", "timestamp": "..." },
  { "id": 2, "role": "agent", "content": "...", "raw": "..." }
]
```

**Conversation Recents** (`fsai_recents_{userId}`)
```json
[
  { "id": 1, "text": "...", "timestamp": "..." },
  // Max 20 recent conversations
]
```

**Theme Preference** (`fsai-theme`)
```
"dark" or "light"
```

---

## 🔐 Authentication & Security

### Password Security
- **Hashing**: SHA-256 using Web Crypto API (zero external dependencies)
- **Storage**: Only hashed passwords in sessionStorage
- **Database**: In-memory user database in sessionStorage (`fsai_session_db`)

### Session Management
- **Storage**: sessionStorage only (cleared on browser close)
- **Keys**: `fsai_session_user`, `fsai_session_db`
- **Persistence**: Per-session only; no sensitive data in localStorage

### Data Security
- **Legacy Cleanup**: Automatically scrubs old localStorage data on startup
- **Chat History**: Encrypted at rest (localStorage), specific to each user
- **API Keys**: Server-side only (not exposed to frontend)

### Important Notes
⚠️ **API Key Security**: The Mistral AI API key is currently in `server.js`. For production:
1. Move to environment variables (`.env` file, NOT committed to git)
2. Use Netlify function environment variables for production
3. Rotate API key regularly

---

## 👨‍💻 Development Guide

### Adding a New Component

1. Create component file: `src/components/MyComponent.js`
2. Create styles: `src/components/MyComponent.css`
3. Import in parent component and use:
   ```javascript
   import MyComponent from './components/MyComponent';
   ```

### Modifying Redux State

1. Update slice in `src/store/chatSlics.js`:
   ```javascript
   newState: {
     ...state,
     newField: action.payload
   }
   ```
2. Export action from slice
3. Import and dispatch in component:
   ```javascript
   const dispatch = useDispatch();
   dispatch(myAction(data));
   ```

### Adding a New API Endpoint

1. Create endpoint in `server.js` or `netlify/functions/`:
   ```javascript
   app.post('/api/new-endpoint', (req, res) => {
     // Handle request
   });
   ```
2. Call from frontend using fetch:
   ```javascript
   const response = await fetch('/api/new-endpoint', {
     method: 'POST',
     body: JSON.stringify(data)
   });
   ```

### Environment-Specific Configuration

**Local Development** (`server.js`)
- Runs on port 5000
- Direct API communication
- Hot reload enabled

**Production** (`netlify/functions/chat.js`)
- Serverless function
- Automatic scaling
- Environment variables via Netlify UI

---

## 🌐 Deployment

### Netlify Deployment

1. **Connect Repository**
   ```bash
   netlify link
   ```

2. **Set Environment Variables** (Netlify UI)
   - `MISTRAL_API_KEY`
   - `MISTRAL_AGENT_ID`

3. **Configure Build** (netlify.toml already configured)
   - Build command: `npm run build`
   - Publish directory: `build`

4. **Deploy**
   ```bash
   npm run build
   netlify deploy --prod
   ```

### Manual Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy `build/` directory to any static host (Vercel, GitHub Pages, etc.)

---

## 📡 API Documentation

### POST `/api/chat`

**Request**
```json
{
  "messages": [
    { "role": "user", "content": "Hello, how are you?" },
    { "role": "assistant", "content": "I'm doing great!" }
  ],
  "conversationId": "optional-conv-id"
}
```

**Response**
```json
{
  "reply": "I'm here to help! What can I assist you with?"
}
```

**Error Response**
```json
{
  "error": "Error message describing what went wrong"
}
```

### Conversation Management

**Start New Conversation**
- Leave `conversationId` undefined
- Mistral API creates new conversation automatically

**Continue Conversation**
- Include previous `conversationId`
- Maintains context across multiple exchanges

---

## 🐛 Troubleshooting

### Common Issues

**Issue**: `chatInputRef is not defined`
- **Solution**: Ensure `useRef(null)` is initialized in App.js

**Issue**: "User not authenticated"
- **Solution**: Login via AuthPage, check sessionStorage for `fsai_session_user`

**Issue**: Chat history not persisting
- **Solution**: Check localStorage is enabled, verify `userId` is set

**Issue**: API calls failing
- **Solution**: Verify Mistral API key, check CORS settings, review server logs

---

## 📝 License

Proprietary - All rights reserved

---

## 💬 Support

For issues, questions, or feature requests, please contact the development team.

---

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024 | Initial release with Mistral AI integration |
| Future | TBD | Enhanced analytics, export features, plugin system |

---

**Last Updated**: April 2026  
**Maintainer**: FSAI Development Team
