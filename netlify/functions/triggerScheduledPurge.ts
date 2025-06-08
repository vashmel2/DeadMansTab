// netlify/functions/triggerScheduledPurge.ts
import { handler as purgeHandler } from './scheduledPurge.mjs'

export const handler = async (event, context) => {
  return await purgeHandler(event, context)
}
