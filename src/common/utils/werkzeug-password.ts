import { pbkdf2Sync, scryptSync, timingSafeEqual } from 'node:crypto';

/**
 * Verifies a password against a Werkzeug-style hash.
 * Supports:
 * - PBKDF2-SHA256: pbkdf2:sha256:iterations$salt$hash
 * - Scrypt: scrypt:N:r:p$salt$hash (e.g. scrypt:32768:8:1$...)
 *
 * @param password - Plain text password
 * @param storedHash - Hash string from Werkzeug (generate_password_hash)
 * @returns true if password matches
 */
export function checkWerkzeugPassword(password: string, storedHash: string): boolean {
    if (!password || !storedHash) return false;

    try {
        if (storedHash.startsWith('pbkdf2:')) {
            return verifyPbkdf2(password, storedHash);
        }
        if (storedHash.startsWith('scrypt:')) {
            return verifyScrypt(password, storedHash);
        }
        return false;
    } catch {
        return false;
    }
}

function verifyPbkdf2(password: string, storedHash: string): boolean {
    const parts = storedHash.split('$');
    if (parts.length !== 3) return false;
    const [header, salt, hashHex] = parts;
    const headerParts = header.split(':');
    if (headerParts.length < 3) return false;
    const digest = headerParts[1];
    const iterations = parseInt(headerParts[2], 10);
    if (isNaN(iterations) || iterations <= 0) return false;

    const keyLen = 32;
    const derivedKey = pbkdf2Sync(
        password,
        salt,
        iterations,
        keyLen,
        digest as 'sha256' | 'sha512',
    ).toString('hex');
    return timingSafeEqual(Buffer.from(hashHex, 'hex'), Buffer.from(derivedKey, 'hex'));
}

function verifyScrypt(password: string, storedHash: string): boolean {
    const parts = storedHash.split('$');
    if (parts.length !== 3) return false;
    const [header, salt, hashHex] = parts;
    const headerParts = header.split(':');
    if (headerParts.length < 4) return false;
    const n = parseInt(headerParts[1], 10);
    const r = parseInt(headerParts[2], 10);
    const p = parseInt(headerParts[3], 10);
    if (isNaN(n) || isNaN(r) || isNaN(p) || n <= 0 || r <= 0 || p <= 0) return false;

    const keyLen = Buffer.from(hashHex, 'hex').length;
    const derivedKey = scryptSync(password, salt, keyLen, {
        N: n,
        r,
        p,
    });
    const storedBuffer = Buffer.from(hashHex, 'hex');
    if (derivedKey.length !== storedBuffer.length) return false;
    return timingSafeEqual(derivedKey, storedBuffer);
}
