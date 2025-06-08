import { schedule } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
};

async function runScheduledPurge() {
  if (!process.env.SITE_URL) {
    throw new Error('Missing SITE_URL environment variable');
  }

  const now = new Date();

  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, last_verified, last_email_sent, purge_after_days, verified, purged')
    .eq('purged', false);

  if (error) {
    throw new Error('Error fetching users: ' + error.message);
  }

  if (!users || users.length === 0) {
    return { message: 'No users to process' };
  }

  for (const user of users) {
    console.log('🔍 Processing user:', user.id, user.email);

    let lastVerified = null;
    try {
      lastVerified = user.last_verified ? new Date(user.last_verified) : null;
    } catch {
      lastVerified = null;
    }

    let lastEmailSent = null;
    try {
      lastEmailSent = user.last_email_sent ? new Date(user.last_email_sent) : null;
    } catch {
      lastEmailSent = null;
    }

    if (!lastVerified) {
      console.warn(`⚠️ User ${user.id} has no valid last_verified date, skipping`);
      continue;
    }

    const purgeAfterDays = user.purge_after_days ?? 0;

    const diffSinceVerification = (now - lastVerified) / (1000 * 60 * 60 * 24);
    const diffSinceEmail = lastEmailSent ? (now - lastEmailSent) / (1000 * 60 * 60 * 24) : Infinity;

    // Purge logic
    if (diffSinceVerification >= purgeAfterDays && purgeAfterDays > 0) {
      const { error: updateError } = await supabase
        .from('users')
        .update({ purged: true, purged_at: now.toISOString() })
        .eq('id', user.id);

      if (updateError) {
        console.error(`❌ Failed to purge user ${user.id}:`, updateError);
      } else {
        console.log(`✅ User ${user.id} purged successfully.`);
      }
      continue;
    }

    // Send daily email if 24+ hours passed
    if (diffSinceEmail >= 1) {
      const daysRemaining = Math.ceil(purgeAfterDays - diffSinceVerification);

      try {
        const res = await fetch(`${process.env.SITE_URL}/.netlify/functions/sendVerificationEmail`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            userId: user.id,
            daysRemaining,
            isVerified: user.verified,
          }),
        });

        if (res.ok) {
          await supabase
            .from('users')
            .update({ last_email_sent: now.toISOString() })
            .eq('id', user.id);

          console.log(`📬 Sent verification email to ${user.email}`);
        } else {
          const errMsg = await res.text();
          console.warn(`⚠️ Failed to send email to ${user.email}:`, errMsg);
        }
      } catch (err) {
        console.error(`❌ Error sending email to ${user.email}:`, err);
      }
    }
  }

  return { message: 'Scheduled purge and email check completed' };
}

// ✅ Scheduled function — runs daily
export const scheduledHandler = schedule('@daily', async () => {
  console.log('🕒 scheduledPurge triggered');
  try {
    const result = await runScheduledPurge();
    console.log('🧹 ' + result.message);
    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (e) {
    console.error('❌ Error in scheduledPurge:', e);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Unexpected error', detail: e.message }),
    };
  }
});

// ✅ Manual HTTP handler
export const handler = async (event, context) => {
  console.log('🔥 Manual endpoint hit:', event.httpMethod, event.path);
  try {
    const result = await runScheduledPurge();
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(result),
    };
  } catch (e) {
    console.error('❌ Error in manual purge trigger:', e);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Unexpected error', detail: e.message }),
    };
  }
};
