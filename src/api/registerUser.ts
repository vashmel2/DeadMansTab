import { UserData } from '../types';
import { registerUser } from './userStore';

export const POST = async (req: Request): Promise<Response> => {
  try {
    const data: UserData = await req.json();
    
    if (!data.email || !data.purgeAfterDays) {
      return new Response(
        JSON.stringify({ error: 'Email and purgeAfterDays are required' }), 
        { status: 400 }
      );
    }

    registerUser(data);
    
    return new Response(
      JSON.stringify({ success: true }), 
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Invalid request data' }), 
      { status: 400 }
    );
  }
};