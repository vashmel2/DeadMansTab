import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: 'OK',
    };
  }

  const { userId } = JSON.parse(event.body || '{}');

  if (!userId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing userId' }),
    };
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('last_verified, purge_after_days')
    .eq('id', userId)
    .single();

  if (error || !user) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'User not found' }),
    };
  }

  const lastVerified = new Date(user.last_verified);
  const purgeAfterDays = user.purge_after_days;
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - lastVerified.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays >= purgeAfterDays) {
    const { error: updateError } = await supabase
      .from('users')
      .update({ purged: true, purged_at: now.toISOString() })
      .eq('id', userId);

    if (updateError) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to update purge status' }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'User purged successfully' }),
    };
  } else {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Purge not needed yet' }),
    };
  }
};

export { handler };
