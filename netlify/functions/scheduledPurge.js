import { schedule } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch'; // Make sure node-fetch is installed

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const handler = async (event, context) => {
  console.log('🕒 scheduledPurge triggered');

  try {
    const now = new Date();

    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, last_verified, last_email_sent, purge_after_days, verified, purged')
      .eq('purged', false);

    if (error) {
      console.error('❌ Error fetching users:', error);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Error fetching users' }),
      };
    }

    if (!users || users.length === 0) {
      console.log('ℹ️ No users found to process');
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'No users to process' }),
      };
    }

    for (const user of users) {
      console.log('🔍 Processing user:', user.id, user.email);

      // Defensive date parsing
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

    console.log('🧹 Scheduled purge + daily email check completed.');
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Scheduled purge and email check completed' }),
    };
  } catch (e) {
    console.error('❌ Unexpected error in scheduledPurge:', e);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Unexpected error', detail: e.message }),
    };
  }
};

// Export wrapped in schedule for automatic running
export const handler = schedule('@daily', handler);

// Remember to fix this after testing Scheduled Emails Manually