# Deployment Guide - Vercel

This guide will help you deploy the Wine Tasting Game to Vercel.

## Prerequisites

1. **GitHub Account** - Code needs to be in a GitHub repository
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
3. **Database** - PostgreSQL database (recommendations below)
4. **Redis** - Redis instance (recommendations below)
5. **OpenAI API Key** - Get from [OpenAI](https://platform.openai.com)

## Step 1: Set Up External Services

### Database (PostgreSQL)
Choose one of these managed PostgreSQL services:

**Option A: Supabase (Recommended)**
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string (starts with `postgresql://`)

**Option B: PlanetScale**
1. Go to [planetscale.com](https://planetscale.com)
2. Create a new database
3. Create a connection string

**Option C: Neon**
1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string

### Redis Cache
Choose one of these managed Redis services:

**Option A: Upstash (Recommended)**
1. Go to [upstash.com](https://upstash.com)
2. Create a new Redis database
3. Copy the Redis URL (starts with `rediss://`)

**Option B: Redis Labs**
1. Go to [redis.com](https://redis.com)
2. Create a new database
3. Copy the connection string

### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com)
2. Create an account or sign in
3. Go to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-`)

## Step 2: Push Code to GitHub

```bash
# Initialize git repository (if not already done)
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial wine tasting game implementation"

# Add GitHub remote (replace with your repository URL)
git remote add origin https://github.com/yourusername/wine-tasting-game.git

# Push to GitHub
git push -u origin main
```

## Step 3: Deploy to Vercel

### Method A: Vercel Dashboard (Recommended)

1. **Connect Repository**
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Click "Deploy"

2. **Configure Environment Variables**
   - Go to your project dashboard
   - Click "Settings" → "Environment Variables"
   - Add the following variables:

   ```
   DATABASE_URL=postgresql://your-database-connection-string
   REDIS_URL=rediss://your-redis-connection-string
   OPENAI_API_KEY=sk-your-openai-api-key
   NEXTAUTH_SECRET=generate-a-secure-random-string-32-chars
   JWT_SECRET=generate-another-secure-random-string-32-chars
   NODE_ENV=production
   ```

   **To generate secure secrets:**
   ```bash
   # Generate random secrets
   openssl rand -hex 32
   ```

3. **Optional: Google OAuth**
   - If you want Google login, add:
   ```
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

4. **Deploy**
   - After adding environment variables, trigger a new deployment
   - Go to "Deployments" tab and click "Redeploy"

### Method B: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts to configure project
```

## Step 4: Initialize Database

After successful deployment, you need to set up the database schema:

1. **Install Vercel CLI** (if not already installed)
   ```bash
   npm install -g vercel
   ```

2. **Link your project**
   ```bash
   vercel link
   ```

3. **Run database migrations**
   ```bash
   vercel env pull .env.local
   npx prisma db push
   ```

   Or use the Vercel dashboard:
   - Go to your project settings
   - Functions → Add function
   - Create a serverless function to run `prisma db push`

## Step 5: Verify Deployment

1. **Check the live site**
   - Your app will be available at `https://your-project-name.vercel.app`
   - Test the landing page loads correctly

2. **Test core functionality**
   - Director registration and login
   - Game creation
   - Player joining (test with different browsers/devices)

3. **Check logs**
   - Go to Vercel dashboard → Functions → View logs
   - Look for any errors during deployment or runtime

## Step 6: Custom Domain (Optional)

1. **Add custom domain**
   - Go to project settings → Domains
   - Add your custom domain
   - Configure DNS settings as instructed

2. **Update environment variables**
   - Update `NEXTAUTH_URL` to your custom domain

## Troubleshooting

### Common Issues

**Database Connection Errors**
- Verify `DATABASE_URL` is correct
- Ensure database allows connections from Vercel IPs
- Check database credentials and permissions

**OpenAI API Errors**
- Verify `OPENAI_API_KEY` is correct
- Check OpenAI account has available credits
- Ensure API key has proper permissions

**Socket.io Connection Issues**
- Note: Full Socket.io functionality may be limited on Vercel
- Consider upgrading to Vercel Pro for better WebSocket support
- Alternative: Use polling transport for real-time features

**Build Errors**
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify TypeScript compilation passes locally

### Performance Optimization

1. **Database Connection Pooling**
   - Use connection pooling for better performance
   - Consider PgBouncer for PostgreSQL

2. **Redis Configuration**
   - Set appropriate TTL values
   - Use Redis for session storage

3. **Caching**
   - Leverage Vercel's edge caching
   - Set appropriate cache headers

## Environment Variables Reference

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | `postgresql://user:pass@host:5432/db` |
| `REDIS_URL` | Redis connection string | Yes | `rediss://user:pass@host:6379` |
| `OPENAI_API_KEY` | OpenAI API key | Yes | `sk-...` |
| `NEXTAUTH_SECRET` | NextAuth.js secret | Yes | `random-32-char-string` |
| `JWT_SECRET` | JWT signing secret | Yes | `random-32-char-string` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | No | `123456789.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | No | `GOCSPX-...` |
| `NODE_ENV` | Environment | Yes | `production` |

## Support

If you encounter issues:

1. Check Vercel deployment logs
2. Verify all environment variables are set correctly
3. Test database and Redis connections independently
4. Review the application logs for specific error messages

## Next Steps

After successful deployment:

1. **Monitor performance** - Use Vercel Analytics
2. **Set up monitoring** - Consider error tracking (Sentry, etc.)
3. **Configure backups** - Set up database backups
4. **Test scaling** - Verify application handles multiple concurrent users
5. **Security review** - Ensure all secrets are properly configured