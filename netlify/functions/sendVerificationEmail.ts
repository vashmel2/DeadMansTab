import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

const sendVerificationEmailHandler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method Not Allowed' }),
      };
    }

    const { email, userId } = JSON.parse(event.body || '{}');

    if (!email || !userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing email or userId' }),
      };
    }

    const verificationLink = `https://deadmanstabdev.netlify.app/.netlify/functions/verifyUser?userId=${encodeURIComponent(
      userId
    )}`;

    console.log(`🔗 Sending verification link to ${email}: ${verificationLink}`);

    const { error } = await resend.emails.send({
      from: 'Deadman’s Tab <noreply@resend.dev>',
      to: [email],
      subject: '🔒 Verify Your Tab',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">You're Still Alive... Right?</h2>
          <p>Hey there!</p>
          <p>To avoid getting purged, just click the link below to verify your existence:</p>
          <p><a href="${verificationLink}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">I’m alive, don’t purge me</a></p>
          <p>If you didn’t sign up for Dead Man’s Tab, you can ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      console.error('❌ Resend email sending error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to send verification email' }),
      };
    }

    console.log(`✅ Verification email sent to ${email}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error('❌ Error in sendVerificationEmail:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};

export { sendVerificationEmailHandler as handler };
