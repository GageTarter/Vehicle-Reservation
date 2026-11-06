/**
 * Email transport. SMTP is not configured in this kit; tests inject a mock.
 * Set SMTP_HOST when a provider is available — until then, sendEmail fails
 * instead of recording a successful send.
 */
async function defaultTransport() {
  if (!process.env.SMTP_HOST) {
    const error = new Error("Email provider is not configured.");
    error.code = "EMAIL_NOT_CONFIGURED";
    throw error;
  }

  const error = new Error("SMTP transport is not wired to a provider.");
  error.code = "EMAIL_NOT_CONFIGURED";
  throw error;
}

let transport = defaultTransport;

export function setMailTransport(fn) {
  transport = fn;
}

export function resetMailTransport() {
  transport = defaultTransport;
}

export async function sendEmail({ to, subject, text }) {
  if (!to?.trim()) {
    const error = new Error("A valid recipient email is required.");
    error.code = "MISSING_RECIPIENT";
    throw error;
  }

  await transport({ to: to.trim(), subject, text });
}
