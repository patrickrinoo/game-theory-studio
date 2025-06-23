# Deployment Guide - Monte Carlo Game Theory Studio

This guide covers deployment options and setup instructions for the Monte Carlo Game Theory Studio application.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Deployment Options](#deployment-options)
- [CI/CD Pipeline](#cicd-pipeline)
- [Production Optimization](#production-optimization)
- [Monitoring and Analytics](#monitoring-and-analytics)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements
- Node.js 18.x or higher
- npm 9.x or higher
- Git

### Production Environment
- HTTPS-enabled domain
- CDN (recommended)
- Error tracking service (optional)
- Analytics service (optional)

## Environment Configuration

### 1. Environment Variables

Copy `env.example` to `.env.local` and configure the following variables:

```bash
# Required
NEXT_PUBLIC_APP_URL="https://your-domain.com"
NEXT_PUBLIC_ENVIRONMENT="production"
NODE_ENV="production"

# Optional but recommended
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID="G-XXXXXXXXXX"
NEXT_PUBLIC_VERCEL_ANALYTICS_ID="your-vercel-analytics-id"
NEXT_PUBLIC_SENTRY_DSN="your-sentry-dsn"
```

### 2. Build Configuration

The application is optimized for production with:
- **Compression**: Gzip/Brotli compression enabled
- **Minification**: JavaScript and CSS minification
- **Code Splitting**: Automatic code splitting for optimal loading
- **Security Headers**: CSP, XSS protection, and other security measures
- **Performance**: SWC compiler for faster builds

## Deployment Options

### Option 1: Vercel (Recommended)

Vercel is the recommended platform for Next.js applications.

#### Automatic Deployment

1. **Connect Repository**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Import your GitHub repository
   - Configure project settings

2. **Environment Variables**:
   ```bash
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   NEXT_PUBLIC_ENVIRONMENT=production
   ```

3. **Domain Configuration**:
   - Add custom domain in Vercel dashboard
   - Configure DNS records
   - SSL is automatically handled

#### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod

# Set environment variables
vercel env add NEXT_PUBLIC_APP_URL production
```

### Option 2: Netlify

1. **Build Configuration** (netlify.toml):
   ```toml
   [build]
     command = "npm run build"
     publish = ".next"
   
   [[headers]]
     for = "/*"
     [headers.values]
       X-Frame-Options = "DENY"
       X-Content-Type-Options = "nosniff"
   ```

2. **Deploy**:
   - Connect GitHub repository
   - Set build command: `npm run build`
   - Set publish directory: `.next`

### Option 3: Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000

CMD ["node", "server.js"]
```

### Option 4: Static Export (GitHub Pages)

For static deployment without server-side features:

1. **Configure for static export**:
   ```javascript
   // next.config.mjs
   const nextConfig = {
     output: 'export',
     trailingSlash: true,
     images: {
       unoptimized: true,
     },
   }
   ```

2. **Build and export**:
   ```bash
   npm run build
   ```

3. **Deploy to GitHub Pages**:
   - Enable GitHub Pages in repository settings
   - Set source to GitHub Actions
   - Use the provided workflow

## CI/CD Pipeline

### GitHub Actions Workflow

The project includes a comprehensive CI/CD pipeline (`.github/workflows/deploy.yml`) that:

1. **Testing Phase**:
   - Runs linting
   - Executes unit tests
   - Performs integration tests
   - Runs performance benchmarks
   - Executes E2E tests with Playwright

2. **Build Phase**:
   - Builds the application
   - Optimizes for production
   - Uploads build artifacts

3. **Deployment Phase**:
   - Deploys to staging (PR previews)
   - Deploys to production (main branch)

4. **Security Phase**:
   - Runs npm audit
   - Performs dependency review

### Required Secrets

Configure these secrets in your GitHub repository:

```bash
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-org-id
VERCEL_PROJECT_ID=your-project-id
```

## Production Optimization

### Performance Features

1. **Bundle Optimization**:
   - Tree shaking for unused code elimination
   - Dynamic imports for code splitting
   - Webpack optimization for chunk splitting

2. **Caching Strategy**:
   - Static assets: 1 year cache
   - API responses: 60 seconds with stale-while-revalidate
   - Images: 24 hours cache

3. **Compression**:
   - Gzip/Brotli compression enabled
   - Minified CSS and JavaScript
   - Optimized images

### Security Features

1. **Security Headers**:
   - Content Security Policy (CSP)
   - X-Frame-Options: DENY
   - X-Content-Type-Options: nosniff
   - XSS Protection

2. **HTTPS**:
   - Automatic SSL/TLS with Vercel
   - HTTP to HTTPS redirects
   - Security header enforcement

## Monitoring and Analytics

### Performance Monitoring

1. **Vercel Analytics** (Recommended):
   ```bash
   NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your-analytics-id
   ```

2. **Google Analytics**:
   ```bash
   NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
   ```

### Error Tracking

1. **Sentry Integration**:
   ```bash
   NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
   SENTRY_AUTH_TOKEN=your-auth-token
   ```

### Core Web Vitals

Monitor these key metrics:
- **Largest Contentful Paint (LCP)**: < 2.5s
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1

## Troubleshooting

### Common Issues

1. **Build Failures**:
   ```bash
   # Clear cache and reinstall
   rm -rf .next node_modules
   npm install
   npm run build
   ```

2. **Environment Variables Not Loading**:
   - Ensure variables start with `NEXT_PUBLIC_` for client-side access
   - Restart development server after adding variables
   - Check variable names for typos

3. **Performance Issues**:
   - Enable production optimizations
   - Check bundle size with `npm run analyze`
   - Optimize images and assets

4. **Deployment Failures**:
   - Check build logs for errors
   - Verify environment variables are set
   - Ensure all dependencies are in `package.json`

### Support

For deployment issues:
1. Check the deployment logs
2. Verify all environment variables
3. Test the build locally first
4. Review the troubleshooting section

## Additional Resources

- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [Performance Best Practices](https://web.dev/performance/)
- [Security Headers Guide](https://securityheaders.com/)

---

**Note**: This deployment guide assumes you're deploying to a production environment. For development deployment, refer to the development setup in the main README. 