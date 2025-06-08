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

// Main purge logic
async function runScheduledPurge() {
  const SITE_URL = process.env.SITE_URL;
  if (!SITE_URL) throw new Error('Missing SITE_URL environment variable');

  const now = new Date();

  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, last_verified, last_email_sent, purge_after_days, verified, purged')
    .eq('purged', false);

  if (error) throw new Error('Error fetching users: ' + error.message);
  if (!users || users.length === 0) return { message: 'No users to process' };

  for (const user of users) {
    console.log('🔍 Processing user:', user.id, user.email);

    const lastVerified = user.last_verified ? new Date(user.last_verified) : null;
    const lastEmailSent = user.last_email_sent ? new Date(user.last_email_sent) : null;

    if (!lastVerified) {
      console.warn(`⚠️ Skipping user ${user.id}, no last_verified date`);
      continue;
    }

    const purgeAfterDays = user.purge_after_days ?? 0;
    const diffSinceVerification = (now - lastVerified) / (1000 * 60 * 60 * 24);
    const diffSinceEmail = lastEmailSent ? (now - lastEmailSent) / (1000 * 60 * 60 * 24) : Infinity;

    // Trigger purge if needed
    if (purgeAfterDays > 0 && diffSinceVerification >= purgeAfterDays) {
      const { error: purgeError } = await supabase
        .from('users')
        .update({ purged: true, purged_at: now.toISOString() })
        .eq('id', user.id);

      if (purgeError) {
        console.error(`❌ Failed to purge user ${user.id}:`, purgeError.message);
      } else {
        console.log(`✅ User ${user.id} purged successfully`);
      }
      continue; // skip email if purged
    }

    // Send daily check-in email
    if (diffSinceEmail >= 1) {
      const daysRemaining = Math.max(0, Math.ceil(purgeAfterDays - diffSinceVerification));
      try {
        const response = await fetch(`${SITE_URL}/.netlify/functions/sendVerificationEmail`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            userId: user.id,
            daysRemaining,
            isVerified: user.verified,
          }),
        });

        if (response.ok) {
          await supabase
            .from('users')
            .update({ last_email_sent: now.toISOString() })
            .eq('id', user.id);
          console.log(`📬 Email sent to ${user.email}`);
        } else {
          const errMsg = await response.text();
          console.warn(`⚠️ Failed to send email to ${user.email}: ${errMsg}`);
        }
      } catch (err) {
        console.error(`❌ Error sending email to ${user.email}:`, err.message);
      }
    }
  }

  return { message: 'Scheduled purge and email check complete' };
}

// Scheduled function runs daily
export const handler = schedule('@daily', async (event, context) => {
  console.log('🕒 scheduledPurge triggered');
  try {
    const result = await runScheduledPurge();
    console.log('✅', result.message);
    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (err) {
    console.error('❌ Scheduled purge error:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Scheduled purge failed', detail: err.message }),
    };
  }
});

// Manual HTTP test support
export const manual = async (event, context) => {
  console.log('🚀 Manual purge triggered');
  try {
    const result = await runScheduledPurge();
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(result),
    };
  } catch (err) {
    console.error('❌ Manual purge error:', err.message);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Manual purge failed', detail: err.message }),
    };
  }
};
