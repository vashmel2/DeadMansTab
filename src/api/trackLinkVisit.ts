import { logClick } from './clickStore';

export const GET = async (request: Request): Promise<Response> => {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');

  if (!userId) {
    return new Response(
      JSON.stringify({ error: 'Missing userId parameter' }), 
      { status: 400 }
    );
  }

  const timestamp = new Date().toISOString();
  
  logClick({
    userId,
    timestamp,
    ip: request.headers.get('x-forwarded-for') || 'unknown'
  });

  return new Response(
    JSON.stringify({ success: true }), 
    { status: 200 }
  );
};