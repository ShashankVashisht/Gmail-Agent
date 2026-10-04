# Echo

Echo is a web-based email assistant. It provides a regular AI chat for email-related questions and, once Gmail is connected, an email-agent mode that can look up messages and prepare reply drafts. Echo does not send emails: drafts stay in Gmail for the user to review and send.

The project includes a React web app, a FastAPI API, and a PostgreSQL database. User accounts, chat conversations, and Gmail connection status are stored in the database.

## What it can do

- Register an account, log in, and keep conversations scoped to that account.
- Chat with an LLM, with conversation history saved between requests.
- Connect Gmail through Composio and check the connection status.
- Ask the email agent to find or summarize messages and create reply drafts.
- Review and send any created drafts yourself in Gmail.
- Run the full stack locally with Docker Compose, or run the API and frontend separately.

The regular chat works without an LLM API key by returning a mock reply. The email agent requires a connected Gmail account and its external service configuration.

## Screenshots

### Chat

![Echo chat screen](./screenshots/Chat.png)

### Sign in

![Echo sign-in screen](./screenshots/Login.png)

### Settings and Gmail connection

![Echo settings screen with Gmail connected](./screenshots/Settings.png)

Before publishing, consider replacing account details in screenshots with demo or redacted data.

## Project structure

```text
.
├── backend/
│   ├── app/
│   │   ├── api/v1/       # Health endpoints and API router
│   │   ├── auth/         # Registration, login, and JWT authentication
│   │   ├── chat/         # Chat and conversation endpoints and services
│   │   ├── core/         # Application settings
│   │   ├── db/           # SQLAlchemy models and database session
│   │   ├── gmail/        # Gmail connection and email-agent integration
│   │   ├── llm/          # LLM interface and mock/OpenAI clients
│   │   └── main.py       # FastAPI application
│   ├── alembic/          # Database migrations
│   ├── .env.example      # Backend environment variable template
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/          # API client
│   │   ├── auth/         # Login, registration, and protected routes
│   │   ├── chat/         # Chat UI and conversation list
│   │   ├── components/   # Shared UI components
│   │   └── settings/     # Account and Gmail connection settings
│   ├── .env.example      # Frontend environment variable template
│   ├── Dockerfile
│   └── package.json
└── docker-compose.yml    # PostgreSQL, API, and frontend services
```

## Run with Docker Compose

Docker Compose starts PostgreSQL, applies the database migrations, starts the API, and serves the frontend through Nginx.

1. Install Docker Desktop and make sure Docker Compose is available.
2. Create the backend environment file:

   ```powershell
   Copy-Item backend\.env.example backend\.env
   ```

3. Edit `backend\.env` and set at least `JWT_SECRET`. Add the optional LLM and Composio values if you plan to use those integrations. Compose supplies the database URL for its PostgreSQL service.
4. From the project root, start the services:

   ```powershell
   docker compose up --build
   ```

Open the frontend at [http://localhost:3000](http://localhost:3000). The API is available at [http://localhost:8000](http://localhost:8000), and its interactive API docs are at [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs).

To stop the services, press `Ctrl+C`, or run `docker compose down` from the project root. The PostgreSQL data is kept in the `echo_pgdata` Docker volume. To remove that data as well, run `docker compose down --volumes`.

## Run locally without Docker

You'll need Python 3.13, Node.js 20 or newer, npm, and a PostgreSQL database.

### Backend

In PowerShell, from the project root:

```powershell
cd backend
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `backend\.env` with your local database URL and a secret `JWT_SECRET`. For example:

```dotenv
DATABASE_URL=postgresql+psycopg2://echo:your_password@localhost:5432/echo_db
JWT_SECRET=replace-with-a-long-random-secret
```

The database named in `DATABASE_URL` must already exist. Then apply migrations and start the API:

```powershell
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

The backend reads `.env` from its working directory. The API docs are at [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs).

### Frontend

In a separate PowerShell window, from the project root:

```powershell
cd frontend
npm ci
Copy-Item .env.example .env
npm run dev
```

The development server prints its local URL, normally [http://localhost:5173](http://localhost:5173). `VITE_API_URL` defaults to `http://localhost:8000`; change it in `frontend\.env` if the API is hosted elsewhere.

## Configuration

Backend variables are read from `backend/.env` or the process environment. Keep real credentials out of version control; `.env` files are ignored by Git.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | SQLAlchemy connection URL for PostgreSQL. In Docker Compose, the backend service's URL is set by the Compose file. |
| `JWT_SECRET` | Yes | Secret used to sign access tokens. Use a strong, private value. |
| `JWT_ALGORITHM` | No | JWT signing algorithm; defaults to `HS256`. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | Access-token lifetime; defaults to 30 minutes. |
| `LLM_API_KEY` | No | OpenAI API key. Without it, regular chat uses the built-in mock client. The email agent needs a real LLM key. |
| `LLM_MODEL` | No | OpenAI model name; defaults to `gpt-4o-mini`. |
| `COMPOSIO_API_KEY` | For Gmail | Composio API key used for Gmail connections and tools. |
| `COMPOSIO_GMAIL_AUTH_CONFIG_ID` | For Gmail | Composio Gmail auth configuration ID. |
| `FRONTEND_URL` | No | Frontend origin used for the Gmail connection callback; defaults to `http://localhost:5173`. |
| `CORS_ORIGINS` | No | Comma-separated allowed browser origins; defaults to localhost ports 5173 and 3000. |
| `API_V1_PREFIX` | No | API prefix; defaults to `/api/v1`. |

The frontend uses `VITE_API_URL` for the API origin. It defaults to `http://localhost:8000`.

## API overview

All routes below are prefixed with `/api/v1`. Routes other than registration, login, and health checks require an `Authorization: Bearer <access_token>` header.

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/auth/register` | Create an account with an email and password. |
| `POST` | `/auth/login` | Log in and receive an access token. |
| `GET` | `/auth/me` | Get the authenticated user's account details. |
| `POST` | `/chat` | Send a message to regular chat. |
| `POST` | `/chat/agent` | Send a message to the Gmail email agent. |
| `GET` | `/chat/conversations` | List the authenticated user's conversations. |
| `GET` | `/chat/conversations/{conversation_id}/messages` | Get messages in a conversation. |
| `DELETE` | `/chat/conversations/{conversation_id}` | Delete a conversation. |
| `POST` | `/integrations/gmail/connect` | Start the Gmail connection flow. |
| `GET` | `/integrations/gmail/status` | Get the Gmail connection status. |
| `GET` | `/health` | Check whether the API is responding. |
| `GET` | `/health/db` | Check API-to-database connectivity. |

The chat and email-agent endpoints accept a JSON body with a `message` and an optional `conversation_id`. Omit `conversation_id` or set it to `null` to start a conversation; pass the returned conversation ID to continue it. The agent route returns `409` if Gmail is not connected.

## Development checks

Run the frontend production build and linter from `frontend/`:

```powershell
npm run build
npm run lint
```

The backend's migration command is `alembic upgrade head`, run from `backend/` after configuring `DATABASE_URL`.
