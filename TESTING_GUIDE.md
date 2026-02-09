# Brandbolt Testing Guide for Judges

> Quick testing guide to evaluate Brandbolt's AI-powered brand asset generation

## Live Demo

**Frontend**: https://brand-asset-generator-r5wy.vercel.app/

No installation required — just open the link in your browser.

---

## Quick Test (5 minutes)

### Step 1: Open the Application

Navigate to the live demo URL above. You should see the Brandbolt interface with a form.

### Step 2: Fill in Brand Details

Use this sample data for a quick test:

| Field | Value |
|-------|-------|
| Brand Name | `NexaFlow` |
| Industry | Technology |
| Tagline | `Automate the future` |
| Primary Color | `#6366F1` |
| Secondary Color | `#0EA5E9` |
| Accent Color | `#22D3EE` |
| Primary Font | Space Grotesk |
| Target Audience | `Tech-savvy startup founders aged 28-45` |
| Brand Tone | Bold and innovative |
| Brand Values | `Speed, simplicity, developer-first` |

### Step 3: Test Competitive Differentiation

Scroll to the **Competitive Differentiation** section:

| Field | Value |
|-------|-------|
| Key Competitors | `Zapier, Make, n8n` |
| What Makes You Different? | `AI-native automation with natural language` |

### Step 4: Test Campaign Bundling

Scroll to the **Campaign Bundling** section:

| Field | Value |
|-------|-------|
| Campaign Name | `Product Hunt Launch` |
| Campaign Goal | `Drive 1000 sign-ups in first week` |
| Key Message / CTA | `Build automations in plain English` |

### Step 5: Select Assets (Quick Test)

For a faster test, select only:
- ✅ Logos
- ✅ Social Media

Uncheck the others to reduce generation time.

### Step 6: Generate

Click **"Generate Brand Assets"** and observe:

1. **Progress Timeline**: Watch each step complete
2. **Self-Correction**: Some assets may show "self-corrected" badges
3. **Generation Time**: ~1-2 minutes for logos + social media

### Step 7: Review Results

After generation completes, you'll see:

1. **Campaign Context Card** (pink) showing:
   - Campaign goal and key message
   - AI-generated unified theme
   - Interactive deployment checklist

2. **Batch Consistency Score** showing:
   - Overall brand consistency rating
   - Breakdown by category (color, typography, tone, etc.)

3. **Asset Gallery** with:
   - Generated logos and social media templates
   - Individual consistency scores per asset
   - Download buttons

### Step 8: Download

Click **"Download All"** to get a ZIP containing:
- All generated images organized by category
- Brand analysis document

---

## Full Test (10-15 minutes)

For a comprehensive test, select all asset types:
- ✅ Logos
- ✅ Social Media
- ✅ Presentations
- ✅ Email Templates
- ✅ Marketing

This generates 15+ coordinated assets and takes 3-5 minutes.

---

## Key Features to Evaluate

### 1. Self-Correcting AI Loop
- Assets are validated against brand guidelines
- If score < 70, the AI regenerates with specific feedback
- Look for "self-corrected" badges on some assets
- Click an asset → "View Iteration History" to see the correction process

### 2. Brand Consistency Scoring
- Each asset gets scored on 5 dimensions
- Batch score shows overall campaign coherence
- Scores reflect how well assets match brand guidelines

### 3. Competitive Differentiation
- Brand analysis incorporates competitor awareness
- Assets are designed to stand out from named competitors

### 4. Campaign-Level Bundling
- All assets share unified messaging
- AI generates a cohesive theme description
- Deployment checklist helps users launch the campaign

### 5. Multi-Platform Asset Generation
- Correct dimensions for each platform (Instagram, Twitter, LinkedIn, etc.)
- Professional quality suitable for real use

---

## Alternative Test Scenario

Try a different brand personality:

| Field | Value |
|-------|-------|
| Brand Name | `GreenLeaf Co` |
| Industry | E-commerce |
| Tagline | `Sustainable living, simplified` |
| Primary Color | `#059669` |
| Secondary Color | `#84CC16` |
| Brand Tone | Warm and friendly |
| Target Audience | `Eco-conscious millennials and Gen Z` |
| Competitors | `Thrive Market, Grove Collaborative` |
| Differentiation | `Carbon-negative shipping on every order` |
| Campaign Name | `Earth Month Sale` |
| Campaign Goal | `Increase sales by 40%` |
| Campaign Message | `30% off + we plant a tree for every order` |

---

## What to Expect

| Aspect | Expected Result |
|--------|-----------------|
| **Generation Time** | 1-2 min (partial) / 3-5 min (full) |
| **Asset Quality** | Professional, brand-consistent designs |
| **Text Rendering** | Legible text in logos and templates |
| **Color Accuracy** | Assets reflect specified brand colors |
| **Consistency Scores** | Typically 70-90 range |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "API Offline" indicator | Wait 30 seconds and refresh (Render free tier spins down when idle) |
| Generation takes too long | Reduce asset selection to just Logos |
| Error during generation | Refresh and try again |

---

## Technical Details

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Python + FastAPI
- **AI Models**: 
  - `gemini-3-flash-preview` for analysis/validation
  - `gemini-3-pro-image-preview` for image generation
- **Hosting**: Vercel (frontend) + Render (backend)

---

## Source Code

GitHub: https://github.com/darsh94/brand-asset-generator

Feel free to review the codebase for implementation details.
