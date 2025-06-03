import { getUser } from './userStore';
import { getClicksByUserId } from './clickStore';

export const GET = async (request: Request): Promise<Response> => {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');

  if (!userId) {
    return new Response(
      JSON.stringify({ error: 'Missing userId parameter' }), 
      { status: 400 }
    );
  }

  const user = getUser(userId);
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'User not found' }), 
      { status: 404 }
    );
  }

  const clicks = getClicksByUserId(userId);
  const lastClick = clicks.length > 0 
    ? new Date(clicks[clicks.length - 1].timestamp)
    : null;
  
  const lastEmailSent = user.lastEmailSent 
    ? new Date(user.lastEmailSent)
    : new Date();
  
  const now = new Date();
  const referenceDate = lastClick || lastEmailSent;
  const daysPassed = (now.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysPassed >= user.purgeAfterDays) {
    console.log(`[PURGE TRIGGERED] Sending purge email to ${userId}`);
    return new Response(
      JSON.stringify({ 
        status: 'Purge Triggered',
        daysLeft: 0
      }), 
      { status: 200 }
    );
  }

  return new Response(
    JSON.stringify({ 
      status: 'Waiting',
      daysLeft: user.purgeAfterDays - daysPassed
    }), 
    { status: 200 }
  );
};