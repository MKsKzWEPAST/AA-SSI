import crypto = require('crypto');
import {ethers} from 'ethers';

// Please use environment variables in production instead of hard coding secrets and private keys.
const secret = generateSHA256Hash('secutix_secret-aes-db-comm');  // for the purpose of the PoC, this is hardcoded here.
const algorithm = 'aes-256-gcm';

export function encrypt(text: string): string {
    const iv = crypto.randomBytes(16); // generate a new iv for each encryption
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(secret), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secret), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
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

export function computePrivateKeyFrom(email: string, sub: string): string {
    const nonce = crypto.randomBytes(16).toString('hex');
    // Concatenate the email and sub to form a unique string.
    return generateSHA256Hash(`${email}${sub}${nonce}`)
}