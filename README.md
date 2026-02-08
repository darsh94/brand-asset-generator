# Brand Asset Generator

> Generate complete brand asset packages using Gemini 3 AI

Built for the **Gemini 3 Hackathon 2026** - A powerful tool that takes brand guidelines and generates a complete suite of visual assets including logos, social media templates, presentation decks, email templates, and marketing materials.

## Features

- **Logo Generation**: Multiple variations (primary, horizontal, icon-only, monochrome, reversed)
- **Social Media Templates**: Instagram, Twitter/X, Facebook, LinkedIn, YouTube
- **Presentation Decks**: Professional slides with consistent branding
- **Email Templates**: Welcome, newsletter, promotional, and more
- **Marketing Materials**: Banners, flyers, business cards, posters

## Tech Stack

- **Backend**: Python, FastAPI, google-genai SDK
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **AI Models**:
  - `gemini-2.0-flash`: Brand analysis and understanding
  - `gemini-3-pro-image-preview`: High-fidelity image generation with legible text

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- Google AI API Key ([Get one here](https://aistudio.google.com/apikey))

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env and add your GOOGLE_API_KEY

# Run the server
python main.py
```

The API will be available at `http://localhost:8000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /api/analyze-brand` | Analyze brand guidelines |
| `POST /api/generate/logos` | Generate logo variations |
| `POST /api/generate/social-media` | Generate social media templates |
| `POST /api/generate/presentation` | Generate presentation slides |
| `POST /api/generate/email-templates` | Generate email templates |
| `POST /api/generate/marketing` | Generate marketing materials |
| `POST /api/generate/complete-package` | Generate all assets at once |

## Usage

1. Enter your brand details:
   - Brand name
   - Colors (primary, secondary, accent)
   - Fonts
   - Industry and target audience
   - Brand tone and values

2. Select which asset types to generate

3. Click "Generate Brand Assets"

4. Preview and download your assets individually or as a complete ZIP package

## Project Structure

```
brand-asset-generator/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── models/
│   │   └── schemas.py       # Pydantic models
│   ├── services/
│   │   ├── gemini_service.py    # Gemini API integration
│   │   └── asset_generator.py   # Asset generation logic
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx          # Main application
│   │   ├── components/      # React components
│   │   ├── services/        # API client
│   │   └── types/           # TypeScript types
│   └── package.json
└── README.md
```

## Gemini 3 Integration

This project leverages two Gemini models:

### Brand Analysis (gemini-2.0-flash)
Used to deeply understand brand identity from the provided guidelines. Generates comprehensive analysis covering:
- Visual identity summary
- Design principles
- Mood and atmosphere
- Typography guidelines
- Color application best practices
- Imagery style recommendations

### Image Generation (gemini-3-pro-image-preview)
The "Nano Banana" model for high-fidelity image generation with:
- Legible text rendering
- Consistent brand color application
- Professional design quality
- Various dimensions for different platforms

## Judging Criteria Alignment

| Criteria | Implementation |
|----------|---------------|
| **Technical Execution (40%)** | Full-stack implementation with FastAPI + React, proper Gemini 3 integration, concurrent asset generation |
| **Potential Impact (20%)** | Solves real problem for startups, SMBs, and marketers who need consistent branding |
| **Innovation (30%)** | Novel approach to brand asset generation using AI for multi-platform consistency |
| **Presentation (10%)** | Beautiful UI, clear demo flow, comprehensive documentation |

## License

MIT License - Built for the Gemini 3 Hackathon 2026

## Acknowledgments

- Google DeepMind for Gemini 3 API access
- The Gemini 3 Hackathon team
