import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import pool from './config/database';

// Import routes
import authRoutes from './routes/auth.routes';
import clientRoutes from './routes/client.routes';
import employeeRoutes from './routes/employee.routes';
import partnerRoutes from './routes/partner.routes';
import projectRoutes from './routes/project.routes';
import contractRoutes from './routes/contract.routes';
import assignmentPlanRoutes from './routes/assignment-plan.routes';
import workRecordRoutes from './routes/work-record.routes';
import monthlyCostRoutes from './routes/monthly-cost.routes';
import expenseRoutes from './routes/expense.routes';
import revenueRoutes from './routes/revenue.routes';
import reportRoutes from './routes/report.routes';
import dashboardRoutes from './routes/dashboard.routes';

// Error handler
import { errorHandler } from './middleware/error-handler';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/clients', clientRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/partners', partnerRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/contracts', contractRoutes);
app.use('/api/v1/assignment-plans', assignmentPlanRoutes);
app.use('/api/v1/work-records', workRecordRoutes);
app.use('/api/v1/monthly-actual-costs', monthlyCostRoutes);
app.use('/api/v1/expenses', expenseRoutes);
app.use('/api/v1/revenues', revenueRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await pool.end();
  process.exit(0);
});

export default app;
