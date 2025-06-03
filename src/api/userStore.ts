import { UserData } from '../types';

// In-memory storage for user data
const userDatabase: UserData[] = [];

export const registerUser = (data: UserData): void => {
  const existingUserIndex = userDatabase.findIndex(user => user.email === data.email);
  
  if (existingUserIndex !== -1) {
    userDatabase[existingUserIndex] = {
      ...data,
      lastEmailSent: new Date().toISOString()
    };
  } else {
    userDatabase.push({
      ...data,
      lastEmailSent: new Date().toISOString()
    });
  }
  
  console.log('[User Registered]', data);
};

export const getUser = (email: string): UserData | undefined => {
  return userDatabase.find(user => user.email === email);
};