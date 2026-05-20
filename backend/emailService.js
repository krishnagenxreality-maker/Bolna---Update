const https = require('https');

/**
 * Core helper function to send emails via Resend's REST API.
 * Uses native 'https' module to ensure zero external dependency.
 */
function sendEmail({ to, subject, html, isRetry = false }) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("RESEND_API_KEY is not defined in the environment variables!");
      return reject(new Error("RESEND_API_KEY is missing"));
    }

    const fromAddress = process.env.EMAIL_FROM 
      ? (process.env.EMAIL_FROM.includes('<') ? process.env.EMAIL_FROM : `CallingGen <${process.env.EMAIL_FROM}>`)
      : 'CallingGen <onboarding@resend.dev>';

    const postData = JSON.stringify({
      from: fromAddress,
      to: Array.isArray(to) ? to : [to],
      subject: subject,
      html: html
    });

    const options = {
      hostname: 'api.resend.com',
      port: 443,
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsed = JSON.parse(body);
            resolve(parsed);
          } catch (e) {
            resolve({ success: true, raw: body });
          }
        } else {
          // If sandbox restriction 403 occurs and we haven't retried yet:
          if (res.statusCode === 403 && !isRetry) {
            try {
              const errObj = JSON.parse(body);
              if (errObj.message && errObj.message.includes("You can only send testing emails to your own email address")) {
                const verifiedRecipient = "saivarun@genxreality.in";
                console.log(`[Resend Sandbox] Intercepted 403 restriction. Re-routing email from ${to} to verified inbox ${verifiedRecipient}`);
                
                const newSubject = `[Sandbox Redirect: ${to}] ${subject}`;
                const newHtml = `<div style="background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; padding: 16px; border-radius: 8px; color: #f87171; margin-bottom: 20px; font-family: sans-serif; font-size: 13px; line-height: 1.4;">
                  <strong>Resend Sandbox Mode Notice:</strong> This email was originally addressed to <code>${to}</code> but was automatically re-routed to your verified email address because the domain has not been verified on Resend yet.<br/>
                  <span style="font-size: 11px; opacity: 0.8; margin-top: 4px; display: block;">To send emails to anyone else, verify your domain at <a href="https://resend.com/domains" style="color: #60a5fa; text-decoration: underline;" target="_blank">resend.com/domains</a>.</span>
                </div>${html}`;

                return sendEmail({
                  to: verifiedRecipient,
                  subject: newSubject,
                  html: newHtml,
                  isRetry: true
                }).then(resolve).catch(reject);
              }
            } catch (e) {
              // Ignore parsing errors and reject with the original
            }
          }
          reject(new Error(`Resend API error (${res.statusCode}): ${body}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Builds standard CallingGen premium branded HTML email wrapping.
 */
function getEmailHtmlTemplate(title, bodyContent) {
  const appUrl = process.env.APP_URL || 'https://callinggen.com';
  const displayDomain = appUrl.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
  
  let supportEmail = 'support@callinggen.com';
  const envFrom = process.env.EMAIL_FROM;
  if (envFrom) {
    const match = envFrom.match(/<([^>]+)>/);
    supportEmail = match ? match[1] : envFrom;
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #050505;
      font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #ffffff;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .card {
      background-color: #0c0c0c;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
      text-align: left;
    }
    .logo-mark {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border-radius: 12px;
      margin-bottom: 24px;
      display: inline-block;
      text-align: center;
      line-height: 48px;
      font-size: 24px;
      color: white;
    }
    h1 {
      font-size: 24px;
      font-weight: 700;
      margin-top: 0;
      margin-bottom: 12px;
      color: #ffffff;
      letter-spacing: -0.5px;
    }
    h1 span {
      color: #10b981;
    }
    p {
      font-size: 15px;
      line-height: 1.6;
      color: rgba(255, 255, 255, 0.7);
      margin-top: 0;
      margin-bottom: 24px;
    }
    .credential-box {
      background-color: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 28px;
    }
    .credential-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 14px;
    }
    .credential-row:last-child {
      margin-bottom: 0;
    }
    .credential-label {
      color: rgba(255, 255, 255, 0.4);
    }
    .credential-value {
      color: #ffffff;
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      font-weight: bold;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      text-align: center;
      border: 1px solid rgba(16, 185, 129, 0.2);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
      margin-bottom: 24px;
    }
    .otp-code {
      font-size: 32px;
      font-weight: 700;
      letter-spacing: 6px;
      color: #10b981;
      text-align: center;
      padding: 16px;
      background: rgba(16, 185, 129, 0.05);
      border: 1px dashed rgba(16, 185, 129, 0.2);
      border-radius: 8px;
      margin: 24px 0;
      font-family: 'JetBrains Mono', 'Courier New', monospace;
    }
    .footer {
      margin-top: 40px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      padding-top: 24px;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.35);
      text-align: center;
      line-height: 1.5;
    }
    .footer a {
      color: #10b981;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo-mark">⚡</div>
      ${bodyContent}
      <div class="footer">
        <p style="font-size: 12px; margin-bottom: 8px; color: rgba(255,255,255,0.3)">
          This is an automated security notification from CallingGen.
        </p>
        <p style="font-size: 12px; margin-bottom: 0; color: rgba(255,255,255,0.3)">
          Questions? Contact our team at <a href="mailto:${supportEmail}">${supportEmail}</a> or visit our website at <a href="${appUrl}" target="_blank">${displayDomain}</a>.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * 1. User creation / resend credentials notification
 */
async function sendAccountCreatedEmail(toEmail, userId, tempPassword) {
  if (!toEmail) return;
  const appUrl = process.env.APP_URL || 'http://localhost:5173';
  const subject = 'CallingGen Account Created Successfully';
  const bodyContent = `
    <h1>Account Created <span>Successfully</span></h1>
    <p>Your CallingGen account has been successfully created. Below are your login credentials.</p>
    
    <div class="credential-box">
      <div class="credential-row">
        <span class="credential-label">User ID:</span>
        <span class="credential-value">${userId}</span>
      </div>
      <div class="credential-row">
        <span class="credential-label">Temporary Password:</span>
        <span class="credential-value">${tempPassword}</span>
      </div>
    </div>
    
    <a href="${appUrl}" class="btn" target="_blank">Login to CallingGen</a>
    
    <p style="font-size: 13px; color: rgba(255,255,255,0.4); margin-bottom: 0;">
      Note: You will be prompted to change this temporary password upon your very first login.
    </p>
  `;
  const html = getEmailHtmlTemplate(subject, bodyContent);
  return sendEmail({ to: toEmail, subject, html });
}

/**
 * 2. Password changed confirmation
 */
async function sendPasswordUpdatedEmail(toEmail, userId) {
  if (!toEmail) return;
  const subject = 'Your CallingGen Password Has Been Updated';
  const bodyContent = `
    <h1>Password Updated <span>Successfully</span></h1>
    <p>Hello ${userId},</p>
    <p>This email confirms that your CallingGen account password has been updated successfully.</p>
    <p>If you did not initiate this change, please contact support immediately to lock your account.</p>
  `;
  const html = getEmailHtmlTemplate(subject, bodyContent);
  return sendEmail({ to: toEmail, subject, html });
}

/**
 * 3. Forgot password OTP email
 */
async function sendForgotOtpEmail(toEmail, otpCode) {
  if (!toEmail) return;
  const subject = 'Your CallingGen Verification Code';
  const bodyContent = `
    <h1>Password Reset <span>Verification</span></h1>
    <p>We received a request to reset your CallingGen password. Please use the following single-use verification code (OTP) to complete the verification:</p>
    
    <div class="otp-code">${otpCode}</div>
    
    <p>This verification code is strictly confidential and is valid for the next <b>10 minutes</b>. If you did not request this, you can safely ignore this email.</p>
  `;
  const html = getEmailHtmlTemplate(subject, bodyContent);
  return sendEmail({ to: toEmail, subject, html });
}

/**
 * 4. Low credits warning email
 */
async function sendLowCreditsEmail(toEmail, remainingCredits) {
  if (!toEmail) return;
  const appUrl = process.env.APP_URL || 'http://localhost:5173';
  const subject = 'CallingGen Credits Running Low';
  const bodyContent = `
    <h1>Credits Running <span>Low</span></h1>
    <p>Your credits are running low. You currently have <b>${remainingCredits}</b> credits remaining.</p>
    <p>To avoid any disruption to your active calling campaigns, please login and upgrade or top up your plan.</p>
    
    <a href="${appUrl}" class="btn" target="_blank">Top Up Now</a>
  `;
  const html = getEmailHtmlTemplate(subject, bodyContent);
  return sendEmail({ to: toEmail, subject, html });
}

module.exports = {
  sendEmail,
  sendAccountCreatedEmail,
  sendPasswordUpdatedEmail,
  sendForgotOtpEmail,
  sendLowCreditsEmail
};
