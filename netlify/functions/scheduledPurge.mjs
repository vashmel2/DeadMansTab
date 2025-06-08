import { schedule } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runScheduledPurge() {
  const now = new Date();

  if (!process.env.SITE_URL) {
    throw new Error('Missing SITE_URL environment variable');
  }

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

    const lastVerified = user.last_verified ? new Date(user.last_verified) : null;
    const lastEmailSent = user.last_email_sent ? new Date(user.last_email_sent) : null;

    if (!lastVerified) {
      console.warn(`⚠️ User ${user.id} has no valid last_verified date, skipping`);
      continue;
    }

    const purgeAfterDays = user.purge_after_days || 0;
    const diffSinceVerification = (now - lastVerified) / (1000 * 60 * 60 * 24);
    const diffSinceEmail = lastEmailSent
      ? (now - lastEmailSent) / (1000 * 60 * 60 * 24)
      : Infinity;

    // Purge condition
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

    const daysRemaining = Math.ceil(purgeAfterDays - diffSinceVerification);

    // Only send email if it has been more than 1 day since last email
    if (diffSinceEmail >= 1) {
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
    } else {
      console.log(`⏳ Skipping email for ${user.email}, sent less than 1 day ago.`);
    }
  }

  return { message: 'Scheduled purge and email check completed' };
}

// 🔁 Run once daily at 00:05 UTC (adjust time as you like)
export const handler = schedule('5 0 * * *', async () => {
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
