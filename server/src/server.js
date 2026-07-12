require('dotenv').config();
const app = require('./app');
const { startNotificationCron } = require('./jobs/notificationCron');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 TransitOps API running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  if (process.env.NODE_ENV !== 'test') startNotificationCron();
});
