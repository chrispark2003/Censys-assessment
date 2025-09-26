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

1. Clone repository
2. Add Gemini API Key in ```./backend/.env```
3. Run frontend & backend folders

### In terminal: 
```bash
# Backend setup
cd backend && npm install
echo "GEMINI_API_KEY=your_key_here" > .env
npm run dev

# Frontend setup (new terminal)
cd frontend && npm install && npm start
```

Access: http://localhost:3000

## Development Assumptions
- Users uploading one file at a time
- Files will not contain duplicate hosts
- In-memory storage will suffice for the specified use case

## Testing Instructions

### Backend Testing
```bash
cd backend && npm test          # Run all tests
cd backend && npm run test:watch   # Run tests in watch mode
cd backend && npm run lint         # Run linting
```

### Frontend Testing
```bash
cd frontend && npm test         # Run React component tests
```

### Test Coverage
- **Backend**: API controllers and data validation logic
- **Frontend**: React components with Testing Library

## AI Techniques
- Developed using with assistance from Copilot and Claude Code
- Uses Gemini to validate data to capture a wide range of potential invalid data
- Prompts carefully engineered for maximum functionality and user experience

**Summarization uses carefully crafted prompts optimized for:**
- **Contextual Analysis**: Understands Censys data structure and relationships
- **Consistent Output**: Standardized summary format across all hosts
- **Security Focus**: Highlights vulnerabilities and security implications
- **Actionable Insights**: Provides clear, practical recommendations

**Validation uses carefully crafted prompts optimized for:**
- **Sample Censys JSON object for reference**
- **Desired output object**
- **Indicators of Censys data**

## Architecture & Extensibility

**Modular Design**: Clean separation enables easy extension
- Controllers handle HTTP requests
- Services contain business logic
- Components are reusable and composable
- API service abstracts backend communication

**Future Enhancements**:
- Add more robust testing and edge cases
- Extend functionality to Platform Web Property and Platform Certificate Datasets
- Connect to a database for long-term data access
- Allow users to select their LLM models using VertexAI or OpenRouter
- Enhance UI for a more professional experience
- Add user registration for security