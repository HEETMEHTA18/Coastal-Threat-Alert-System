const twilio = require('twilio');

class SMSService {
  constructor() {
    this.client = null;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
    
    // Initialize Twilio client if credentials are available and valid
    if (process.env.TWILIO_ACCOUNT_SID && 
        process.env.TWILIO_AUTH_TOKEN && 
        process.env.TWILIO_ACCOUNT_SID.startsWith('AC')) {
      this.client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    } else {
      console.warn('Twilio credentials not found or invalid. SMS service will use simulation mode.');
    }
  }

  /**
   * Send SMS to a single recipient
   * @param {string} to - Phone number to send to
   * @param {string} message - Message content
   * @param {boolean} urgentAlert - Whether this is an urgent alert
   * @returns {Promise<Object>} Result of SMS send
   */
  async sendSMS(to, message, urgentAlert = false) {
    try {
      if (!this.client) {
        return await this.simulateSMS(to, message, urgentAlert);
      }

      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: to,
        ...(urgentAlert && {
          // For urgent alerts, you might want to use different settings
          // messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID
        })
      });

      return {
        success: true,
        messageId: result.sid,
        status: result.status,
        to: to,
        sentAt: new Date(),
        provider: 'twilio'
      };

    } catch (error) {
      console.error(`SMS send error to ${to}:`, error);
      return {
        success: false,
        error: error.message,
        to: to,
        sentAt: new Date(),
        provider: 'twilio'
      };
    }
  }

  /**
   * Send bulk SMS to multiple recipients
   * @param {Array<string>} recipients - Array of phone numbers
   * @param {string} message - Message content
   * @param {boolean} urgentAlert - Whether this is an urgent alert
   * @returns {Promise<Object>} Bulk send results
   */
  async sendBulkSMS(recipients, message, urgentAlert = false) {
    const results = {
      total: recipients.length,
      successful: 0,
      failed: 0,
      details: []
    };

    // Send SMS in batches to avoid rate limiting
    const batchSize = 10;
    const batches = [];
    for (let i = 0; i < recipients.length; i += batchSize) {
      batches.push(recipients.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      const batchPromises = batch.map(async (recipient) => {
        const result = await this.sendSMS(recipient, message, urgentAlert);
        if (result.success) {
          results.successful++;
        } else {
          results.failed++;
        }
        results.details.push(result);
        return result;
      });

      await Promise.all(batchPromises);
      
      // Add delay between batches to respect rate limits
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  /**
   * Send location-based emergency SMS alerts
   * @param {Object} report - Community report object
   * @param {Array<string>} recipients - Phone numbers of people in the area
   * @param {string} customMessage - Optional custom message
   * @returns {Promise<Object>} Send results
   */
  async sendEmergencyAlert(report, recipients, customMessage = null) {
    try {
      const message = customMessage || this.generateEmergencyMessage(report);
      const urgentAlert = report.severity === 'critical' || report.emergencyDetails.immediateRisk;

      const results = await this.sendBulkSMS(recipients, message, urgentAlert);

      // Log emergency alert
      console.log(`Emergency SMS Alert sent for report ${report.reportId}:`);
      console.log(`- Recipients: ${results.total}`);
      console.log(`- Successful: ${results.successful}`);
      console.log(`- Failed: ${results.failed}`);
      console.log(`- Urgent: ${urgentAlert}`);
      console.log(`- Message: ${message.substring(0, 100)}...`);

      return {
        ...results,
        reportId: report.reportId,
        urgentAlert,
        message,
        sentAt: new Date()
      };

    } catch (error) {
      console.error('Emergency alert send error:', error);
      throw error;
    }
  }

  /**
   * Generate emergency message based on report
   * @param {Object} report - Community report object
   * @returns {string} Formatted emergency message
   */
  generateEmergencyMessage(report) {
    const urgencyPrefix = report.severity === 'critical' ? '🚨 EMERGENCY: ' : 
                         report.severity === 'high' ? '⚠️ URGENT ALERT: ' : 
                         '📢 COMMUNITY ALERT: ';
    
    const location = report.location.split(',')[0].trim();
    
    let message = `${urgencyPrefix}${report.title} reported near ${location}.`;
    
    // Add specific instructions based on report type
    if (report.reportType === 'weather' && report.severity === 'critical') {
      message += ' Seek immediate shelter. Avoid outdoor activities.';
    } else if (report.reportType === 'coastal' && report.emergencyDetails.evacuationNeeded) {
      message += ' Consider evacuation from low-lying areas.';
    } else if (report.reportType === 'infrastructure') {
      message += ' Avoid the affected area. Use alternate routes.';
    } else if (report.reportType === 'marine') {
      message += ' Stay away from water. Boaters return to shore immediately.';
    }
    
    message += ` Report ID: ${report.reportId}. Stay safe and follow local authorities.`;
    
    // Ensure message is within SMS length limits (160 characters for standard SMS)
    if (message.length > 160) {
      // Truncate while keeping essential information
      const essentialPart = `${urgencyPrefix}${report.title} near ${location}. Report: ${report.reportId}. Stay safe.`;
      message = essentialPart;
    }
    
    return message;
  }

  /**
   * Find recipients within radius of coordinates
   * In a real implementation, this would query a user database
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude  
   * @param {number} radius - Radius in kilometers
   * @returns {Promise<Array<string>>} Array of phone numbers
   */
  async findRecipientsInRadius(lat, lng, radius) {
    try {
      // In a real implementation, this would:
      // 1. Query user database for users within radius
      // 2. Filter for users who opted in to SMS alerts
      // 3. Return their phone numbers
      
      // For now, simulate based on population density
      const estimatedPeople = Math.round(radius * radius * 3.14 * 50); // Rough estimate
      const appUsers = Math.round(estimatedPeople * 0.1); // 10% have the app
      const optedInUsers = Math.round(appUsers * 0.8); // 80% opted in to SMS
      
      // Generate sample phone numbers (in production, these would be real)
      const recipients = [];
      for (let i = 0; i < Math.min(optedInUsers, 500); i++) { // Cap at 500 for demo
        recipients.push(`+91${Math.floor(Math.random() * 9000000000) + 1000000000}`);
      }
      
      return recipients;
      
    } catch (error) {
      console.error('Error finding recipients:', error);
      return [];
    }
  }

  /**
   * Simulate SMS sending when no real SMS service is configured
   * @param {string} to - Phone number
   * @param {string} message - Message content
   * @param {boolean} urgentAlert - Whether urgent
   * @returns {Promise<Object>} Simulated result
   */
  async simulateSMS(to, message, urgentAlert = false) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100));
    
    // Simulate 95% success rate
    const success = Math.random() > 0.05;
    
    return {
      success,
      messageId: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: success ? 'sent' : 'failed',
      to,
      sentAt: new Date(),
      provider: 'simulation',
      ...(urgentAlert && { urgentAlert: true }),
      ...(!success && { error: 'Simulated network error' })
    };
  }

  /**
   * Get SMS service status and configuration
   * @returns {Object} Service status
   */
  getServiceStatus() {
    return {
      provider: this.client ? 'twilio' : 'simulation',
      configured: !!this.client,
      fromNumber: this.fromNumber,
      capabilities: {
        singleSMS: true,
        bulkSMS: true,
        emergencyAlerts: true,
        scheduling: !!this.client,
        deliveryReceipts: !!this.client
      }
    };
  }

  /**
   * Validate phone number format
   * @param {string} phoneNumber - Phone number to validate
   * @returns {boolean} Whether phone number is valid
   */
  validatePhoneNumber(phoneNumber) {
    // Basic international phone number validation
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber.replace(/\s/g, ''));
  }

  /**
   * Format phone number to international format
   * @param {string} phoneNumber - Phone number to format
   * @param {string} defaultCountryCode - Default country code if not present
   * @returns {string} Formatted phone number
   */
  formatPhoneNumber(phoneNumber, defaultCountryCode = '+91') {
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    if (cleaned.startsWith('91')) {
      return `+${cleaned}`;
    } else if (cleaned.length === 10) {
      return `${defaultCountryCode}${cleaned}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
      return `${defaultCountryCode}${cleaned.substr(1)}`;
    }
    
    return phoneNumber; // Return as-is if can't format
  }
}

module.exports = SMSService;
