import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
export function hashPassword(password: string) { const salt=randomBytes(16).toString('hex'); return salt+':'+scryptSync(password,salt,64).toString('hex'); }
export function verifyPassword(password: string, hash: string) { try { const [salt,value]=hash.split(':'); return timingSafeEqual(Buffer.from(value,'hex'),scryptSync(password,salt,64)); } catch { return false; } }
