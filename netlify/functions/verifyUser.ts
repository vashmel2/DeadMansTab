import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const email = event.queryStringParameters?.email;

    if (!email) {
      return {
        statusCode: 400,
        body: 'Missing email parameter.',
      };
    }

    const { error } = await supabase
      .from('users')
      .update({
        verified: true,
        last_verified: new Date().toISOString(),
      })
      .eq('email', email);

    if (error) {
      console.error('Supabase update error:', error);
      return {
        statusCode: 500,
        body: 'Database error.',
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html' },
      body: `<html><body><h2>Verification Successful!</h2><p>Your Dead Man’s Tab purge countdown has been reset.</p></body></html>`,
    };

  } catch (err: any) {
    console.error('verifyUser error:', err);
    return {
      statusCode: 500,
      body: 'Internal server error.',
    };
  }
};
