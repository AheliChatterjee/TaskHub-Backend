const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendPasswordResetEmail(toEmail, token) {
  const resetLink = `${process.env.RESET_PASSWORD_URL}?token=${token}`;
  try {
    toEmail="taskhub6@gmail.com"//to be commented out later
    await resend.emails.send({
      from: "onboarding@resend.dev", //replace with your domain verified URL
      to: toEmail,
      subject: "Reset Your TaskHub Password",
      html: `
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>This link expires in 1 hour.</p>
      `
    });
  } catch (error) {
    console.error("Failed to send reset email:", error);
    throw new Error("Could not send reset email");
  }
}

module.exports = sendPasswordResetEmail;