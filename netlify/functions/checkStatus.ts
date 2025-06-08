import { Handler } from '@netlify/functions';
import { getUser, getUserByEmail } from '../../src/api/userStore';
import { getClicksByUserId } from '../../src/api/clickStore';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 204,
        headers: corsHeaders,
        body: '',
      };
    }

    if (event.httpMethod !== 'GET') {
      return {
        statusCode: 405,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }

    const userId = event.queryStringParameters?.userId;
    const email = event.queryStringParameters?.email;

    console.log("checkStatus: Received query → userId:", userId, "email:", email);

    if (!userId && !email) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing userId or email parameter' }),
      };
    }

    let user;

    if (userId) {
      console.log(`checkStatus: Looking up user by userId = ${userId}`);
      user = await getUser(userId);
    } else {
      console.log(`checkStatus: Looking up user by email = ${email}`);
      user = await getUserByEmail(email);
    }

    if (!user) {
      console.warn(`checkStatus: User not found for ${userId ? 'userId' : 'email'} = ${userId || email}`);
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    console.log('checkStatus: User found:', user);

    const clicks = await getClicksByUserId(user.id);
    console.log(`checkStatus: Found ${clicks.length} clicks for userId = ${user.id}`);

    const lastClick = clicks.length > 0
      ? new Date(clicks[clicks.length - 1].timestamp)
      : null;

    // Use either snake_case or camelCase from user object
    const rawLastEmailSent = user.last_email_sent ?? user.lastEmailSent ?? null;

    let lastEmailSentDate: Date | null = null;
    if (rawLastEmailSent) {
      const parsedDate = new Date(rawLastEmailSent);
      lastEmailSentDate = isNaN(parsedDate.getTime()) ? null : parsedDate;
    }
    if (!lastEmailSentDate) {
      lastEmailSentDate = user.created_at ? new Date(user.created_at) : null;
    }

    const now = new Date();
    const referenceDate = lastClick || lastEmailSentDate || now; // fallback to now just in case

    const daysPassed = Math.floor((now.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
    const purgeAfterDays = user.purge_after_days ?? 0;
    const daysRemaining = Math.max(0, purgeAfterDays - daysPassed);

    const shouldPurge = user.purged || daysRemaining === 0;

    const response = {
      success: true,
      shouldPurge,
      daysRemaining,
      isVerified: user.verified || false,

      // Supabase columns
      id: user.id,
      email: user.email,
      purge_after_days: user.purge_after_days,
      created_at: user.created_at,
      last_verified: user.last_verified,
      verified: user.verified,
      last_email_sent: lastEmailSentDate ? lastEmailSentDate.toISOString() : null,
      purged: user.purged,
      purged_at: user.purged_at,
    };

    console.log('✅ Returning API Response:', response);

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error('checkStatus: Unexpected error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};
