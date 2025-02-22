# The Wheel - Startup Management Platform

A comprehensive platform that helps founders build, launch, and grow their companies. The platform combines AI-powered tools, community features, and practical business tools to provide end-to-end support for startups.

## Features

- **AI Co-founder Bot**: Get daily guidance, feedback, and task suggestions from our AI assistant
- **Company Setup & Management**: Streamlined company formation and team management
- **Idea Hub**: Validate and develop your business ideas with AI assistance
- **Community**: Connect with other founders and share experiences
- **Document Management**: Organize and collaborate on company documents
- **Progress Tracking**: Track your startup journey through defined stages

## Tech Stack

- **Frontend**: React 18.3.1, TypeScript, Vite, Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4
- **Integrations**: Google Drive, Microsoft OneDrive

## Getting Started

1. Clone the repository
```bash
git clone https://github.com/yourusername/thewheel.git
cd thewheel
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env` file in the root directory with:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENAI_API_KEY=your_openai_key
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret
VITE_GOOGLE_REDIRECT_URI=your_google_redirect_uri
```

4. Start development server
```bash
npm run dev
```

5. Run database migrations
```bash
npm run db:migrate
```

## Documentation

- [Platform Documentation](docs/PLATFORM_DOCUMENTATION.md)
- [Technical Documentation](docs/TECHNICAL_DOCS.md)
- [User Stories](docs/USER_STORIES.md)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](docs/LICENSE) file for details.