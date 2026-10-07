# SkillTwin OAuth Setup & Social Authentication Guide (Phase 14)

This guide provides step-by-step instructions for configuring **Google**, **GitHub**, and **LinkedIn** OAuth 2.0 social authentication for SkillTwin.

---

## 1. Architecture Overview

### Single Unified Account Identity
SkillTwin uses a **single user identity model**:
- Every user is uniquely identified by their primary internal SkillTwin user ID (`_id: usr-uuid`).
- A user may have an **email/password** credential plus any combination of **Google**, **GitHub**, and **LinkedIn** accounts linked to the **same internal account**.
- OAuth provider identities (`provider: "google" | "github" | "linkedin"`, `providerId: string`) are linked records under the user document.

### Security Principles
1. **No Blind Merging on Unverified Emails**:
   If an incoming OAuth profile has an unverified email (`emailVerified === false`), SkillTwin **never** automatically merges it into an existing account with that email. The user must sign in with their password and link the social account manually.
2. **Verified Email Safe Linking**:
   When an OAuth provider cryptographically verifies the email (`email_verified: true`), SkillTwin safely links the social login to the existing verified user account.
3. **Session Preservation**:
   All successful logins and account linkages issue an HTTP-Only secure JWT cookie (`skilltwin_session`).
4. **Disconnect Safety Rule**:
   A user can disconnect a provider only if they have an active password configured OR at least one other social login provider attached. They can never accidentally lock themselves out of their account.
5. **Separation of Concerns**:
   - **GitHub OAuth Login**: Authentication only (identity + email verification). Does not perform repository analysis.
   - **LinkedIn OAuth Login**: OpenID Connect authentication only. Completely separate from future profile synchronization.

---

## 2. Google OAuth 2.0 Setup

### Step 1: Create a Google Cloud Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project dropdown at the top and select **New Project**.
3. Name it **SkillTwin** and click **Create**.

### Step 2: Configure OAuth Consent Screen
1. Navigate to **APIs & Services** > **OAuth consent screen**.
2. Select User Type: **External** (or **Internal** if using Google Workspace).
3. Fill in required application details:
   - **App name**: `SkillTwin`
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
4. Under **Scopes**, click **Add or Remove Scopes** and select:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`
5. Save and proceed to the dashboard.

### Step 3: Create OAuth Credentials
1. Navigate to **APIs & Services** > **Credentials**.
2. Click **Create Credentials** > **OAuth client ID**.
3. Set **Application type** to **Web application**.
4. Set **Name**: `SkillTwin Web Client`.
5. Under **Authorized JavaScript origins**, add:
   - `http://localhost:5173` (Frontend dev server)
   - `https://yourskilltwin.vercel.app` (Production frontend)
6. Under **Authorized redirect URIs**, add:
   - `http://localhost:4000/api/auth/google/callback` (Backend local dev)
   - `https://skilltwin-api-hafc.onrender.com/api/auth/google/callback` (Production backend)
7. Click **Create** and copy your **Client ID** and **Client Secret**.

### Step 4: Add to Environment Variables
```env
GOOGLE_CLIENT_ID="<your-google-client-id>.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="<your-google-client-secret>"
GOOGLE_CALLBACK_URL="https://skilltwin-api-hafc.onrender.com/api/auth/google/callback"
```

---

## 3. GitHub OAuth Setup

> **Note**: GitHub OAuth in Phase 14 is used strictly for authentication and identity verification. It is completely decoupled from repository evidence extraction.

### Step 1: Register an OAuth App on GitHub
1. Sign in to your [GitHub account](https://github.com/).
2. In the upper-right corner, click your profile photo > **Settings**.
3. In the left sidebar, click **Developer settings** (near the bottom).
4. In the left sidebar, click **OAuth Apps** > **New OAuth App**.

### Step 2: Fill in Application Details
- **Application name**: `SkillTwin Career Platform`
- **Homepage URL**:
  - Local: `http://localhost:5173`
  - Production: `https://yourskilltwin.vercel.app`
- **Application description**: `Developer career intelligence and resume tailoring platform`
- **Authorization callback URL**:
  - Local: `http://localhost:4000/api/auth/github/callback`
  - Production: `https://skilltwin-api-hafc.onrender.com/api/auth/github/callback`

### Step 3: Generate Client Secret
1. Click **Register application**.
2. Note your **Client ID**.
3. Under **Client secrets**, click **Generate a new client secret**.
4. Copy the generated secret immediately.

### Step 4: Add to Environment Variables
```env
GITHUB_CLIENT_ID="<your-github-client-id>"
GITHUB_CLIENT_SECRET="<your-github-client-secret>"
GITHUB_CALLBACK_URL="https://skilltwin-api-hafc.onrender.com/api/auth/github/callback"
```

---

## 4. LinkedIn OAuth (OpenID Connect) Setup

> **Note**: LinkedIn authentication uses standard OpenID Connect (`openid profile email`) strictly for secure login. Future profile analysis tools will operate on separate data scopes.

### Step 1: Create an App on LinkedIn Developer Portal
1. Navigate to the [LinkedIn Developer Portal](https://www.linkedin.com/developers/).
2. Sign in and click **Create App**.
3. Enter app details:
   - **App name**: `SkillTwin`
   - **LinkedIn Page**: Link to your company or personal organization page.
   - **App logo**: Upload the SkillTwin logo or square icon.
4. Agree to terms and click **Create app**.

### Step 2: Request the OpenID Connect Product
1. Under your app dashboard, go to the **Products** tab.
2. Find **Sign In with LinkedIn using OpenID Connect**.
3. Click **Request access** and accept terms. (Approval is immediate).

### Step 3: Configure Redirect URLs & Retrieve Credentials
1. Click the **Auth** tab.
2. Note your **Client ID** and **Client Secret**.
3. Scroll down to **Authorized redirect URLs for your app** and click the edit icon (+).
4. Add the callback URL:
   - Local: `http://localhost:4000/api/auth/linkedin/callback`
   - Production: `https://skilltwin-api-hafc.onrender.com/api/auth/linkedin/callback`
5. Click **Update**.

### Step 4: Add to Environment Variables
```env
LINKEDIN_CLIENT_ID="<your-linkedin-client-id>"
LINKEDIN_CLIENT_SECRET="<your-linkedin-client-secret>"
LINKEDIN_CALLBACK_URL="https://skilltwin-api-hafc.onrender.com/api/auth/linkedin/callback"
```

---

## 5. Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/auth/:provider` | Initiates OAuth redirect (`google`, `github`, `linkedin`). Supports `?action=link` for logged-in users. |
| `GET` | `/api/auth/:provider/callback` | OAuth callback endpoint. Exchanges authorization code, processes user identity, sets session cookie, redirects. |
| `GET` | `/api/auth/providers` | (Protected) Lists connected OAuth providers for the authenticated user and indicates password status. |
| `DELETE` | `/api/auth/providers/:provider` | (Protected) Disconnects a linked provider identity, checking that at least one other login method remains. |

---

## 6. Local Development Simulation & Testing

To test the entire OAuth pipeline in local development without registering live credentials on third-party developer consoles:
1. Set `MOCK_OAUTH=true` in your `.env` or run tests with `NODE_ENV=test`.
2. The mock engine automatically simulates verified OAuth returns, account creation, account collision rejection, and provider disconnects.
3. Automated integration tests can be executed at any time:
   ```bash
   # API OAuth Integration Tests
   npx vitest run src/modules/auth/__tests__/oauth.test.ts

   # Web OAuth Component & UI Tests
   npx vitest run src/__tests__/OAuth.test.tsx
   ```

---

## 7. Production Deployment Checklist

1. **Render (Backend)**:
   - Set `WEB_ORIGIN="https://yourskilltwin.vercel.app"`
   - Set `API_BASE_URL="https://skilltwin-api-hafc.onrender.com"`
   - Add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL="https://skilltwin-api-hafc.onrender.com/api/auth/google/callback"`
   - Add `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_CALLBACK_URL="https://skilltwin-api-hafc.onrender.com/api/auth/github/callback"`
   - Add `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_CALLBACK_URL="https://skilltwin-api-hafc.onrender.com/api/auth/linkedin/callback"`
2. **Third-Party Consoles**:
   - Ensure the production callback URLs in Google, GitHub, and LinkedIn match your live backend URL:
     `https://skilltwin-api-hafc.onrender.com/api/auth/<provider>/callback`
3. **Vercel (Frontend)**:
   - Ensure `VITE_API_URL="https://skilltwin-api-hafc.onrender.com"` is set in Vercel project environment variables.
