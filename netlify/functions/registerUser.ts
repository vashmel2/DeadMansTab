import { Handler } from '@netlify/functions';
import { Resend } from 'resend';
import { UserData } from '../../src/types';
import { registerUser } from '../../src/api/userStore';

const resend = new Resend(process.env.RESEND_API_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const handler: Handler = async (event) => {
  console.log("registerUser function hit");  // <-- Log when function is called

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
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const data: UserData = JSON.parse(event.body || '');

    if (!data.email || !data.purgeAfterDays) {
      return {
        statusCode: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Email and purgeAfterDays are required' }),
      };
    }

    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!emailRegex.test(data.email)) {
      return {
        statusCode: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Invalid email format' }),
      };
    }

    if (typeof data.purgeAfterDays !== 'number' || data.purgeAfterDays <= 0) {
      return {
        statusCode: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'purgeAfterDays must be a positive number' }),
      };
    }

    // Register the user in your local store
    registerUser(data);

    // Send welcome email via Resend with error handling
    try {
      const { error } = await resend.emails.send({
        from: 'Deadman’s Tab <noreply@resend.dev>',
        to: data.email,
        subject: 'Welcome to Deadman’s Tab',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">Welcome to Deadman’s Tab</h2>
            <p>Hi there!</p>
            <p>You’ve successfully registered. We'll monitor your activity and purge after <strong>${data.purgeAfterDays} days</strong> of inaction if you don’t verify via email.</p>
            <p>Make sure to click the verification email you’ll be getting next!</p>
          </div>
        `,
      });

      if (error) {
        console.error('Resend email error:', error);
        throw new Error('Failed to send welcome email');
      }
    } catch (emailError) {
      console.error("❌ Email sending failed:", emailError);
      throw new Error("Email sending failed");
    }

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error('🔥 ERROR in registerUser.ts:', {
      message: (error as Error).message,
      stack: (error as Error).stack,
      originalError: error,
    });
    return {
      statusCode: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Failed to process request' }),
    };
  }
};
