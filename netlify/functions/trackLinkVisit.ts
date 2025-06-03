import { Handler } from '@netlify/functions';
import { logClick } from '../../src/api/clickStore';

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

  const timestamp = new Date().toISOString();
  
  logClick({
    userId,
    timestamp,
    ip: event.headers['client-ip'] || 'unknown'
  });

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({ success: true }),
  };
};