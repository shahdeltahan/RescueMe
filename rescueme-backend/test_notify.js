const notificationService = require('./services/notificationService');
notificationService.notifyAdmins('alert', 'Test Admin', 'This is testing notifyAdmins')
  .then(() => console.log('Done'))
  .catch(console.log)
  .finally(() => setTimeout(() => process.exit(0), 1000));
