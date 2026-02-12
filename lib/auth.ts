import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const SALT_ROUNDS = 10; // Standard for performance vs security
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  // This ensures your app crashes in production if you forget the secret
  // rather than running insecurely.
  throw new Error("Please define the JWT_SECRET environment variable");
}

/**
 * Hashes a plain text password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verifies a password against a hash
 */
export async function verifyPassword(
  plainText: string,
  hash: string,
): Promise<boolean> {
  return await bcrypt.compare(plainText, hash);
}

/**
 * Generates a JWT token for a user
 * Expiration defaults to 12 hours (good for hostel shifts)
 */
export function generateToken(payload: object): string {
  return jwt.sign(payload, JWT_SECRET!, { expiresIn: "12h" });
}

/**
 * Verifies and decodes a JWT token
 * Returns null if invalid
 */
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET!);
  } catch (error) {
    return null;
  }
}
