import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Use service role for write access
const supabase = createClient(supabaseUrl, supabaseKey);

export const handler: Handler = async (event) => {
  console.log('🔍 Verification function triggered');

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Method Not Allowed',
    };
  }

  const userId = event.queryStringParameters?.userId;

  if (!userId) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Missing userId parameter.',
    };
  }

  try {
    const { error } = await supabase
      .from('users')
      .update({
        verified: true,
        last_verified: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('❌ Supabase update error:', error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'text/plain' },
        body: 'Database error.',
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html' },
      body: `
        <html>
          <head><title>Verification Successful</title></head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: green;">✅ You're Verified!</h1>
            <p>Your Dead Man’s Tab purge timer has been reset.</p>
          </body>
        </html>
      `,
    };

  } catch (err: any) {
    console.error('🔥 Unexpected error in verifyUser:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Internal server error.',
    };
  }
};
