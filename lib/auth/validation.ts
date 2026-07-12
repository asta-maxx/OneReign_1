export function validateEmail(email: unknown): string {
  if (typeof email !== "string") {
    throw new Error("email must be a string");
  }

  const normalized = email.trim().toLowerCase();
  // Simple RFC-like email check for hackathon scope.
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(normalized)) {
    throw new Error("email is invalid");
  }

  return normalized;
}

export function validatePassword(password: unknown): string {
  if (typeof password !== "string") {
    throw new Error("password must be a string");
  }

  const trimmed = password.trim();

  // Enforce minimum strength for safer demos.
  if (trimmed.length < 8) {
    throw new Error("password must be at least 8 characters");
  }

  return trimmed;
}

export function validateSignupBody(body: unknown): {
  email: string;
  password: string;
} {
  if (!body || typeof body !== "object") {
    throw new Error("Request body is required");
  }

  const record = body as Record<string, unknown>;
  const email = validateEmail(record.email);
  const password = validatePassword(record.password);

  return { email, password };
}

