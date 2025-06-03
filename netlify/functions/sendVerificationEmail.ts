import { Handler } from '@netlify/functions';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const parsedBody = JSON.parse(event.body || '{}');
    const { email, purgeAfterDays } = parsedBody;

    if (!email || !purgeAfterDays) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Email and purgeAfterDays are required' }),
      };
    }

    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid email format' }),
      };
    }

    const { error } = await resend.emails.send({
      from: "Deadman's Tab <noreply@resend.dev>",
      to: email,
      subject: "Verify Your Email – Deadman's Tab",
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ef4444;">⚠️ Final Warning!</h2>
            <p>We've noticed inactivity on your browser. If you don’t click the button below, your tabs and history will be wiped in <strong>${purgeAfterDays} days</strong>.</p>
            <p style="margin: 20px 0;">
              <a href="https://deadmanstabdev.netlify.app/verify?email=${encodeURIComponent(email)}" 
                 target="_blank" rel="noopener noreferrer"
                 style="display: inline-block; padding: 12px 20px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px;">
                 Click to Keep Everything Safe
              </a>
            </p>
            <p>If this wasn’t you, you can ignore this email.</p>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend email error:', error);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Failed to send verification email' }),
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error('Error in sendVerificationEmail:', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};
