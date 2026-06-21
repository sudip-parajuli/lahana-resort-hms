# Showcase Free Hosting Guide — Lahana Resort HMS

This guide explains how to deploy and host the **Lahana Resort Management System (HMS)** completely for free using modern cloud platforms. This setup is optimized for showcasing the project to clients, staging, and demo purposes.

---

## 🏗️ Deployment Architecture

For a zero-cost demonstration environment, we utilize the following free-tier services:

```mermaid
graph TD
    Client[Web Browser / PWA client] -->|HTTPS| Vercel[Next.js Frontend on Vercel]
    Vercel -->|API Requests| Render[Django Backend on Render / Fly.io]
    Render -->|SQL Queries| Supabase[PostgreSQL DB on Supabase]
    Render -->|Cache / Celery broker| Upstash[Redis on Upstash]
    Render -->|Transactional SMTP| Resend[Email delivery on Resend]
    Render -->|Error Logs| Sentry[Error tracking on Sentry]
```

| Component | Cloud Provider | Free Tier Allowances | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend** | **Vercel** | Unlimited Bandwidth (Personal Tier) | Next.js Server & static hosting |
| **Backend** | **Render.com / Fly.io** | 500 free build minutes / 750 run hours | Django server runtime |
| **Database** | **Supabase** | 2 free databases (500MB storage) | Production PostgreSQL instance |
| **Redis & Broker** | **Upstash** | 10,000 requests per day | Celery task queue & Django caching |
| **Email SMTP** | **Resend** | 3,000 emails per month (100/day) | Reservation confirmations & reports |
| **Error Tracking** | **Sentry** | 5,000 events per month | Real-time crash and traceback logs |
| **Analytics** | **PostHog** | 1,000,000 events per month | User interaction charts and session recording |

---

## 🛠️ Step-by-Step Configuration

### 1. Database Setup (Supabase)
1. Go to [supabase.com](https://supabase.com) and create a free account.
2. Create a new project named `lahana-resort-hms`.
3. Set your database password securely.
4. Once provisioned, navigate to **Project Settings** > **Database** > **Connection Strings**.
5. Copy the **URI / Connection string**. Select the **Transaction Pooler** (port `6543`) mode to avoid exhaustion of connection limits on the free tier.
   - Example: `postgres://postgres.xxxx:[Password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require`

### 2. Redis & Broker Setup (Upstash)
1. Go to [upstash.com](https://upstash.com) and sign up.
2. Click **Create Database**.
3. Choose **Redis**, name it `lahana-hms-cache`, and select your region.
4. Copy the **Redis URL** under the Connection Details.
   - Example: `rediss://default:xxxx@us1-active-panda-xxxx.upstash.io:6379`
   - *Note: Ensure you use `rediss://` (with double 's' for SSL) to connect securely from cloud environments.*

### 3. SMTP Email Setup (Resend)
1. Go to [resend.com](https://resend.com) and create an account.
2. Verify your custom domain (e.g., `lahanaresort.com.np`) by adding the SPF/DKIM DNS records on your domain registrar.
3. Generate an API Key under **API Keys**.
4. Use the following SMTP settings in your backend:
   - **SMTP Host:** `smtp.resend.com`
   - **SMTP Port:** `587` (TLS)
   - **SMTP User:** `resend`
   - **SMTP Password:** `[Your-Resend-API-Key]`

### 4. Backend Deployment (Render / Fly.io)

We recommend **Render** due to its simple GitHub integration:
1. Go to [dashboard.render.com](https://dashboard.render.com) and link your GitHub repository.
2. Click **New** > **Web Service**.
3. Select your `lahana-resort-hms` repository.
4. Use the following configuration:
   - **Environment:** `Python`
   - **Build Command:** `pip install -r backend/requirements/base.txt && pip install -r backend/requirements/production.txt`
   - **Start Command:** `gunicorn --bind 0.0.0.0:$PORT --chdir backend config.wsgi:application`
5. Click **Advanced** and add the environment variables listed below.
6. Once the service builds, Render will give you a public URL (e.g., `https://lahana-backend.onrender.com`).

### 5. Frontend Deployment (Vercel)
1. Go to [vercel.com](https://vercel.com) and log in.
2. Click **Add New** > **Project** and select your GitHub repository.
3. Set the **Root Directory** to `frontend`.
4. Vercel will automatically detect Next.js settings.
5. In **Environment Variables**, add the required variables.
6. Click **Deploy**. Vercel will build and host your site.
7. To access the subdomain locally, use `http://lahana.localhost:3000`. In production, bind a wildcard DNS or a subdomain (e.g. `lahana.yourdomain.com`) on **Cloudflare** for free.

---

## 🔑 Environment Variables Checklist

### Backend environment variables (on Render / Fly.io)
Add these variables in your backend dashboard config:

```bash
# Core settings
DJANGO_SETTINGS_MODULE=config.settings.production
DJANGO_SECRET_KEY=your-secure-production-random-key
DJANGO_DEBUG=False
ALLOWED_HOSTS=lahana-backend.onrender.com,localhost,127.0.0.1,.vercel.app

# Deployment mode
DEPLOYMENT_MODE=single_tenant
SINGLE_TENANT_SCHEMA=lahana_resort
IS_SAAS=False

# Supabase database connection string (Parsed automatically by dj-database-url)
DATABASE_URL=postgres://postgres.xxxx:[Password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require

# Upstash Redis URLs
REDIS_URL=rediss://default:xxxx@us1-active-panda-xxxx.upstash.io:6379
CELERY_BROKER_URL=rediss://default:xxxx@us1-active-panda-xxxx.upstash.io:6379/0

# Resend SMTP Configuration
EMAIL_HOST=smtp.resend.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=resend
EMAIL_HOST_PASSWORD=re_xxxx_xxxx
DEFAULT_FROM_EMAIL=Lahana Resort <bookings@yourverifieddomain.com>

# Sentry
SENTRY_DSN=https://xxxx@o12345.ingest.sentry.io/12345
```

### Frontend environment variables (on Vercel)
Add these variables in your Vercel project configuration:

```bash
# Mode config
NEXT_PUBLIC_DEPLOYMENT_MODE=single_tenant
NEXT_PUBLIC_PROPERTY_NAME=Lahana Resort
NEXT_PUBLIC_PROPERTY_LOGO_URL=/lahana-logo.png

# APIs URLs (Point to your Render backend URL)
NEXT_PUBLIC_API_URL=https://lahana-backend.onrender.com
NEXT_PUBLIC_WS_URL=wss://lahana-backend.onrender.com

# NextAuth config
NEXTAUTH_SECRET=your-nextauth-secret-string
NEXTAUTH_URL=https://lahana-resort.vercel.app
```

---

## 🚀 Post-Deployment Database Migration
Once the Render backend and Supabase database are running:
1. Connect to the Render shell or use the command runner.
2. Run Django migrations:
   ```bash
   python backend/manage.py migrate
   ```
3. Run the database seed script to populate the `lahana_resort` single tenant schemas and create user logins:
   ```bash
   python backend/manage.py shell -c "import seed_lahana; seed_lahana.run()"
   ```
4. Now, the managers, receptionists, waiters, and housekeepers can log in using their credentials (e.g. `manager@lahana.com` / `LahanaPassword123!`).
