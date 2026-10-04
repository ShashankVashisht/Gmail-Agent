# Echo Frontend

React + Vite + TypeScript frontend for the Echo email assistant.

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file (see `.env.example`):
   ```
   VITE_API_URL=http://localhost:8000
   ```

3. Run the development server (runs on port 5173):
   ```bash
   npm run dev
   ```

## Build

To build for production:
```bash
npm run build
```

## Docker

The frontend is included in the project's root `docker-compose.yml`. You can run the entire stack with:
```bash
docker-compose up -d --build
```
This builds the frontend using the multi-stage Dockerfile and serves it via Nginx on port 3000.

## Decisions

- **Token Storage**: The JWT access token is stored in `localStorage` rather than an `httpOnly` cookie. This simplifies the frontend-backend communication across different domains (e.g. during local development without CORS proxying) and avoids CSRF complexity. The tradeoff is exposure to XSS attacks, but this is mitigated by strict React escaping and no raw HTML rendering (only markdown via `react-markdown`). The token expires in 30 minutes, which bounds the risk window.
- **Styling**: Uses pure CSS variables and modules instead of a framework like Tailwind, focusing on a precise, constrained design system with a specific set of 5 colors.
