# Bulk-Care

A modern web application for validating and analyzing medical and drug codes. It combines AI-powered validation with real-time chat assistance to streamline the medical coding process.

## Features

- File Upload & Processing
  - Drag-and-drop interface
  - Support for CSV and Excel formats
  - Multi-file processing
  - Real-time validation feedback

- Code Validation
  - AI-powered code analysis
  - Support for medical codes and drug codes
  - Duplicate detection
  - Compliance verification

- Results Display
  - Visual validation summary
  - Detailed entry inspection
  - AI-generated explanations
  - Export capabilities

- AI Chat Assistant
  - Context-aware responses
  - Real-time coding guidance
  - Access to validation results

## Tech Stack

- React with TypeScript
- Tailwind CSS
- OpenAI Integration
- Supabase Edge Functions
- XLSX for file parsing

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```
   VITE_OPENAI_API_KEY=your_openai_key
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## License

MIT