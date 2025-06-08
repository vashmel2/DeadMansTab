import { Resend } from 'resend';
import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY!);

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const sendVerificationEmail = async (email: string, userId: string) => {
  const { data: userData, error: fetchError } = await supabase
    .from('users')
    .select('last_email_sent')
    .eq('id', userId)
    .single();

  if (fetchError || !userData) {
    console.error('❌ Failed to fetch user from Supabase:', fetchError);
    throw new Error('User not found or Supabase error');
  }

  const now = new Date();
  const lastEmailSent = userData.last_email_sent ? new Date(userData.last_email_sent) : null;

  if (lastEmailSent) {
    const diffTime = Math.abs(now.getTime() - lastEmailSent.getTime());
    const diffHours = diffTime / (1000 * 60 * 60);

    // Allow emails only once per 24 hours
    if (diffHours < 24) {
      console.log(`⏳ Skipping email — only ${diffHours.toFixed(2)} hours since last sent.`);
      return;
    }
  }

  const verificationLink = `https://deadmanstabdev.netlify.app/.netlify/functions/verifyUser?userId=${encodeURIComponent(userId)}`;
  console.log(`🔗 Sending verification link to ${email}: ${verificationLink}`);

  try {
    const response = await resend.emails.send({
      from: 'Deadman’s Tab <noreply@resend.dev>',
      to: [email],
      subject: '🔒 Verify Your Tab',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">You're Still Alive... Right?</h2>
          <p>Hey there!</p>
          <p>To avoid getting purged, just click the link below to verify your existence:</p>
          <p><a href="${verificationLink}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">I’m alive, don’t purge me</a></p>
          <p>If you didn’t sign up for Dead Man’s Tab, you can ignore this email.</p>
        </div>
      `,
    });

    if (!response || (response as any).error) {
      console.error('❌ Resend API error:', (response as any).error);
      throw new Error('Resend API failed to send email');
    }
  } catch (emailError) {
    console.error('❌ Resend email sending error:', emailError);
    throw new Error('Failed to send verification email');
  }

  console.log(`✅ Verification email sent to ${email}`);

  const { error: updateError } = await supabase
    .from('users')
    .update({ last_email_sent: now.toISOString() })
    .eq('id', userId);

  if (updateError) {
    console.error('⚠️ Failed to update last_email_sent in Supabase:', updateError);
  } else {
    console.log(`🕒 last_email_sent updated for ${email}`);
  }
};

const sendVerificationEmailHandler: Handler = async (
  event: HandlerEvent,
  _context: HandlerContext
) => {
  console.log("📨 HTTP triggered sendVerificationEmail");

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
      body: JSON.stringify({ error: 'Method Not Allowed' }),
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

    await sendVerificationEmail(email, userId);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error('❌ Error in sendVerificationEmailHandler:', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};

export { sendVerificationEmailHandler as handler };
