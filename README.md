# Censys Host Data Analyzer

A professional full-stack application that analyzes Censys host data using AI-generated summarization.

## Core Functionality

- **Data Validation**: Validates JSON files containing Censys host data structure
- **AI Summarization**: Generates contextual summaries using Gemini 2.5 Flash
- **Interactive Analysis**: Chat interface for querying analyzed data
- **Real-time Feedback**: Loading indicators during processing phases

## Tech Stack

- **Frontend**: React, TypeScript, Axios
- **Backend**: Node.js, Express, TypeScript
- **AI**: Google Gemini 2.5 Flash

## Prerequisites

- Node.js 16+
- Gemini API key

## Setup

```bash
# Backend setup
cd backend && npm install
echo "GEMINI_API_KEY=your_key_here" > .env
npm run dev

# Frontend setup (new terminal)
cd frontend && npm install && npm start
```

Access: http://localhost:3000

## Code

- **TypeScript**: Full type safety across frontend and backend
- **Separation of Concerns**: Clear separation between controllers, services, and components
- **Error Handling**: Comprehensive error boundaries and validation
- **Testing**: Unit tests for critical functionality

## Prompt Engineering

AI summarization uses carefully crafted prompts optimized for:
- **Contextual Analysis**: Understands Censys data structure and relationships
- **Consistent Output**: Standardized summary format across all hosts
- **Security Focus**: Highlights vulnerabilities and security implications
- **Actionable Insights**: Provides clear, practical recommendations

## Architecture & Extensibility

**Modular Design**: Clean separation enables easy extension
- Controllers handle HTTP requests
- Services contain business logic
- Components are reusable and composable
- API service abstracts backend communication

## API Endpoints

- `POST /api/upload` - File validation and processing
- `POST /api/summarize` - AI-powered host analysis
- `POST /api/chat` - Contextual data queries
