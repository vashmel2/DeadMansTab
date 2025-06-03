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

  const clicks = getClicksByUserId(userId);
  
  return new Response(
    JSON.stringify(clicks), 
    { status: 200 }
  );
};