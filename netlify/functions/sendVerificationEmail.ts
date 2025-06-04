import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

/**
 * Sends a verification email with a "still alive" link.
 */
export const sendVerificationEmail = async (email: string, userId: string) => {
  const verificationLink = `https://deadmanstabdev.netlify.app/.netlify/functions/verifyUser?email=${encodeURIComponent(email)}`;

  console.log(`🔗 Sending verification link to ${email}: ${verificationLink}`);

  const { error } = await resend.emails.send({
    from: 'Dead Man\'s Tab <no-reply@deadmanstab.com>',
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
    throw new Error('Failed to send verification email');
  }

  console.log(`✅ Verification email sent to ${email}`);
};
