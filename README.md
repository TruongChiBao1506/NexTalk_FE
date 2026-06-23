# NexTalk Frontend

The web interface for NexTalk, built with React and Vite. The application connects to the NexTalk Backend via REST API, SockJS/STOMP, and integrates with Firebase, Google OAuth, and Agora services.

Backend: <https://github.com/TruongChiBao1506/NexTalk_BE>

## Key Features

- Registration, login, email verification, Google login, and automatic JWT refresh.
- Private chats, groups, text/voice channels, group invitations, and message requests.
- Real-time messaging: file attachments, reactions, pinning, recalling, polls, task reminders, searching, and sharing.
- Sharing to strangers as message requests; upon acceptance, messages are moved to a private conversation.
- Voice/video calls via Agora, Firebase browser push notifications, stickers, and light/dark mode.

## Technology Stack

- React 19, TypeScript, Vite 6
- Tailwind CSS, Zustand, React Router
- Axios, SockJS, STOMP
- React Hook Form, Zod, Quill, DOMPurify
- Firebase, Google OAuth, and Agora RTC

## Requirements

- Node.js 20 LTS or newer
- npm
- NexTalk Backend running or deployed URL available

## Run Locally

```bash
git clone https://github.com/TruongChiBao1506/NexTalk_FE.git
cd NexTalk_FE
npm ci
cp .env.example .env
npm run dev
```

On Windows PowerShell, replace the copy command with:

```powershell
Copy-Item .env.example .env
```

Vite runs on `http://localhost:3000`. When `VITE_API_BASE_URL` is empty, Vite proxies `/api` and `/ws` to `http://localhost:8080`.

## Environment Configuration

Copy `.env.example` to `.env`. All `VITE_*` variables are bundled into the code running in the browser, so **do not place server-side secrets here**.

```dotenv
# Leave empty when running the backend locally via Vite proxy.
# Production: The base URL of the backend, without /api.
VITE_API_BASE_URL=

# Required for voice/video calls.
VITE_AGORA_APP_ID=

# Required for Google login.
VITE_GOOGLE_CLIENT_ID=

# Required for Firebase browser push notifications.
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_VAPID_KEY=
```

Production example:

```dotenv
VITE_API_BASE_URL=https://api.example.com
```

With this configuration, REST calls go to `https://api.example.com/api` and WebSocket uses `https://api.example.com/ws`.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Runs the Vite development server on port 3000 |
| `npm run build` | Type-checks TypeScript and creates a production build in `dist/` |
| `npm run preview` | Previews the production build locally |
| `npm run lint` | Runs ESLint |

## Backend Connection

- REST API: `${VITE_API_BASE_URL}/api`; the frontend automatically attaches the access token to the `Authorization: Bearer <token>` header.
- When the access token is about to expire, the frontend calls `/api/auth/refresh` and retries the request once.
- Real-time: SockJS/STOMP at `${VITE_API_BASE_URL}/ws`; the `Authorization` header is sent upon STOMP `CONNECT`.
- Running locally without `VITE_API_BASE_URL`: Vite proxies both `/api` and `/ws` to the local backend. The backend must allow `http://localhost:3000` in `CORS_ALLOWED_ORIGINS`.

## Build and Deployment

```bash
npm run build
```

Deploy the `dist/` folder to a static hosting service. Set the `VITE_*` variables in the platform's build environment; changing these variables after building will not update the app until it is re-built/re-deployed.

Also, configure the backend:

```dotenv
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.example
```

## Firebase Notifications

Firebase Cloud Messaging is initialized from the `VITE_FIREBASE_*` variables; the service worker at `public/firebase-messaging-sw.js` is registered when the user allows notifications. You can leave the Firebase variables empty if browser push is not used, but you should avoid calling the notification registration flow in that environment.

## Security Notes

- Do not commit `.env`; the file is already in `.gitignore`.
- `VITE_*` configurations are public client-side variables. They are not the place for JWT secrets, Cloudinary API secrets, Firebase Admin credentials, or Agora certificates.
- Google OAuth and Firebase configurations require adding the correct frontend domain to the provider's authorized origins/domains list.
