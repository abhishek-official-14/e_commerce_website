import { env } from '../config/env';

export const sendOrderNotificationEmail = async ({
  to,
  subject,
  html
}: {
  to: string;
  subject: string;
  html: string;
}) => {
  const smtpConfigured = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);

  if (!smtpConfigured) {
    console.log(`📧 [mock-email] to=${to} subject=${subject} from=${env.EMAIL_FROM} body=${html}`);
    return;
  }

  // Placeholder for SMTP integration with your preferred provider SDK.
  console.log(`📧 [smtp-configured] to=${to} subject=${subject} from=${env.EMAIL_FROM}`);
};
