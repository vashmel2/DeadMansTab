import { Handler } from '@netlify/functions';
import { getUser } from '../../src/api/userStore';
import { getClicksByUserId } from '../../src/api/clickStore';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const userId = event.queryStringParameters?.userId;

  if (!userId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing userId parameter' }),
    };
  }

  const user = getUser(userId);
  if (!user) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'User not found' }),
    };
  }

  const clicks = getClicksByUserId(userId);
  const lastClick = clicks.length > 0 
    ? new Date(clicks[clicks.length - 1].timestamp)
    : null;
  
  const lastEmailSent = user.lastEmailSent 
    ? new Date(user.lastEmailSent)
    : new Date();
  
  const now = new Date();
  const referenceDate = lastClick || lastEmailSent;
  const daysPassed = (now.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24);
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(
      daysPassed >= user.purgeAfterDays
        ? { 
            status: 'Purge Triggered',
            daysLeft: 0
          }
        : { 
            status: 'Waiting',
            daysLeft: user.purgeAfterDays - daysPassed
          }
    ),
  };
};