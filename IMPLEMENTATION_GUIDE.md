# Production Readiness - Implementation Guide

## Quick Implementation Checklist

### ✅ Phase 1: Critical Security & Stability Fixes

---

## 1. Standardized Error Response Structure

### Problem
Different endpoints return different error formats, making frontend error handling inconsistent.

### Solution - Create Error Types

**File: `server/src/utils/errors.ts`**
```typescript
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMIT: 'RATE_LIMIT',
} as const;
```

**Update: `server/src/server.ts` - Error Handler**
```typescript
// Replace existing error handler with:
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Error:', err);
  
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: process.env.NODE_ENV === 'development' ? err.details : undefined,
      },
    });
  }

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    },
  });
});
```

---

## 2. Add Security Headers with Helmet

**Installation:**
```bash
cd server
npm install helmet
```

**Update: `server/src/server.ts`**
```typescript
import helmet from 'helmet';

// Add after middleware setup
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: ["'self'"],
  },
}));
```

---

## 3. Add Rate Limiting

**Installation:**
```bash
npm install express-rate-limit
```

**Create: `server/src/middleware/rateLimiter.ts`**
```typescript
import rateLimit from 'express-rate-limit';

export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Stricter for auth endpoints
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
});
```

**Update: `server/src/server.ts`**
```typescript
import { limiter, authLimiter } from './middleware/rateLimiter.js';

app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);
```

---

## 4. Add Input Sanitization

**Installation:**
```bash
npm install express-mongo-sanitize xss-clean validator
```

**Update: `server/src/server.ts`**
```typescript
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';

app.use(mongoSanitize()); // Sanitize NoSQL injection
app.use(xss()); // Sanitize XSS attacks
```

---

## 5. Add Logging Service

**Create: `server/src/services/logger.ts`**
```typescript
import fs from 'fs';
import path from 'path';

const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

export const Logger = {
  info: (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const log = `[${timestamp}] INFO: ${message}`;
    console.log(log, data || '');
    fs.appendFileSync(path.join(logDir, 'app.log'), log + '\n');
  },

  error: (message: string, error?: any) => {
    const timestamp = new Date().toISOString();
    const errorMsg = error?.message || JSON.stringify(error);
    const log = `[${timestamp}] ERROR: ${message} - ${errorMsg}`;
    console.error(log);
    fs.appendFileSync(path.join(logDir, 'error.log'), log + '\n');
  },

  warn: (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const log = `[${timestamp}] WARN: ${message}`;
    console.warn(log, data || '');
    fs.appendFileSync(path.join(logDir, 'app.log'), log + '\n');
  },
};
```

---

## 6. Environment Configuration

**Create: `server/.env.example`**
```env
# Database
MONGODB_URI=mongodb://localhost:27017/skillshare

# JWT
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRE=7d

# API Server
PORT=5000
NODE_ENV=development

# Frontend
FRONTEND_URL=http://localhost:5173

# AI
GEMINI_API_KEY=your_gemini_api_key_here

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_password

# Sentry (optional error tracking)
SENTRY_DSN=
```

**Create: `server/src/utils/validateEnv.ts`**
```typescript
export const validateEnv = () => {
  const requiredVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'GEMINI_API_KEY',
  ];

  const missing = requiredVars.filter(v => !process.env[v]);
  
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  console.log('✅ Environment variables validated');
};
```

**Update: `server/src/server.ts`**
```typescript
import { validateEnv } from './utils/validateEnv.js';

// At top of file after dotenv.config()
validateEnv();
```

---

## 7. Frontend Error Boundary

**Create: `components/ErrorBoundary.tsx`**
```typescript
import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 dark:bg-red-900/10">
          <div className="p-6 bg-white dark:bg-zinc-800 rounded-lg shadow-lg max-w-md">
            <h1 className="text-2xl font-bold text-red-600 mb-2">Oops! Something went wrong</h1>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## 8. Improve API Error Handling

**Update: `services/apiClient.ts`**
```typescript
export const apiClient = {
  // ... existing code ...

  async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(options.method !== 'GET'),
          ...(options.headers as Record<string, string>),
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error(`API Error: ${url}`, error);
      throw error;
    }
  },
};
```

---

## 9. Add Toast Notifications for Errors

**Installation:**
```bash
npm install react-toastify
```

**Update: `App.tsx`**
```typescript
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const App: React.FC = () => {
  // ... existing code ...

  return (
    <ErrorBoundary>
      <div className="App">
        {/* existing JSX */}
        <ToastContainer
          position="bottom-right"
          autoClose={4000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme={theme === 'dark' ? 'dark' : 'light'}
        />
      </div>
    </ErrorBoundary>
  );
};
```

---

## 10. API Documentation with Swagger

**Installation:**
```bash
npm install swagger-jsdoc swagger-ui-express
npm install --save-dev @types/swagger-jsdoc @types/swagger-ui-express
```

**Create: `server/src/swagger.ts`**
```typescript
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Skill Share API',
      version: '1.0.0',
      description: 'P2P Learning Platform API',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
```

**Update: `server/src/server.ts`**
```typescript
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger.js';

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
```

---

## Implementation Order

1. **Day 1:** Add helmet, rate limiting, input sanitization
2. **Day 1:** Setup environment variables and validation
3. **Day 2:** Implement standardized error responses
4. **Day 2:** Add logging service
5. **Day 3:** Frontend error boundary and toast notifications
6. **Day 3:** Improve API error handling in apiClient
7. **Day 4:** Add Swagger documentation

---

## Testing the Changes

```bash
# Test rate limiting
for i in {1..6}; do curl http://localhost:5000/api/auth/login; done

# Check security headers
curl -I http://localhost:5000/api/posts

# Test error responses
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid"}'
```

---

## Deployment Checklist

- [ ] All environment variables configured
- [ ] Logging configured and monitored
- [ ] Rate limiting enabled
- [ ] Security headers active
- [ ] Input validation in place
- [ ] Error handling tested
- [ ] API documentation accessible
- [ ] Database backups configured
- [ ] Monitoring alerts set up
- [ ] HTTPS certificate installed
