# Vidwaan AI Backend

Vidwaan AI Backend is a Hono-based application running on the Bun runtime, utilizing MongoDB for data storage. It provides robust authentication (Direct & OAuth 2.0), chat management capabilities, and a scalable architecture for AI-driven interactions.

## 🚀 Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) & Docker Compose
- [Bun](https://bun.sh/) (for local development)
- [MongoDB](https://www.mongodb.com/) (if running locally without Docker)

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd vidwaan-ai-be
    ```

2.  **Environment Variables:**
    Copy `.env.example` to `.env` and configure your credentials.
    ```bash
    cp .env.example .env
    ```

3.  **Run with Docker (Recommended):**
    ```bash
    make up
    ```
    The server will start at `http://localhost:3001`.

4.  **Run Locally:**
    ```bash
    bun install
    bun run dev
    ```

### Running Tests

To run integration tests inside the Docker environment:
```bash
make test-docker
```

To run tests locally (requires local Bun & Mongo setup):
```bash
bun test
```

---

## 📚 API Documentation

The backend exposes several API endpoints for authentication, user management, and chat features.

### 🔐 Authentication (`/api/auth`)

| Method | Endpoint    | Description | Request Body |
| :--- | :--- | :--- | :--- |
| **POST** | `/register` | Register a new user | `{ email, password, fullName, preferredLanguage }` |
| **POST** | `/login`    | Login user & get tokens | `{ email, password }` |
| **POST** | `/refresh`  | Refresh access token | `{}` (cookies required) |
| **POST** | `/logout`   | Logout & clear cookies | `{}` |

**Examples:**

```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "fullName": "John Doe",
    "preferredLanguage": "en"
  }'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'

# Refresh Token (assuming cookie handling)
curl -X POST http://localhost:3001/api/auth/refresh \
  -b "refreshToken=YOUR_REFRESH_TOKEN"

# Logout
curl -X POST http://localhost:3001/api/auth/logout \
  -b "refreshToken=YOUR_REFRESH_TOKEN"
```

### 🔑 OAuth 2.0 (`/oauth`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/authorize` | Init OAuth authorization flow |
| **POST** | `/login-action` | Form submission for OAuth login |
| **POST** | `/token` | Exchange code for tokens |

**Examples:**

```bash
# Authorize (Browser usually initiates this)
curl -X GET "http://localhost:3001/oauth/authorize?client_id=client_123&redirect_uri=http://localhost:3000/callback&response_type=code"

# Exchange Token
curl -X POST http://localhost:3001/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "authorization_code",
    "code": "AUTH_CODE",
    "client_id": "client_123",
    "code_verifier": "PKCE_VERIFIER"
  }'
```

### 💬 Chat (`/api/chat`)
*Protected Routes: Require `Authorization: Bearer <token>`*

| Method | Endpoint | Description | Query Params / Body |
| :--- | :--- | :--- | :--- |
| **GET** | `/conversations` | Get user conversations | - |
| **POST** | `/conversations` | Create new conversation | `{ title, description, groupId }` |
| **GET** | `/messages` | Get messages | `?conversationId=<id>`, `?messageId=<id>` (optional) |
| **POST** | `/messages` | Send a message | `{ conversationId, text, role, ... }` |
| **DELETE** | `/conversations/:id` | Delete conversation | - |

**Examples:**

```bash
# Get Conversations
curl -X GET http://localhost:3001/api/chat/conversations \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Delete Conversation
curl -X DELETE http://localhost:3001/api/chat/conversations/CONVO_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Create Conversation
curl -X POST http://localhost:3001/api/chat/conversations \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Chat",
    "description": "Discussing project details"
  }'

# Get All Messages in Conversation
curl -X GET "http://localhost:3001/api/chat/messages?conversationId=CONVO_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Get Thread filtered by Message ID (Follow-ups)
curl -X GET "http://localhost:3001/api/chat/messages?conversationId=CONVO_ID&messageId=MSG_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Send Message
curl -X POST http://localhost:3001/api/chat/messages \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "CONVO_ID",
    "text": "Hello, AI!",
    "role": "user"
  }'
```

### ⚙️ System & Docs

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/api/health` | Health check |
| **GET** | `/doc` | OpenAPI Specification (JSON) |
| **GET** | `/reference` | Interactive API Documentation |

**Examples:**

```bash
# Health Check
curl http://localhost:3001/api/health

# OpenAPI Specification
curl http://localhost:3001/doc

# Interactive Documentation
curl http://localhost:3001/reference
```

---

## 🛠️ Tech Stack

- **Runtime:** Bun
- **Framework:** Hono
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT (Access/Refresh), bcryptjs
- **Documentation:** Scalar / OpenAPI
