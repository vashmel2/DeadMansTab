import { handler } from '../netlify/functions/scheduledPurge.js';

handler({}, {} as any)
  .then(() => console.log('Scheduled purge ran successfully!'))
  .catch((err) => console.error('Error running scheduled purge:', err));
