# The Wheel - Complete Platform Documentation

## Table of Contents

1. [Platform Overview](#platform-overview)
2. [User Stories & Requirements](#user-stories--requirements)
3. [Technical Architecture](#technical-architecture)
4. [Core Features](#core-features)
5. [Database Schema](#database-schema)
6. [API Documentation](#api-documentation)
7. [Security & Compliance](#security--compliance)
8. [Deployment & Operations](#deployment--operations)
9. [Future Roadmap](#future-roadmap)

## Platform Overview

The Wheel is a comprehensive startup management platform that helps founders build, launch, and grow their companies. The platform combines AI-powered tools, community features, and practical business tools to provide end-to-end support for startups.

### Core Features
- Company setup and management
- AI-powered co-founder assistance
- Idea validation and development
- Community and networking
- Document management
- Progress tracking

### Tech Stack
- Frontend: React 18.3.1, TypeScript, Vite, Tailwind CSS
- Backend: Supabase, PostgreSQL
- AI: OpenAI GPT-4
- Integrations: Google Drive, Microsoft OneDrive

## User Stories & Requirements

[Previous user stories section remains the same...]

## Technical Architecture

### Frontend Architecture

#### Core Technologies
- React 18.3.1 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Zustand for state management
- React Router for navigation
- Lucide React for icons

#### Key Components
```typescript
// Auth Store
interface AuthStore {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  signOut: () => Promise<void>;
}

// Layout Structure
<Router>
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/" element={<Layout />}>
      <Route index element={<Navigate to="/dashboard" />} />
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="profile" element={<Profile />} />
      <Route path="directory" element={<Directory />} />
      <Route path="messages" element={<Messages />} />
      <Route path="community" element={<Community />} />
      <Route path="idea-hub/*" element={<IdeaHub />} />
      <Route path="company/*" element={<CompanyRoutes />} />
    </Route>
  </Routes>
</Router>
```

### Backend Architecture (Supabase)

#### Core Services
- PostgreSQL database
- Row Level Security (RLS)
- Real-time subscriptions
- Storage buckets
- Authentication

#### Key Features
- Automatic migrations
- Type generation
- Real-time updates
- Edge Functions
- Storage management

### AI Integration

#### OpenAI Integration
```typescript
// OpenAI client setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Generate AI feedback
async function generateFeedback(content: string) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "You are an experienced co-founder providing feedback..."
      },
      {
        role: "user",
        content
      }
    ]
  });
  
  return completion.choices[0].message.content;
}
```

## Core Features

### 1. Company Setup & Management

#### Setup Wizard
- Multi-step form process
- Progress tracking
- Data validation
- Automatic save

#### Team Management
```typescript
interface CompanyMember {
  id: string;
  company_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'guest';
  title?: string;
  department?: string;
  joined_at: string;
}
```

#### Document Organization
- Hierarchical folders
- Version control
- Access permissions
- Search functionality

### 2. AI Co-founder

#### Daily Standups
```typescript
interface StandupEntry {
  id: string;
  user_id: string;
  accomplished: string;
  working_on: string;
  blockers?: string;
  goals: string;
  ai_feedback?: AIFeedback;
  created_at: string;
}

interface AIFeedback {
  analysis: string;
  suggestions: string[];
  risks: string[];
  opportunities: string[];
}
```

#### Task Generation
- AI-powered suggestions
- Priority assignment
- Resource linking
- Progress tracking

### 3. Idea Hub

#### Idea Flow
```typescript
interface Idea {
  id: string;
  user_id: string;
  title: string;
  stage: 'concept' | 'validation' | 'planning' | 'execution';
  problem_statement?: string;
  solution?: string;
  target_market?: string;
  business_model?: string;
  ai_feedback?: AIFeedback;
}
```

#### Market Research
- Competitor analysis
- Market size estimation
- Target audience definition
- Trend analysis

### 4. Community Features

#### Community Management
```typescript
interface Community {
  id: string;
  name: string;
  description?: string;
  is_private: boolean;
  owner_id: string;
  member_count: number;
  created_at: string;
}
```

#### Messaging System
- Direct messages
- Group chats
- File sharing
- Read receipts

## Database Schema

[Previous database schema section with additional details...]

## API Documentation

[Previous API documentation section with additional details...]

## Security & Compliance

### Authentication
- Email/password auth
- Social auth providers
- JWT tokens
- Session management

### Data Protection
- Row Level Security
- Data encryption
- Input validation
- XSS prevention

### Compliance
- GDPR compliance
- Data privacy
- Cookie management
- Terms of service

## Deployment & Operations

### Requirements
- Node.js 18+
- npm/yarn
- Supabase account
- OpenAI API access

### Environment Setup
```bash
# Required environment variables
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENAI_API_KEY=your_openai_key
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Build Process
1. Install dependencies: `npm install`
2. Run migrations: `npm run db:migrate`
3. Build frontend: `npm run build`
4. Start server: `npm run start`

## Future Roadmap

### Planned Features
1. Mobile application
2. Advanced analytics
3. AI-powered market analysis
4. Integrated fundraising
5. Enhanced collaboration

### Technical Improvements
1. GraphQL API
2. Real-time collaboration
3. Offline support
4. Performance optimization
5. Enhanced security

## Support & Maintenance

### Documentation
- API documentation
- User guides
- Integration guides
- Security guidelines
- Best practices

### Monitoring
- Error tracking
- Performance monitoring
- Usage analytics
- Security auditing
- System health checks