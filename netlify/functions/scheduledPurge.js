import { schedule } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const handler = async () => {
  const now = new Date();

  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, last_verified, last_email_sent, purge_after_days, verified, purged')
    .eq('purged', false);

  if (error || !users) {
    console.error('❌ Error fetching users:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error fetching users' }),
    };
  }

  for (const user of users) {
    const lastVerified = new Date(user.last_verified);
    const lastEmailSent = user.last_email_sent ? new Date(user.last_email_sent) : null;
    const purgeAfterDays = user.purge_after_days;

    const diffSinceVerification = (now - lastVerified) / (1000 * 60 * 60 * 24);
    const diffSinceEmail = lastEmailSent ? (now - lastEmailSent) / (1000 * 60 * 60 * 24) : Infinity;

    // 🧹 Purge logic
    if (diffSinceVerification >= purgeAfterDays) {
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

    // ✉️ Send daily email
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
    body: JSON.stringify({ message: 'Scheduled purge and email check completed' }),
  };
};

export const handler = schedule('@daily', handler);
