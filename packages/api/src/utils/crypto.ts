import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString("hex");
    const derivedKey = await scryptAsync(password, salt, 64) as Buffer;
    return `${salt}:${derivedKey.toString('hex')}`;
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
        const [salt, storedKeyHex] = hashedPassword.split(":");

        if (!salt || !storedKeyHex) {
            throw new Error("Invalid hash format");
        }

        const derivedKey = await scryptAsync(password, salt, 64) as Buffer;
        const storedKeyBuffer = Buffer.from(storedKeyHex, 'hex');

        // Use constant-time comparison to prevent timing attacks
        return timingSafeEqual(derivedKey, storedKeyBuffer);
    } catch (error) {
        console.error("Password verification error:", error);
        return false;
    }
}