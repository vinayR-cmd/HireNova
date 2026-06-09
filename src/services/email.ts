import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || "HireNova Portal <noreply@hirenova.com>";

// Create a reusable transporter instance configuration
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // true for 465, false for other ports
  auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
});

export class EmailService {
  private isConfigured(): boolean {
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      console.warn("SMTP email server environment variables are incomplete. Emails will be logged to console instead.");
      return false;
    }
    return true;
  }

  /**
   * Universal core method to dispatch raw email payloads
   */
  async sendMail(to: string, subject: string, html: string) {
    const mailOptions = {
      from: EMAIL_FROM,
      to,
      subject,
      html,
    };

    if (!this.isConfigured()) {
      console.log(`[Email Mock-Log]\nTo: ${to}\nSubject: ${subject}\nBody Preview: ${html.substring(0, 150)}...\n`);
      return { messageId: "mock-id-success" };
    }

    try {
      return await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error(`Critical failure executing dispatch to email recipient ${to}:`, error);
      throw new Error("System failed to deliver transactional outreach email notification.");
    }
  }

  /**
   * Dispatches an onboarding notification to users following registration
   */
  async sendWelcomePendingEmail(to: string, fullName: string) {
    const subject = "Application Received — HR Management System";
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a; margin-bottom: 16px;">Welcome to the Portal, ${fullName}!</h2>
        <p style="color: #334155; line-height: 1.6;">Thank you for registering an account on our corporate employee management portal.</p>
        <p style="color: #334155; line-height: 1.6;">Your application file has been logged and queued for administrative validation review. You will receive an immediate update once human resources updates your profile parameters.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #64748b; font-size: 12px;">This message was generated automatically. Please do not reply directly to this inbox.</p>
      </div>
    `;
    return this.sendMail(to, subject, html);
  }

  /**
   * Dispatches credentials and approval notifications to active employees
   */
  async sendAccountApprovedEmail(to: string, fullName: string, employeeId: string, hasBankDetails = false) {
    const subject = "Account Approved — Welcome to the Team!";
    const bankReminder = !hasBankDetails ? `
        <div style="background-color: #fffbeb; padding: 16px; border-radius: 6px; margin: 20px 0; border: 1px solid #fde68a;">
          <strong style="color: #92400e; display: block; margin-bottom: 6px;">⚠️ Action Required: Bank Details Missing</strong>
          <p style="color: #78350f; margin: 0; font-size: 14px; line-height: 1.5;">
            Your bank account details have not been filled in yet. Salary disbursement cannot be processed until your bank information is on record.
            Please log in and navigate to <strong>My Profile → Bank Details</strong> to fill in your account information.
          </p>
        </div>` : "";
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #16a34a; margin-bottom: 16px;">Account Activated Successfully</h2>
        <p style="color: #334155; line-height: 1.6;">Hello ${fullName},</p>
        <p style="color: #334155; line-height: 1.6;">Your HR employee profile has been approved and your portal access is now active.</p>
        <div style="background-color: #f8fafc; padding: 16px; border-radius: 6px; margin: 20px 0; border: 1px solid #f1f5f9;">
          <strong style="color: #0f172a; display: block; margin-bottom: 4px;">Your Assigned Employee Corporate ID:</strong>
          <span style="font-family: monospace; font-size: 18px; color: #2563eb; font-weight: bold;">${employeeId}</span>
        </div>
        ${bankReminder}
        <p style="color: #334155; line-height: 1.6;">You can now log in to your dashboard to clock attendance, view payslips, and manage your profile.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #64748b; font-size: 12px;">HireNova Operations Team.</p>
      </div>
    `;
    return this.sendMail(to, subject, html);
  }

  /**
   * Sent by the Hiring/Onboarding Agent the moment a candidate is hired —
   * carries their new corporate ID and one-time login credentials.
   */
  async sendOnboardingWelcomeEmail(to: string, fullName: string, employeeId: string, jobTitle: string, tempPassword: string) {
    const subject = `Welcome to the Team, ${fullName.split(" ")[0]}! Your HireNova Account is Ready`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #6d28d9; margin-bottom: 16px;">You're Hired — Welcome Aboard!</h2>
        <p style="color: #334155; line-height: 1.6;">Hello ${fullName},</p>
        <p style="color: #334155; line-height: 1.6;">Congratulations on joining us as <strong>${jobTitle}</strong>! Our Onboarding Agent has set up your employee portal account so you can get started right away.</p>
        <div style="background-color: #f8fafc; padding: 16px; border-radius: 6px; margin: 20px 0; border: 1px solid #f1f5f9;">
          <strong style="color: #0f172a; display: block; margin-bottom: 4px;">Employee ID:</strong>
          <span style="font-family: monospace; font-size: 16px; color: #2563eb; font-weight: bold;">${employeeId}</span>
          <strong style="color: #0f172a; display: block; margin: 12px 0 4px;">Temporary Password:</strong>
          <span style="font-family: monospace; font-size: 16px; color: #2563eb; font-weight: bold;">${tempPassword}</span>
        </div>
        <p style="color: #334155; line-height: 1.6;">Log in with your email and this temporary password, then visit your profile to set a new one and complete your onboarding checklist. Your AI Onboarding Assistant will be ready to answer any questions about policies, attendance, payroll, and more.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #64748b; font-size: 12px;">HireNova Operations Team.</p>
      </div>
    `;
    return this.sendMail(to, subject, html);
  }

  /**
   * Dispatches application rejection explanation alerts
   */
  async sendAccountRejectedEmail(to: string, fullName: string, reason: string) {
    const subject = "Application Update — Employee Registration Framework";
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #dc2626; margin-bottom: 16px;">Application Status Update</h2>
        <p style="color: #334155; line-height: 1.6;">Hello ${fullName},</p>
        <p style="color: #334155; line-height: 1.6;">Your registration request data profile submission was evaluated by our team and could not be successfully verified at this present juncture.</p>
        <div style="background-color: #fff5f5; padding: 16px; border-radius: 6px; margin: 20px 0; border: 1px solid #fed7d7;">
          <strong style="color: #9b2c2c; display: block; margin-bottom: 4px;">Reason Provided by Administration:</strong>
          <p style="color: #c53030; margin: 0; font-size: 14px;">${reason || "Information documentation metrics could not be certified against standard internal directories."}</p>
        </div>
        <p style="color: #334155; line-height: 1.6;">Please contact our dedicated human resources operational team directly should you wish to review specific compliance profiles or reapply using corrected information records.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #64748b; font-size: 12px;">HireNova Corporate Administration Division.</p>
      </div>
    `;
    return this.sendMail(to, subject, html);
  }

  /**
   * Alerts workers that a payroll statement is available for download
   */
  async sendPayrollReleasedEmail(to: string, fullName: string, monthName: string, year: number) {
    const subject = `Payslip Available — ${monthName} ${year}`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a; margin-bottom: 16px;">New Payslip Generated</h2>
        <p style="color: #334155; line-height: 1.6;">Hello ${fullName},</p>
        <p style="color: #334155; line-height: 1.6;">Your official salary statement and associated breakdown slip for the period covering <strong>${monthName} ${year}</strong> has been finalized, approved, and securely released to your ledger profile.</p>
        <p style="color: #334155; line-height: 1.6;">Please log in directly to the cloud platform interface dashboard workspace to access full computational item breakdowns, view applicable statutory retention updates, or request direct PDF generation files.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #64748b; font-size: 12px;">Corporate Automated Payroll Engine Node.</p>
      </div>
    `;
    return this.sendMail(to, subject, html);
  }
}

export const emailService = new EmailService();