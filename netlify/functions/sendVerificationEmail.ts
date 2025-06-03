import { Handler } from '@netlify/functions';
import { Resend } from 'resend';

const resend = new Resend('re_PH7BMZhb_BnRuzhD6TkTshP36iVyZcBZ9');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

export const handler: Handler = async (event) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { email, token } = JSON.parse(event.body || '{}');

    if (!email || !token) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing email or token' })
      };
    }

    const verificationLink = `${event.headers.origin || 'https://teal-pithivier-aaaf92.netlify.app'}/verify?token=${token}`;

    const { data, error } = await resend.emails.send({
      from: 'Email Link Sender <noreply@resend.dev>',
      to: email,
      subject: 'Verify Your Email to Prevent the Purge',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">Email Verification Required</h2>
          <p>Hello!</p>
          <p>Thank you for using Email Link Sender. To ensure the security of your account and prevent automatic purging, please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #666;">This verification link will expire in 24 hours.</p>
          <p style="color: #666;">If you didn't request this verification, please ignore this email.</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated message from Email Link Sender. Please do not reply to this email.
          </p>
        </div>
      `
    });

    if (error) {
      console.error('Resend error:', error);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Failed to send verification email' })
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ 
        message: 'Verification email sent successfully',
        id: data?.id 
      })
    };
  } catch (err) {
    console.error('Unexpected error:', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};