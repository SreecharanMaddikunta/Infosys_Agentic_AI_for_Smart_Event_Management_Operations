class NotificationService {
  /**
   * Dispatch an operational alert based on priority/severity
   * @param {Object} alert 
   * @param {string} alert.type - 'Critical', 'High', 'Medium', 'Informational'
   * @param {string} alert.message - The message to dispatch
   * @param {Object} alert.context - Additional contextual data (e.g., incidentId)
   */
  static async dispatch(alert) {
    const { type, message, context } = alert;

    switch (type) {
      case 'Critical':
        // Requires immediate action: SMS/Push to management & responsible team
        console.warn(`[CRITICAL ALERT]: ${message}`, context);
        await this.sendSMS(message);
        await this.sendPushNotification(message);
        break;

      case 'High':
        // Push/email to responsible team
        console.warn(`[HIGH ALERT]: ${message}`, context);
        await this.sendEmail(message);
        await this.sendPushNotification(message);
        break;

      case 'Medium':
        // In-app dashboard notification
        console.info(`[MEDIUM ALERT]: ${message}`, context);
        await this.logToDashboard(message, type, context);
        break;

      case 'Informational':
      default:
        // Logged in dashboard feed without interruption
        console.log(`[INFO ALERT]: ${message}`, context);
        await this.logToDashboard(message, type, context);
        break;
    }
  }

  // Mock implementations for dispatch mechanisms
  static async sendSMS(message) {
    console.log(`Simulating SMS send: ${message}`);
    // Integrations like Twilio would go here
  }

  static async sendEmail(message) {
    console.log(`Simulating Email send: ${message}`);
    // Integrations like SendGrid/Nodemailer would go here
  }

  static async sendPushNotification(message) {
    console.log(`Simulating Push Notification: ${message}`);
    // Integrations like Firebase Cloud Messaging would go here
  }

  static async logToDashboard(message, type, context) {
    console.log(`Logging to Dashboard feed [${type}]: ${message}`);
    // In a real implementation, this might push to a Redis pub/sub channel,
    // save to a database table for notifications, or emit via WebSockets
  }
}

module.exports = NotificationService;
