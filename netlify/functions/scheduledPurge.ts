import { schedule } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const handler = async () => {
  const now = new Date();

  // Fetch all users who are not yet purged
  const { data: users, error } = await supabase
    .from('users')
    .select('id, last_verified, purge_after_days')
    .eq('purged', false);

  if (error || !users) {
    console.error('Error fetching users:', error);
    return;
  }

  for (const user of users) {
    const lastVerified = new Date(user.last_verified);
    const purgeAfterDays = user.purge_after_days;
    const diffTime = Math.abs(now.getTime() - lastVerified.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= purgeAfterDays) {
      // Perform purge logic here
      const { error: updateError } = await supabase
        .from('users')
        .update({ purged: true, purged_at: now.toISOString() })
        .eq('id', user.id);

      if (updateError) {
        console.error(`Failed to purge user ${user.id}:`, updateError);
      } else {
        console.log(`User ${user.id} purged successfully.`);
      }
    }
  }
};

export const handler = schedule('@daily', handler);
