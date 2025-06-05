import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const handler: Handler = async (event) => {
  const { userId } = JSON.parse(event.body || '{}');

  if (!userId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing userId' }),
    };
  }

  // Fetch user data
  const { data: user, error } = await supabase
    .from('users')
    .select('last_verified, purge_after_days')
    .eq('id', userId)
    .single();

  if (error || !user) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'User not found' }),
    };
  }

  const lastVerified = new Date(user.last_verified);
  const purgeAfterDays = user.purge_after_days;
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - lastVerified.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays >= purgeAfterDays) {
    // Perform purge logic here
    // For example, update 'purged' and 'purged_at' columns
    const { error: updateError } = await supabase
      .from('users')
      .update({ purged: true, purged_at: now.toISOString() })
      .eq('id', userId);

    if (updateError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to update purge status' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'User purged successfully' }),
    };
  } else {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Purge not needed yet' }),
    };
  }
};

export { handler };
