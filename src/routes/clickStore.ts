export type ClickData = {
  userId: string;
  timestamp: string;
  ip: string | undefined;
};

export const clickDatabase: ClickData[] = [];

export function logClick(data: ClickData) {
  clickDatabase.push(data);
}
