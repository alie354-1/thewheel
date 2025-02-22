# The Wheel - Technical Documentation Package

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Database Schema](#database-schema)
3. [API Documentation](#api-documentation)
4. [Security Implementation](#security-implementation)
5. [Integration Details](#integration-details)
6. [Deployment Guide](#deployment-guide)

## System Architecture

### Frontend Architecture

- **Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Icons**: Lucide React
- **Router**: React Router DOM

Key components:
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

- **Database**: PostgreSQL
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **Real-time**: Supabase Realtime
- **Edge Functions**: Supabase Edge Functions

### AI Integration

- **Provider**: OpenAI
- **Model**: GPT-4
- **Integration Points**:
  - Daily standups
  - Task generation
  - Strategic analysis
  - Idea validation

## Database Schema

### Core Tables

```sql
-- User Profiles
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text NOT NULL,
  full_name text,
  role user_role DEFAULT 'user'::user_role,
  is_public boolean DEFAULT false,
  allows_messages boolean DEFAULT true,
  avatar_url text,
  professional_background text,
  skills text[],
  social_links jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Companies
CREATE TABLE companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id),
  name text NOT NULL,
  description text,
  industries text[],
  stage text,
  mission_statement text,
  vision_statement text,
  team_structure jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Company Members
CREATE TABLE company_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id),
  user_id uuid REFERENCES auth.users(id),
  role text NOT NULL,
  title text,
  department text,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(company_id, user_id)
);

-- Company Documents
CREATE TABLE company_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id),
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  file_type text NOT NULL,
  folder_path text DEFAULT '/',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### Feature-specific Tables

```sql
-- AI Standups
CREATE TABLE standup_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  accomplished text NOT NULL,
  working_on text NOT NULL,
  blockers text,
  goals text NOT NULL,
  ai_feedback jsonb,
  created_at timestamptz DEFAULT now()
);

-- Tasks
CREATE TABLE standup_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  standup_entry_id uuid REFERENCES standup_entries(id),
  title text NOT NULL,
  description text,
  priority text NOT NULL,
  status text DEFAULT 'pending',
  category text,
  due_date date NOT NULL,
  assigned_to uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Communities
CREATE TABLE communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  slug text UNIQUE NOT NULL,
  is_private boolean DEFAULT false,
  owner_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Community Posts
CREATE TABLE community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid REFERENCES communities(id),
  author_id uuid REFERENCES auth.users(id),
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

## API Documentation

### Authentication Endpoints

```typescript
// Register new user
POST /auth/register
Body: {
  email: string;
  password: string;
  full_name?: string;
}

// Login user
POST /auth/login
Body: {
  email: string;
  password: string;
}

// Update profile
PUT /profile
Body: {
  full_name?: string;
  professional_background?: string;
  skills?: string[];
  social_links?: {
    linkedin?: string;
    twitter?: string;
    github?: string;
  };
  is_public?: boolean;
  allows_messages?: boolean;
}
```

### Company Management

```typescript
// Create company
POST /companies
Body: {
  name: string;
  description?: string;
  industries: string[];
  stage?: string;
  mission_statement?: string;
  vision_statement?: string;
}

// Update company
PUT /companies/:id
Body: CompanyUpdateDTO

// Add team member
POST /companies/:id/members
Body: {
  email: string;
  role: 'admin' | 'member' | 'guest';
  title?: string;
  department?: string;
}
```

### AI Features

```typescript
// Submit standup
POST /standups
Body: {
  accomplished: string;
  working_on: string;
  blockers?: string;
  goals: string;
}

// Generate tasks
POST /tasks/generate
Body: {
  standup_id: string;
}

// Get AI feedback
POST /feedback
Body: {
  content: string;
  context?: string;
}
```

## Security Implementation

### Row Level Security (RLS)

```sql
-- Profile policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Company policies
CREATE POLICY "Company members can view company"
  ON companies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_id = id
      AND user_id = auth.uid()
    )
  );

-- Document policies
CREATE POLICY "Company members can view documents"
  ON company_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_id = company_documents.company_id
      AND user_id = auth.uid()
    )
  );
```

### Authentication Flow

1. User registration
2. Email verification
3. Profile creation
4. Role assignment
5. Session management

### Data Protection

- Encryption at rest
- Secure file storage
- Input sanitization
- XSS prevention
- CSRF protection

## Integration Details

### OpenAI Integration

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

### Google Drive Integration

```typescript
// Initialize Google Drive client
const drive = google.drive({
  version: 'v3',
  auth: oauth2Client
});

// Upload file
async function uploadFile(file: File) {
  const response = await drive.files.create({
    requestBody: {
      name: file.name,
      mimeType: file.type
    },
    media: {
      mimeType: file.type,
      body: file
    }
  });
  
  return response.data;
}
```

## Deployment Guide

### Prerequisites

- Node.js 18+
- npm/yarn
- Supabase account
- OpenAI API key
- Google Cloud project (for Drive integration)

### Environment Setup

```bash
# .env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENAI_API_KEY=your_openai_key
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Build Process

```bash
# Install dependencies
npm install

# Run database migrations
npm run db:migrate

# Build frontend
npm run build

# Start production server
npm run start
```

### Deployment Checklist

1. Environment variables configured
2. Database migrations run
3. Storage buckets created
4. OAuth providers configured
5. SSL certificates installed
6. Monitoring tools set up

## Monitoring & Maintenance

### Error Tracking

- Sentry integration
- Error logging
- Performance monitoring
- User analytics

### Backup Systems

- Daily database backups
- File storage backups
- System state snapshots
- Disaster recovery plan

## Performance Optimization

### Frontend Optimization

- Code splitting
- Lazy loading
- Image optimization
- Caching strategies
- Bundle size optimization

### Backend Optimization

- Query optimization
- Index management
- Connection pooling
- Cache implementation
- Rate limiting

## Testing Strategy

### Unit Testing

```typescript
// Example test suite
describe('Company Management', () => {
  test('creates company successfully', async () => {
    const company = await createCompany({
      name: 'Test Company',
      industries: ['Technology']
    });
    expect(company.id).toBeDefined();
  });
});
```

### Integration Testing

```typescript
describe('AI Features', () => {
  test('generates tasks from standup', async () => {
    const standup = await createStandup({
      accomplished: 'Completed feature X',
      working_on: 'Feature Y',
      goals: 'Launch next week'
    });
    
    const tasks = await generateTasks(standup.id);
    expect(tasks.length).toBeGreaterThan(0);
  });
});
```

### End-to-End Testing

```typescript
describe('User Journey', () => {
  test('completes company setup process', async () => {
    await page.goto('/company/setup');
    await page.fill('input[name="name"]', 'Test Company');
    await page.selectOption('select[name="industry"]', 'Technology');
    await page.click('button[type="submit"]');
    
    expect(page.url()).toBe('/company/dashboard');
  });
});
```

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