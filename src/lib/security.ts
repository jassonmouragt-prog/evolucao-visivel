import { createHmac, randomBytes, randomInt, scryptSync, timingSafeEqual } from "node:crypto";

export function normalizeCode(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9-]/g, "");
}
export function generateCode(name: string, now = new Date()) {
  const first = normalizeCode(name.trim().split(/\s+/)[0]).replace(/[^A-Z]/g, "").slice(0, 3).padEnd(3, "X");
  return `${first}${String(now.getMonth() + 1).padStart(2, "0")}-${randomInt(10, 100)}${String.fromCharCode(65 + randomInt(26))}`;
}
export function generateResponsibleCode(name: string) {
  const first = normalizeCode(name.trim().split(/\s+/)[0]).replace(/[^A-Z]/g, "").slice(0, 3).padEnd(3, "X");
  return `${first}-${randomInt(10)}${String.fromCharCode(65 + randomInt(26))}${randomInt(10, 100)}`;
}
export function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET deve possuir pelo menos 32 caracteres.");
  return value;
}
export function tokenHash(token: string) { return createHmac("sha256", secret()).update(token).digest("hex"); }
export function newToken() { return randomBytes(32).toString("base64url"); }
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
export function verifyPassword(password: string, hash: string) {
  const [salt, stored] = hash.split(":");
  if (!salt || !stored || stored.length !== 128) return false;
  return timingSafeEqual(scryptSync(password, salt, 64), Buffer.from(stored, "hex"));
}
export const SESSION_DAYS = 14;
