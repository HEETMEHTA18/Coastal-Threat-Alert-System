const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.sender = process.env.GMAIL_USER;
    this.operatorEmail = process.env.OPERATOR_EMAIL || this.sender;

    this.initTransporter();
  }

  initTransporter() {
    const hasOAuth = 
      process.env.GMAIL_USER && 
      process.env.GMAIL_CLIENT_ID && 
      process.env.GMAIL_CLIENT_SECRET && 
      process.env.GMAIL_REFRESH_TOKEN;

    const hasAppPassword = 
      process.env.GMAIL_USER && 
      process.env.GMAIL_PASS;

    if (hasOAuth) {
      console.log('✉️ Initializing Gmail OAuth2 transport for Email Service...');
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: process.env.GMAIL_USER,
          clientId: process.env.GMAIL_CLIENT_ID,
          clientSecret: process.env.GMAIL_CLIENT_SECRET,
          refreshToken: process.env.GMAIL_REFRESH_TOKEN
        }
      });
    } else if (hasAppPassword) {
      console.log('✉️ Initializing Gmail SMTP App Password transport for Email Service...');
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS
        }
      });
    } else {
      console.warn('⚠️ Gmail credentials not found in environment variables. Email service will run in SIMULATION mode.');
    }
  }

  /**
   * Send notification for a newly submitted community report
   * @param {Object} report - The normalized report object
   */
  async sendReportNotification(report) {
    const reporterEmail = report.contactEmail;
    const reportUrl = `${process.env.FRONTEND_URL || 'https://coastalguardian.vercel.app'}/dashboard/reports`;

    // 1. Send Confirmation Email to Reporter (if email provided)
    if (reporterEmail) {
      const reporterSubject = `[Coastal Guardian] Report Received: ${report.title}`;
      const reporterHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-lg: 8px;">
          <h2 style="color: #0284c7; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">🌊 Coastal Guardian Alert System</h2>
          <p>Hello <strong>${report.contactName || 'Citizen'}</strong>,</p>
          <p>Thank you for submitting a report. Your observation helps protect our coastal ecosystems and communities.</p>
          
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0284c7;">
            <p style="margin: 0 0 10px 0;"><strong>Report Details:</strong></p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 5px 0; color: #475569; width: 120px;"><strong>ID:</strong></td>
                <td>${report.reportId}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #475569;"><strong>Title:</strong></td>
                <td>${report.title}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #475569;"><strong>Type:</strong></td>
                <td>${report.reportType}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #475569;"><strong>Severity:</strong></td>
                <td><span style="background-color: ${this.getSeverityColor(report.severity)}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 12px; font-weight: bold;">${report.severity.toUpperCase()}</span></td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #475569;"><strong>Location:</strong></td>
                <td>${report.location}</td>
              </tr>
            </table>
          </div>
          
          <p>An operator is currently reviewing your report. You can view the status of community reports on the dashboard.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${reportUrl}" style="background-color: #0284c7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Go to Reports Dashboard</a>
          </div>
          <p style="font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; margin-top: 30px;">
            This is an automated message from Coastal Guardian. Please do not reply directly to this email.
          </p>
        </div>
      `;

      await this.sendMail({
        to: reporterEmail,
        subject: reporterSubject,
        html: reporterHtml,
        logLabel: 'Reporter Confirmation'
      });
    }

    // 2. Send Alert Email to Operator
    const operatorSubject = `🚨 [NEW REPORT - ${report.severity.toUpperCase()}] ${report.title}`;
    const operatorHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-lg: 8px;">
        <h2 style="color: #ef4444; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">⚠️ Operator Threat Alert</h2>
        <p>A new coastal observation report has been generated by a community member and requires review.</p>
        
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ef4444;">
          <p style="margin: 0 0 10px 0;"><strong>Incident Specification:</strong></p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 5px 0; color: #475569; width: 150px;"><strong>Report ID:</strong></td>
              <td><code>${report.reportId}</code></td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #475569;"><strong>Title:</strong></td>
              <td>${report.title}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #475569;"><strong>Report Type:</strong></td>
              <td>${report.reportType}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #475569;"><strong>Severity:</strong></td>
              <td><span style="background-color: ${this.getSeverityColor(report.severity)}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 12px; font-weight: bold;">${report.severity.toUpperCase()}</span></td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #475569;"><strong>Coordinates / Location:</strong></td>
              <td>${report.location}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #475569;"><strong>Description:</strong></td>
              <td>${report.description}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #475569;"><strong>Reporter:</strong></td>
              <td>${report.contactName} (${report.contactPhone || 'No Phone'})</td>
            </tr>
          </table>
        </div>
        
        <p>Please log in to the operator cockpit to evaluate this hazard, verify details, and broadcast alerts to residents if needed.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${reportUrl}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Open Operator Cockpit</a>
        </div>
        <p style="font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; margin-top: 30px;">
          Coastal Guardian Threat Management System. Security classification: Restricted.
        </p>
      </div>
    `;

    if (this.operatorEmail) {
      await this.sendMail({
        to: this.operatorEmail,
        subject: operatorSubject,
        html: operatorHtml,
        logLabel: 'Operator Threat Alert'
      });
    }
  }

  /**
   * Internal helper to send email or simulate sending
   * @param {Object} param0 - Mail options
   */
  async sendMail({ to, subject, html, logLabel = 'Email' }) {
    if (this.transporter && this.sender) {
      try {
        const info = await this.transporter.sendMail({
          from: `"Coastal Guardian" <${this.sender}>`,
          to,
          subject,
          html
        });
        console.log(`✅ [${logLabel}] Email sent successfully to ${to}. Message ID: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
      } catch (error) {
        console.error(`❌ [${logLabel}] Failed to send email to ${to}:`, error.message);
        return { success: false, error: error.message };
      }
    } else {
      // Simulation mode
      console.log('\n==================================================');
      console.log(`✉️  SIMULATED EMAIL SENT (${logLabel}):`);
      console.log(`- From: "Coastal Guardian" <simulation@coastalguardian.local>`);
      console.log(`- To: ${to}`);
      console.log(`- Subject: ${subject}`);
      console.log('- Body (HTML preview snippet):');
      // Strip HTML tags roughly for console presentation
      const textSnippet = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 200);
      console.log(`  "${textSnippet}..."`);
      console.log('==================================================\n');
      return { success: true, provider: 'simulation' };
    }
  }

  getSeverityColor(severity) {
    switch (String(severity).toLowerCase()) {
      case 'critical': return '#dc2626';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      default: return '#3b82f6';
    }
  }
}

module.exports = EmailService;
