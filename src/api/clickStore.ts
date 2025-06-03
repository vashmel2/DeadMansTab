type Click = {
  userId: string;
  timestamp: string;
  ip?: string;
};

const clicks: Record<string, Click[]> = {};

export function logClick(click: Click) {
  if (!clicks[click.userId]) {
    clicks[click.userId] = [];
  }
  clicks[click.userId].push(click);
}

export function getClicksByUserId(userId: string) {
  return clicks[userId] || [];
}
