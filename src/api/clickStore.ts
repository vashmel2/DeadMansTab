import { ClickData } from '../types';

// In-memory storage for click data
const clickDatabase: ClickData[] = [];

export const logClick = (data: ClickData): void => {
  clickDatabase.push(data);
  console.log('[Click Logged]', data);
};

export const getClicksByUserId = (userId: string): ClickData[] => {
  return clickDatabase.filter(click => click.userId === userId);
};