import { Handler } from '@netlify/functions';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { UserData } from '../../src/types';
import { sendVerificationEmail } from './sendVerificationEmail';

const resend = new Resend(process.env.RESEND_API_KEY!);

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const handler: Handler = async (event) => {
  console.log("📩 registerUser function hit");

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const rawData = JSON.parse(event.body || '');
    const email = rawData.email;
    const purgeAfterDays = rawData.purgeAfterDays ?? rawData.purge_after_days;

    if (!email || !purgeAfterDays) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Email and purgeAfterDays are required' }),
      };
    }

    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid email format' }),
      };
    }

    if (typeof purgeAfterDays !== 'number' || purgeAfterDays <= 0) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'purgeAfterDays must be a positive number' }),
      };
    }

    // 🔍 Check if user already exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (fetchError) {
      console.error('❌ Supabase fetch error:', fetchError);
      throw new Error('Database error');
    }

    if (existingUser) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'User already registered' }),
      };
    }

    // ✅ Insert user and return ID
    const { data: insertedUsers, error: insertError } = await supabase
      .from('users')
      .insert({
        email,
        purge_after_days: purgeAfterDays,
        verified: false,
        last_verified: null,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (insertError || !insertedUsers) {
      console.error('❌ Supabase insert error:', insertError);
      throw new Error('Failed to register user');
    }

    const userId = insertedUsers.id;

    // 📬 Send welcome email
    try {
      await resend.emails.send({
        from: 'Deadman’s Tab <noreply@resend.dev>',
        to: email,
        subject: 'Welcome to Deadman’s Tab',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">Welcome to Deadman’s Tab</h2>
            <p>Hi there!</p>
            <p>You’ve successfully registered. We'll monitor your activity and purge after <strong>${purgeAfterDays} days</strong> of inaction if you don’t verify via email.</p>
            <p>Make sure to click the verification email you’ll be getting next!</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("⚠️ Welcome email sending failed:", emailError);
    }

    // 🔐 Send verification email
    try {
      await sendVerificationEmail(email, userId);
    } catch (verifError) {
      console.error("⚠️ Verification email sending failed:", verifError);
    }

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, userId }),
    };
  } catch (error) {
    console.error('🔥 ERROR in registerUser.ts:', error);
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to process request' }),
    };
  }
};
