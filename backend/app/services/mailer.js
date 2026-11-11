import logger from "../config/logger.js";

/**
 * Single outbound mail port for reservation notices.
 * Development logs the message; production can wire SMTP via MAIL_FROM later.
 */
export async function send({ to, subject, body }) {
  if (!to) {
    throw new Error("Mail recipient is required.");
  }

  if (process.env.NODE_ENV === "test") {
    return { to, subject, body };
  }

  const from = process.env.MAIL_FROM;
  logger.info(`Mail to=${to} from=${from || "(unset)"} subject=${subject}`);
  logger.info(body);
  return { to, subject, body, from };
}
