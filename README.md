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

### 🔑 OAuth 2.0 (`/oauth`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/authorize` | Init OAuth authorization flow |
| **POST** | `/login-action` | Form submission for OAuth login |
| **POST** | `/token` | Exchange code for tokens |

### 💬 Chat (`/api/chat`)
*Protected Routes: Require `Authorization: Bearer <token>`*

| Method | Endpoint | Description | Query Params / Body |
| :--- | :--- | :--- | :--- |
| **GET** | `/conversations` | Get user conversations | - |
| **POST** | `/conversations` | Create new conversation | `{ title, description, groupId }` |
| **GET** | `/messages` | Get messages | `?conversationId=<id>` |
| **POST** | `/messages` | Send a message | `{ conversationId, text, role, ... }` |

### ⚙️ System & Docs

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/api/health` | Health check |
| **GET** | `/doc` | OpenAPI Specification (JSON) |
| **GET** | `/reference` | Interactive API Documentation |

---

## 🛠️ Tech Stack

- **Runtime:** Bun
- **Framework:** Hono
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT (Access/Refresh), bcryptjs
- **Documentation:** Scalar / OpenAPI
