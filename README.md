# Brandbolt

> Generate complete brand asset packages using Gemini 3 AI

Built for the **Gemini 3 Hackathon 2026** - A powerful tool that takes brand guidelines and generates a complete suite of visual assets including logos, social media templates, presentation decks, email templates, and marketing materials.

📖 **[Read the full story behind Brandbolt](./HACKATHON_WRITEUP.md)**

## Features

- **Logo Generation**: Multiple variations (primary, horizontal, icon-only, monochrome, reversed)
- **Social Media Templates**: Instagram, Twitter/X, Facebook, LinkedIn, YouTube
- **Presentation Decks**: Professional slides with consistent branding
- **Email Templates**: Welcome, newsletter, promotional, and more
- **Marketing Materials**: Banners, flyers, business cards, posters
- **Self-Correcting AI**: Validates generated assets against brand guidelines and regenerates if quality threshold not met
- **Brand Consistency Scoring**: Each asset scored on color adherence, typography, tone alignment, and brand recognition

## Tech Stack

- **Backend**: Python, FastAPI, google-genai SDK
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **AI Models**:
  - `gemini-3-flash`: Brand analysis, validation, and understanding
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
brandbolt/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── models/
│   │   └── schemas.py       # Pydantic models
│   ├── services/
│   │   ├── gemini_service.py    # Gemini API integration
│   │   └── asset_generator.py   # Asset generation with self-correction
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx          # Main application
│   │   ├── components/      # React components
│   │   ├── services/        # API client
│   │   └── types/           # TypeScript types
│   └── package.json
├── HACKATHON_WRITEUP.md     # The story behind Brandbolt
└── README.md
```

## Testing the Application

### Quick Test

1. Start both backend and frontend servers (see Quick Start above)
2. Open `http://localhost:5173` in your browser
3. Fill in the brand form with sample data:
   - **Brand Name**: "Acme Tech"
   - **Primary Color**: `#3B82F6` (blue)
   - **Secondary Color**: `#1E40AF` (dark blue)
   - **Accent Color**: `#F59E0B` (amber)
   - **Primary Font**: "Inter"
   - **Industry**: "Technology"
   - **Target Audience**: "Tech-savvy professionals aged 25-45"
   - **Brand Tone**: "Professional, innovative, trustworthy"
4. Select which asset types to generate (start with just Logos for a quick test)
5. Click "Generate Brand Assets"
6. Wait for generation to complete (progress timeline will show status)
7. Review generated assets with consistency scores
8. Download individual assets or the complete package

### API Testing

Test the API directly using curl:

```bash
# Health check
curl http://localhost:8000/health

# Analyze brand (returns brand analysis)
curl -X POST http://localhost:8000/api/analyze-brand \
  -H "Content-Type: application/json" \
  -d '{
    "brand_name": "Acme Tech",
    "primary_color": "#3B82F6",
    "secondary_color": "#1E40AF",
    "primary_font": "Inter",
    "industry": "Technology",
    "target_audience": "Tech professionals",
    "brand_tone": "Professional and innovative"
  }'

# Generate logos only
curl -X POST http://localhost:8000/api/generate/logos \
  -H "Content-Type: application/json" \
  -d '{
    "brand_guidelines": {
      "brand_name": "Acme Tech",
      "primary_color": "#3B82F6",
      "secondary_color": "#1E40AF",
      "primary_font": "Inter",
      "industry": "Technology",
      "target_audience": "Tech professionals",
      "brand_tone": "Professional"
    },
    "variations": ["primary", "icon_only"]
  }'
```

### What to Expect

- **Generation Time**: Complete package takes 2-5 minutes depending on selected assets
- **Self-Correction**: Assets scoring below 70/100 are automatically regenerated (up to 3 attempts)
- **Consistency Scores**: Each asset shows individual scores for color, typography, tone, and brand recognition
- **Batch Score**: Overall package gets an aggregate consistency score

## Gemini 3 Integration

This project leverages two Gemini models:

### Brand Analysis & Validation (gemini-3-flash)
Used to deeply understand brand identity and validate generated assets. Capabilities:
- Visual identity summary and design principles
- Mood and atmosphere analysis
- Typography and color application guidelines
- Asset validation against brand guidelines
- Consistency scoring with detailed feedback

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
