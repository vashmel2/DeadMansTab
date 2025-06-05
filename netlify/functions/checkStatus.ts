import { Handler } from '@netlify/functions';
import { getUser } from '../../src/api/userStore';
import { getClicksByUserId } from '../../src/api/clickStore';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

export const handler: Handler = async (event) => {
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
  if (!userId) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Missing userId parameter' }),
    };
  }

  const user = await getUser(userId);
  if (!user) {
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'User not found' }),
    };
  }

  const clicks = await getClicksByUserId(userId);
  const lastClick = clicks.length > 0
    ? new Date(clicks[clicks.length - 1].timestamp)
    : null;

  const lastEmailSent = user.lastEmailSent
    ? new Date(user.lastEmailSent)
    : new Date(user.created_at); // fallback to account creation date

  const now = new Date();
  const referenceDate = lastClick || lastEmailSent;
  const daysPassed = Math.floor((now.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, user.purgeAfterDays - daysPassed);

  const shouldPurge = user.purged || daysRemaining === 0;

  const response = {
    success: true,
    shouldPurge,
    daysRemaining,
    isVerified: user.isVerified || false,
    userId: user.id, // Needed for background.js verification
  };

  return {
    statusCode: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(response),
  };
};
