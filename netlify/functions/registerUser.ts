import { Handler } from '@netlify/functions';
import { UserData } from '../../src/types';
import { registerUser } from '../../src/api/userStore';

const SERVICE_ID = 'service_aeih9as';
const TEMPLATE_ID = 'template_jwgjuxe';
const USER_ID = 'dnos_nCVrmOTXdLKu';

export const handler: Handler = async (event) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const data: UserData = JSON.parse(event.body || '');
    
    if (!data.email || !data.purgeAfterDays) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Email and purgeAfterDays are required' })
      };
    }

    // Validate email format
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!emailRegex.test(data.email)) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Invalid email format' })
      };
    }

    // Validate purgeAfterDays is a positive number
    if (typeof data.purgeAfterDays !== 'number' || data.purgeAfterDays <= 0) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'purgeAfterDays must be a positive number' })
      };
    }

    // Register user in the store
    registerUser(data);

    // Send welcome email using EmailJS
    const emailjsData = {
      service_id: SERVICE_ID,
      template_id: TEMPLATE_ID,
      user_id: USER_ID,
      template_params: {
        to_email: data.email,
        subject: 'Welcome to Email Link Sender',
        message: `Thank you for registering! Your links will be purged after ${data.purgeAfterDays} days of inactivity.`,
      }
    };

    const emailResponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailjsData)
    });

    if (!emailResponse.ok) {
      console.error('EmailJS Error:', await emailResponse.text());
      throw new Error('Failed to send welcome email');
    }
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    console.error('Error in registerUser:', error);
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Failed to process request' })
    };
  }
};