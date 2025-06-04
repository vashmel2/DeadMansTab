import { Handler } from '@netlify/functions';
import { supabase } from '../../src/lib/supabaseClient';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const handler: Handler = async (event) => {
  // Handle preflight CORS
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
    const { email, purgeAfterDays } = JSON.parse(event.body || '{}');

    if (!email || !purgeAfterDays) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing email or purgeAfterDays' }),
      };
    }

    // Insert new user
    const { data, error } = await supabase
      .from('users')
      .insert([{ email, purge_after_days: purgeAfterDays }])
      .select()
      .single();

    if (error || !data) {
      console.error('Error inserting user:', error);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Failed to register user' }),
      };
    }

    // Trigger verification email
    await fetch(`${process.env.URL}/.netlify/functions/sendVerificationEmail`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, userId: data.id }),
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ success: true, userId: data.id }),
    };
  } catch (err) {
    console.error('Unexpected error in registerUser:', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};
