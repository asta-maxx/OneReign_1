import bcryptjs from "bcryptjs";

// Production-grade bcrypt params for fast hackathon demos while remaining secure.
// 12 is a common baseline; keep it configurable if needed later.
const DEFAULT_WORK_FACTOR = 12;

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcryptjs.genSalt(DEFAULT_WORK_FACTOR);
  return bcryptjs.hash(password, salt);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcryptjs.compare(password, hashedPassword);
}

