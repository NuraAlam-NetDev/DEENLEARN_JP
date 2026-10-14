import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import routes from './routes/index.js';
import { apiLimiter } from './middleware/rateLimiters.js';
import { notFound, errorHandler, requestId } from './middleware/errorHandler.js';
import { sanitizeInput } from './middleware/sanitize.js';
import { stripeWebhook } from './controllers/paymentController.js';

const app = express();

// Query strings stay flat: ?q[$ne]=x is just a string, it can never become an object
app.set('query parser', 'simple');

// Behind a proxy/load balancer (Render, Railway, Nginx...) so rate limiting sees real IPs
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);

app.use(requestId);
app.use(helmet());

const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin(origin, cb) {
      // allow same-origin / curl / server-to-server (no Origin header)
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true, // needed so the browser sends/accepts auth cookies
  })
);

// Stripe signs the EXACT bytes it sent, so this route must read the raw body.
// It is mounted before express.json, which would otherwise parse (and change) the body.
app.post('/api/payments/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

// Most bodies are tiny (32kb leaves room for long Bengali/Arabic text, 3 bytes per character).
// Rich-text lessons and quizzes (up to 40 questions) can be large, so only those get the bigger limit.
const smallJson = express.json({ limit: '32kb' });
const lessonJson = express.json({ limit: '600kb' });
const LESSON_BODY = /^\/api\/teacher\/(courses\/[a-f\d]{24}\/lessons|lessons\/[a-f\d]{24}(\/quiz)?)\/?$/i;
app.use((req, res, next) => (LESSON_BODY.test(req.path) ? lessonJson : smallJson)(req, res, next));
app.use(cookieParser());

// Clean body and query before any route sees them (XSS and NoSQL operator protection)
app.use(sanitizeInput);

app.get('/', (_req, res) => res.json({ name: 'Deenlearn API', health: '/api/health' }));
app.use('/api', apiLimiter, routes);

app.use(notFound);
app.use(errorHandler);

export default app;
