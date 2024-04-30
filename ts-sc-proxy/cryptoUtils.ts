import crypto = require('crypto');
import {ethers} from 'ethers';

// Please use environment variables in production instead of hard coding secrets and private keys.
const secret = generateSHA256HashRaw('secutix_secret-aes-db-comm');  // for the purpose of the PoC, this is hardcoded here.
const algorithm = 'aes-256-gcm';

export function encrypt(text: string): string {
    const iv = crypto.randomBytes(16); // generate a new IV for each encryption
    const cipher = crypto.createCipheriv(algorithm, secret, iv);
    let encrypted = cipher.update(text, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const authTag = cipher.getAuthTag(); // Retrieve the authentication tag
    // Return IV, encrypted data, and auth tag as a single string
    return `${iv.toString('hex')}:${encrypted.toString('hex')}:${authTag.toString('hex')}`;
}

export function decrypt(text: string): string {
    const parts = text.split(':');
    if (parts.length !== 3) {
        throw new Error("Invalid encrypted text. Expected format [iv:encrypted:tag].");
    }
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = Buffer.from(parts[1], 'hex');
    const authTag = Buffer.from(parts[2], 'hex');

    const decipher = crypto.createDecipheriv(algorithm, secret, iv);
    decipher.setAuthTag(authTag); // Set the authentication tag for decryption
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]); // Finalize decryption
    return decrypted.toString('utf8');
}
/**
 * Generates a SHA-256 hash of the provided string.
 *
 * @param input The string to hash.
 * @returns A 32-byte hexadecimal string.
 */
export function generateSHA256Hash(input: string): string {
    const hash = crypto.createHash('sha256');
    hash.update(input);
    return hash.digest('hex');
}

export function generateSHA256HashRaw(input: string): Buffer {
    const hash = crypto.createHash('sha256');
    hash.update(input);
    return hash.digest();
}

export function computePrivateKeyFrom(email: string, sub: string): string {
    const nonce = crypto.randomBytes(16).toString('hex');
    // Concatenate the email and sub to form a unique string.
    return generateSHA256Hash(`${email}${sub}${nonce}`)
}