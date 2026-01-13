# SEO Audit Tool

A full-stack web application that performs technical SEO audits similar to SEMrush's Site Audit tool. Users enter a website URL, the tool crawls up to 50 pages, analyzes technical SEO factors, displays results in a dashboard, and allows PDF report downloads with Snappy branding.

## Features

- **Deep Crawl**: Crawls up to 50 pages per audit
- **Comprehensive Analysis**: Checks 15+ technical SEO factors including:
  - Broken internal/external links
  - Missing/duplicate title tags
  - Missing meta descriptions
  - Missing H1 headings
  - Low text-to-HTML ratio
  - Missing canonical tags
  - Missing viewport meta
  - Missing Open Graph tags
  - And more...
- **Real-time Progress**: Watch the crawl progress in real-time with SSE
- **Visual Dashboard**: Score cards, charts, and detailed issue tables
- **PDF Reports**: Download branded PDF reports
- **Shareable Links**: Each audit gets a unique URL for sharing

## Tech Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS
- React Router
- Recharts
- jsPDF for PDF generation

### Backend
- Node.js with Express and TypeScript
- Cheerio for HTML parsing
- Axios for HTTP requests
- SQLite with better-sqlite3

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd seo-audit-tool
```

2. Install dependencies:
```bash
npm install
```

This will install dependencies for the root, server, and client.

3. Create environment file:
```bash
cp .env.example .env
```

4. Start development servers:
```bash
npm run dev
```

This will start both the backend (port 3001) and frontend (port 5173).

### Production Build

```bash
npm run build
npm start
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3001 |
| `NODE_ENV` | Environment mode | development |
| `DATABASE_PATH` | SQLite database path | ./data/audits.db |
| `CORS_ORIGIN` | Allowed CORS origins | http://localhost:5173 |
| `MAX_CONCURRENT_REQUESTS` | Concurrent crawl requests | 5 |
| `PAGE_TIMEOUT_MS` | Page request timeout | 10000 |
| `MAX_PAGES_PER_AUDIT` | Maximum pages to crawl | 50 |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/audit` | Start a new audit |
| GET | `/api/audit/:id` | Get audit results |
| GET | `/api/audit/:id/progress` | SSE progress stream |
| GET | `/api/report/:id/pdf` | Get PDF report data |
| GET | `/api/health` | Health check |

## Project Structure

```
/seo-audit-tool
├── /client                    # React frontend
│   ├── /src
│   │   ├── /components        # Reusable UI components
│   │   ├── /pages             # Page components
│   │   ├── /hooks             # Custom React hooks
│   │   ├── /utils             # Utility functions
│   │   └── /types             # TypeScript types
│   └── package.json
├── /server                    # Node.js backend
│   ├── /src
│   │   ├── /services          # Business logic
│   │   ├── /routes            # API routes
│   │   ├── /models            # Database models
│   │   └── /utils             # Helper functions
│   └── package.json
├── /shared                    # Shared types
└── package.json
```

## Deployment

### Railway

1. Connect your GitHub repository
2. Set environment variables in Railway dashboard
3. Railway will auto-detect and build both client and server

### Render

1. Create a new Web Service
2. Set build command: `npm run build`
3. Set start command: `npm start`
4. Add environment variables
5. Enable persistent disk for SQLite database

## License

MIT License - see LICENSE file for details.

## Credits

Powered by [Snappy](https://gosnappy.io)
