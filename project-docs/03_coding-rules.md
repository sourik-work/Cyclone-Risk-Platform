# Coding Rules

## Python (Backend & Data)
- Use snake_case for functions, PascalCase for classes
- All API calls must have retry logic with exponential backoff
- Never hardcode project IDs — use environment variables

## TypeScript / Next.js (Frontend)
- Use functional components with TypeScript interfaces
- Use Tailwind CSS for all styling (no external CSS files)
- Map components must be isolated in `components/map/`

## GEE
- Always use ee.ImageCollection with date filters
- Export as GeoJSON for <10k features, BigQuery table for larger

## Gemini
- Always specify model: gemini-3.7-flash for high-volume tasks
- Use system_instructions for consistent output format