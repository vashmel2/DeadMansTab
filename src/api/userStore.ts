type User = {
  email: string;
  purgeAfterDays: number;
  registeredAt: string;
  lastEmailSent?: string;
};

const users: Record<string, User> = {};

export function registerUser({ email, purgeAfterDays }: { email: string; purgeAfterDays: number }) {
  const userId = btoa(email); // base64 encode as a simple ID
  users[userId] = {
    email,
    purgeAfterDays,
    registeredAt: new Date().toISOString(),
    lastEmailSent: new Date().toISOString()
  };
  return userId;
}

export function getUser(userId: string) {
  return users[userId] || null;
}

export function updateLastEmailSent(userId: string) {
  if (users[userId]) {
    users[userId].lastEmailSent = new Date().toISOString();
  }
}
