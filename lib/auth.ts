import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { db } from "./db";

const COOKIE = "afly_session";
const SESSION_DAYS = 7;

export function hashPassword(password: string, salt?: string) {
  const s = salt ?? randomBytes(16).toString("hex");
  const hash = createHash("sha256").update(`${s}:${password}`).digest("hex");
  return `${s}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt] = stored.split(":");
  if (!salt) return false;
  return hashPassword(password, salt) === stored;
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.session.create({ data: { token, userId, expiresAt } });
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
  return token;
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    await db.session.deleteMany({ where: { token } });
    jar.delete(COOKIE);
  }
}

export async function getCurrentUser() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  if (session.user.status === "SUSPENDED") return null;
  return session.user;
}
