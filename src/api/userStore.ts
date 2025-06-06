import { supabase } from '../lib/supabaseClient'; // adjust path if needed

export type User = {
  id: string;
  email: string;
  purgeAfterDays: number;
  created_at: string;
  lastEmailSent?: string | null;
  isVerified: boolean;
  purged?: boolean;
};

// Register a new user in Supabase users table
export async function registerUser({
  userId,
  email,
  purgeAfterDays,
}: {
  userId: string;
  email: string;
  purgeAfterDays: number;
}) {
  const { data, error } = await supabase
    .from('users')
    .insert({
      id: userId,
      email,
      purgeAfterDays,
      isVerified: false,
      lastEmailSent: new Date().toISOString(),
    });

  if (error) {
    console.error('registerUser error:', error);
    throw error;
  }
  return data;
}

// Get user by userId from Supabase
export async function getUser(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('getUser error:', error);
    return null;
  }
  return data as User;
}

// ✅ New: Get user by email
export async function getUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error) {
    console.error('getUserByEmail error:', error);
    return null;
  }
  return data as User;
}

// Update lastEmailSent timestamp for user
export async function updateLastEmailSent(userId: string) {
  const { error } = await supabase
    .from('users')
    .update({ lastEmailSent: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    console.error('updateLastEmailSent error:', error);
    throw error;
  }
}

// Set user as verified
export async function setUserVerified(userId: string) {
  const { error } = await supabase
    .from('users')
    .update({ isVerified: true })
    .eq('id', userId);

  if (error) {
    console.error('setUserVerified error:', error);
    throw error;
  }
}
