import { Handler } from '@netlify/functions';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { UserData } from '../../src/types';
import { sendVerificationEmail } from './sendVerificationEmail';

const resend = new Resend(process.env.RESEND_API_KEY!);

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // change to service role key here
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};


export const handler: Handler = async (event) => {
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
    const { email, userId } = JSON.parse(event.body || '{}');

    if (!email || !userId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing email or userId' }),
      };
    }

    const link = `https://deadmanstabdev.netlify.app/.netlify/functions/verifyUser?userId=${userId}`;

    const { error } = await resend.emails.send({
      from: 'Dead Man\'s Tab <no-reply@deadmanstab.com>',
      to: [email],
      subject: 'Verify Your Tab',
      html: `<p>Click the link below to verify you're still alive:</p><p><a href="${link}">I’m alive, don't purge me</a></p>`,
    });

    if (error) {
      console.error('Resend error:', error);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Failed to send email' }),
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error('Unexpected error:', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};
