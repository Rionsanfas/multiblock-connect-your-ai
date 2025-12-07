# Multiblock - Production Setup Guide

## Architecture Overview

```
├── src/                    # React frontend (Vite)
├── api/                    # Vercel serverless functions
├── supabase/
│   ├── functions/          # Supabase Edge Functions
│   └── migrations/         # SQL migrations
└── README.md
```

## 🔐 Environment Variables

### Vercel Environment Variables (Dashboard → Settings → Environment Variables)

```bash
# Supabase (Required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Payments - Choose one or both
POLAR_ACCESS_TOKEN=your-polar-token
POLAR_WEBHOOK_SECRET=your-polar-webhook-secret
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Email (Optional)
RESEND_API_KEY=re_xxx

# Encryption (for API key vault)
ENCRYPTION_KEY=generate-32-byte-hex-key
```

### Generate Encryption Key
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Supabase Edge Function Secrets (Dashboard → Edge Functions → Secrets)

```bash
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx
ENCRYPTION_KEY=same-as-vercel
```

## 🚀 Deployment Steps

### 1. GitHub Setup
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/multiblock.git
git push -u origin main
```

### 2. Vercel Setup
1. Import repo at vercel.com/new
2. Add all environment variables from above
3. Deploy

### 3. Supabase Setup
1. Run migrations in order (see `/supabase/migrations/`)
2. Configure Auth providers (Dashboard → Authentication → Providers)
3. Set Site URL and Redirect URLs (Dashboard → Authentication → URL Configuration)
4. Add Edge Function secrets

### 4. OAuth Configuration

#### Google OAuth
1. Google Cloud Console → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Add authorized origins: `https://your-app.vercel.app`
4. Add redirect URI: `https://your-project.supabase.co/auth/v1/callback`
5. Copy Client ID & Secret to Supabase Auth Providers

#### GitHub OAuth
1. GitHub → Settings → Developer Settings → OAuth Apps
2. Authorization callback URL: `https://your-project.supabase.co/auth/v1/callback`
3. Copy Client ID & Secret to Supabase Auth Providers

## 📦 Local Development

```bash
# Install dependencies
npm install

# Create .env.local (gitignored)
cp .env.example .env.local
# Fill in your values

# Run dev server
npm run dev
```

## 🔒 Security Checklist

- [ ] All secrets in Vercel/Supabase dashboards (never in code)
- [ ] RLS policies enabled on all tables
- [ ] Webhook signatures verified
- [ ] API keys encrypted at rest
- [ ] Rate limiting on auth endpoints
- [ ] CORS configured for production domain only

## TODO Items

- [ ] Set `VITE_SUPABASE_URL` in Vercel
- [ ] Set `VITE_SUPABASE_ANON_KEY` in Vercel
- [ ] Set `ENCRYPTION_KEY` in both Vercel and Supabase
- [ ] Configure OAuth providers in Supabase
- [ ] Set Polar/Stripe keys for payments
- [ ] Run SQL migrations in Supabase
- [ ] Configure webhook endpoints in Polar/Stripe dashboards
