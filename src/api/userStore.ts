type User = {
  email: string;
  purgeAfterDays: number;
  registeredAt: string;
  lastEmailSent?: string;
  isVerified: boolean;
};

const users: Record<string, User> = {};

// Register user with backend-generated userId
export function registerUser({ userId, email, purgeAfterDays }: { userId: string; email: string; purgeAfterDays: number }) {
  users[userId] = {
    email,
    purgeAfterDays,
    registeredAt: new Date().toISOString(),
    lastEmailSent: new Date().toISOString(),
    isVerified: false,
  };
}

export function getUser(userId: string): User | null {
  return users[userId] || null;
}

export function updateLastEmailSent(userId: string) {
  if (users[userId]) {
    users[userId].lastEmailSent = new Date().toISOString();
  }
}

export function setUserVerified(userId: string) {
  if (users[userId]) {
    users[userId].isVerified = true;
  }
}
