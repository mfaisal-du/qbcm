import nodemailer from 'nodemailer';

const getTransportConfig = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === 'true';

  if (!host || !user || !pass) {
    return null;
  }

  return {
    host,
    port,
    secure,
    auth: { user, pass }
  };
};

export const sendPasswordResetEmail = async ({ to, fullName, temporaryPassword }) => {
  const transportConfig = getTransportConfig();
  if (!transportConfig) {
    throw new Error('SMTP is not configured. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in backend .env');
  }

  const transporter = nodemailer.createTransport(transportConfig);
  const from = process.env.SMTP_FROM || transportConfig.auth.user;

  const subject = 'COM Question Bank - Temporary Password';
  const text = [
    `Dear ${fullName},`,
    '',
    'Your password reset request has been verified.',
    `Temporary Password: ${temporaryPassword}`,
    '',
    'Please login and change your password immediately.',
    '',
    'Regards,',
    'COM Question Bank Team'
  ].join('\n');

  await transporter.sendMail({
    from,
    to,
    subject,
    text
  });
};
