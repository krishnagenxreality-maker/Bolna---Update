import React from 'react';
import { X, ShieldCheck, FileText, Info } from 'lucide-react';

export default function LegalModal({ isOpen, onClose, docType }) {
  if (!isOpen) return null;

  const getDocContent = () => {
    switch (docType) {
      case 'terms':
        return {
          title: 'Terms & Conditions — CallingGen',
          lastUpdated: 'Last updated: [Insert Date]',
          sections: [
            {
              text: 'Welcome to CallingGen. These Terms & Conditions govern your access to and use of the CallingGen website, dashboard, products, services, and related features. By using CallingGen, creating an account, booking a demo, submitting a lead, or purchasing any plan, you agree to these Terms.'
            },
            {
              title: '1. Services',
              text: 'CallingGen provides AI-powered voice outreach, inbound call handling, lead qualification, follow-up automation, analytics, and related communication services for businesses.'
            },
            {
              title: '2. Eligibility',
              text: 'You must be legally authorized to use our services on behalf of your business or organization. You agree that the information you provide is accurate, complete, and up to date.'
            },
            {
              title: '3. Account Usage',
              text: 'You are responsible for keeping your login credentials secure, ensuring your team members follow these Terms, using the platform only for lawful business purposes, and not using CallingGen for spam, fraud, harassment, or illegal activity.'
            },
            {
              title: '4. AI Calling and Consent',
              text: 'You are responsible for ensuring that you have the right to contact the phone numbers you upload or use with CallingGen, including any required consent, permission, or lawful basis to make such calls or send follow-up messages.'
            },
            {
              title: '5. Credits, Billing, and Plans',
              text: 'CallingGen may use subscription plans, onboarding fees, credits, and top-up packs. Credits may be deducted based on usage rules shown on the platform. No-answer calls may not be charged, depending on the plan or campaign logic. Billing terms, pricing, and included usage may change from time to time. Payments are non-refundable unless required by law or expressly stated otherwise.'
            },
            {
              title: '6. Service Limits',
              text: 'We may apply fair-use, usage, concurrency, or technical limits to protect platform stability, quality, and performance.'
            },
            {
              title: '7. Customer Content',
              text: 'You retain ownership of your contact lists, scripts, and business content. By uploading data to CallingGen, you grant us permission to process it only to provide the services.'
            },
            {
              title: '8. Call Recordings, Transcripts, and Reports',
              text: 'CallingGen may generate call logs, transcripts, summaries, and reports for service delivery, analytics, training, compliance, and product improvement.'
            },
            {
              title: '9. Prohibited Use',
              text: 'You must not use CallingGen to send unsolicited spam or abusive communications, impersonate another person or business, violate telecom, privacy, advertising, or consumer protection laws, upload unlawful, offensive, or misleading content, or attempt to reverse engineer or misuse the platform.'
            },
            {
              title: '10. Suspension or Termination',
              text: 'We may suspend or terminate access if we believe you have violated these Terms, harmed the platform, or used the service unlawfully.'
            },
            {
              title: '11. Disclaimers',
              text: 'CallingGen is provided on an "as is" and "as available" basis. We do not guarantee any particular sales, admission, lead conversion, or business outcome.'
            },
            {
              title: '12. Limitation of Liability',
              text: 'To the fullest extent permitted by law, CallingGen will not be liable for indirect, incidental, special, or consequential damages, including lost profits or business opportunities.'
            },
            {
              title: '13. Indemnity',
              text: 'You agree to indemnify and hold CallingGen harmless from claims, losses, or liabilities arising from your use of the service, your uploaded data, your campaigns, or your violation of these Terms.'
            },
            {
              title: '14. Changes',
              text: 'We may update these Terms from time to time. Continued use of CallingGen means you accept the revised Terms.'
            },
            {
              title: '15. Governing Law',
              text: 'These Terms are governed by the laws of India. Any disputes will be subject to the courts having jurisdiction over the location of CallingGen’s principal place of business.'
            },
            {
              title: '16. Contact',
              text: 'For questions about these Terms, contact:\nEmail: [Insert Email]\nWebsite: [Insert Website]\nCompany: CallingGen'
            }
          ]
        };
      case 'privacy':
        return {
          title: 'Privacy Policy — CallingGen',
          lastUpdated: 'Last updated: [Insert Date]',
          sections: [
            {
              text: 'CallingGen respects your privacy. This Privacy Policy explains how we collect, use, store, share, and protect personal data when you use our website, services, dashboard, and related tools.'
            },
            {
              title: '1. Information We Collect',
              text: 'We may collect: name, company name, email address, phone number, billing details, login details, uploaded contact lists, call recordings, transcripts, call summaries, campaign data, analytics and usage data, device, browser, and log information.'
            },
            {
              title: '2. How We Use Information',
              text: 'We use personal data to create and manage accounts, provide AI calling and inbound call services, process campaigns and automations, generate call summaries and analytics, send notifications and support messages, process billing and subscriptions, improve product performance and reliability, and comply with legal obligations.'
            },
            {
              title: '3. Call Data and Recordings',
              text: 'When our services are used, calls may be recorded, transcribed, summarized, or analyzed for service delivery, quality control, customer support, analytics, troubleshooting, and product improvement.'
            },
            {
              title: '4. Customer Data Ownership',
              text: 'You own the customer and lead data you upload. CallingGen processes that data only to provide the service, operate campaigns, and generate outputs requested by you.'
            },
            {
              title: '5. Data Sharing',
              text: 'We may share data with service providers that help us operate the platform, payment processors, telephony and AI infrastructure providers, or legal/regulatory authorities when required by law. We do not sell your personal data.'
            },
            {
              title: '6. Data Storage and Security',
              text: 'We use reasonable technical and organizational safeguards to protect data from unauthorized access, loss, misuse, or disclosure. However, no system is completely secure.'
            },
            {
              title: '7. Data Retention',
              text: 'We keep personal data only as long as needed to provide services, comply with legal obligations, resolve disputes, and maintain records. We may delete or anonymize data when it is no longer required.'
            },
            {
              title: '8. Your Rights',
              text: 'Subject to applicable law, you may request access to, correction of, deletion of, or restriction on the use of your data. You may also request clarification regarding how your data is processed.'
            },
            {
              title: '9. Marketing Communication',
              text: 'We may send you product updates, demo invitations, onboarding messages, and service notifications. You may opt out of non-essential marketing communications where applicable.'
            },
            {
              title: '10. Cookies and Tracking',
              text: 'Our website may use cookies or similar technologies to improve user experience, track analytics, and remember preferences.'
            },
            {
              title: '11. Third-Party Services',
              text: 'CallingGen may use third-party services for hosting, analytics, payments, telephony, AI processing, and email delivery. These providers may process data according to their own privacy terms.'
            },
            {
              title: '12. Children’s Data',
              text: 'CallingGen is intended for business use and is not designed to knowingly collect data from children without proper authorization and legal basis.'
            },
            {
              title: '13. Changes to This Policy',
              text: 'We may update this Privacy Policy from time to time. The updated version will be posted on this page with a revised "Last updated" date.'
            },
            {
              title: '14. Contact Us',
              text: 'If you have questions or requests about this Privacy Policy, contact:\nEmail: [Insert Email]\nWebsite: [Insert Website]\nCompany: CallingGen'
            }
          ]
        };
      case 'refund':
        return {
          title: 'Refund Policy — CallingGen',
          lastUpdated: 'Last updated: [Insert Date]',
          sections: [
            {
              text: 'At CallingGen, we strive to provide reliable AI-powered communication and outreach services for businesses. This Refund Policy explains how refunds, cancellations, subscriptions, onboarding fees, and credit purchases are handled. By purchasing or using CallingGen services, you agree to this Refund Policy.'
            },
            {
              title: '1. Subscription Plans',
              text: 'CallingGen subscription plans are billed monthly, quarterly, semi-annually, or annually depending on the selected plan. Subscription payments are generally non-refundable once the billing cycle has started.'
            },
            {
              title: '2. Onboarding & Setup Fees',
              text: 'Implementation, onboarding, setup, workflow configuration, AI agent creation, integrations, and deployment fees are non-refundable because these involve technical setup, operational work, configuration effort, and infrastructure provisioning performed specifically for your organization.'
            },
            {
              title: '3. AI Outreach Credits & Top-Ups',
              text: 'AI outreach credits, campaign credits, and top-up purchases are non-refundable once credits are added to your account. Unused credits may remain available based on your active subscription status and applicable plan rules.'
            },
            {
              title: '4. Failed or Unsuccessful Calls',
              text: 'CallingGen may follow a "No Answer = No Charge" model for eligible plans. Credits are generally not deducted for unanswered calls, busy calls, or failed connection attempts. However, connected conversations, completed workflows, and successful AI interactions may consume credits according to the platform\'s billing logic.'
            },
            {
              title: '5. Cancellation Policy',
              text: 'Clients may cancel subscriptions at any time. Cancellation will stop future recurring billing, will not automatically generate refunds for previous charges, and will not refund used credits or completed billing periods. Access may continue until the current billing cycle ends.'
            },
            {
              title: '6. Exceptional Refunds',
              text: 'Refund requests may be reviewed only in exceptional situations such as duplicate payments, technical billing errors, unauthorized transactions, or major platform failures directly caused by CallingGen. Refund approvals are solely at CallingGen’s discretion after internal review.'
            },
            {
              title: '7. Third-Party Service Costs',
              text: 'CallingGen relies on third-party providers such as AI infrastructure providers, telephony providers, hosting providers, and payment gateways. Certain charges incurred through these providers may be non-recoverable, which can affect refund eligibility.'
            },
            {
              title: '8. Abuse & Policy Violations',
              text: 'Refunds will not be provided for misuse of services, spam campaigns, policy violations, suspended accounts, or unlawful usage.'
            },
            {
              title: '9. Chargebacks',
              text: 'Initiating unjustified chargebacks or payment disputes may result in account suspension, service termination, or legal recovery actions where applicable. We encourage clients to contact us first to resolve billing concerns.'
            },
            {
              title: '10. Contact for Billing Support',
              text: 'For billing, refund, or cancellation questions, contact:\nCallingGen Support\nEmail: [Insert Email]\nWebsite: [Insert Website]'
            }
          ]
        };
      case 'consent':
        return {
          title: 'Consent for AI Communication & Call Processing',
          lastUpdated: 'Last updated: [Insert Date]',
          sections: [
            {
              text: 'By submitting your information, interacting with CallingGen, or participating in AI-powered communication workflows, you acknowledge and agree that:'
            },
            {
              bullets: [
                'calls may be handled by AI voice agents',
                'conversations may be recorded or transcribed',
                'AI systems may process voice interactions',
                'call summaries and analytics may be generated',
                'follow-up communication may occur through phone calls, SMS, email, or WhatsApp'
              ]
            },
            {
              title: 'You further acknowledge that:',
              bullets: [
                'the information you provide may be used for communication, support, outreach, analytics, and workflow automation',
                'calls may be monitored for quality assurance and service improvement',
                'standard telecom and data charges may apply'
              ]
            },
            {
              text: 'If you do not wish to participate in AI-powered communication workflows, please discontinue use of the service or notify the organization initiating the communication.'
            }
          ]
        };
      case 'contact':
        return {
          title: 'Contact Us — CallingGen',
          lastUpdated: '',
          sections: [
            {
              text: 'Have questions, feedback, or need assistance? We are here to help.'
            },
            {
              title: 'Support and Information',
              text: 'Email: [Insert Email]\nWebsite: [Insert Website]\nCompany: CallingGen'
            },
            {
              text: 'Our support team is available to assist you with onboarding, technical queries, plan management, and integrations.'
            }
          ]
        };
      default:
        return { title: '', sections: [] };
    }
  };

  const content = getDocContent();

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(15px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="panel" style={{
        width: '100%',
        maxWidth: '680px',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        background: 'rgba(20, 20, 20, 0.85)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 24px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.02) inset',
        borderRadius: '16px',
        padding: '0'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px 32px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <div>
            <h2 style={{
              color: '#fff',
              fontSize: '18px',
              fontWeight: '700',
              fontFamily: 'Outfit, sans-serif',
              letterSpacing: '-0.02em',
              margin: '0 0 4px'
            }}>
              {content.title}
            </h2>
            {content.lastUpdated && (
              <span style={{
                color: 'rgba(255,255,255,0.3)',
                fontSize: '11px',
                fontFamily: 'Outfit, sans-serif'
              }}>
                {content.lastUpdated}
              </span>
            )}
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255, 255, 255, 0.4)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="custom-scrollbar" style={{
          padding: '32px',
          overflowY: 'auto',
          flex: 1,
          fontFamily: 'Outfit, sans-serif',
          fontSize: '14px',
          lineHeight: '1.7',
          color: 'rgba(255, 255, 255, 0.7)',
          textAlign: 'left'
        }}>
          {content.sections.map((sec, idx) => (
            <div key={idx} style={{ marginBottom: '24px' }}>
              {sec.title && (
                <h3 style={{
                  color: '#fff',
                  fontSize: '15px',
                  fontWeight: '600',
                  marginBottom: '10px',
                  marginTop: '0'
                }}>
                  {sec.title}
                </h3>
              )}
              {sec.text && (
                <p style={{ margin: 0, whiteSpace: 'pre-line' }}>
                  {sec.text}
                </p>
              )}
              {sec.bullets && (
                <ul style={{ margin: '10px 0 0', paddingLeft: '20px', listStyleType: 'disc' }}>
                  {sec.bullets.map((b, bIdx) => (
                    <li key={bIdx} style={{ marginBottom: '8px' }}>
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px 32px',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          justifyContent: 'flex-end',
          background: 'rgba(0,0,0,0.1)'
        }}>
          <button 
            onClick={onClose}
            className="nav-btn"
            style={{
              padding: '8px 24px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '500',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#fff'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
