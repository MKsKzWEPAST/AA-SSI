import sqlite3 = require('sqlite3');
import { open } from 'sqlite';
import { encrypt, decrypt } from './cryptoUtils';

// Open the SQLite Database
async function openDb() {
    return open({
        filename: './proxydb.sqlite',
        driver: sqlite3.Database
    });
}

export async function initializeDatabase() {
    const db = await openDb();
    await db.exec(`CREATE TABLE IF NOT EXISTS credentials (
        sub TEXT,
        private_key TEXT,
        address TEXT,
        email TEXT
    )`);
}

export async function insertCredential(sub: string, privateKey: string, address: string, email: string) {
    const db = await openDb();
    await db.run(`INSERT INTO credentials (sub, private_key, address, email) VALUES (?, ?, ?, ?)`, [
        encrypt(sub),
        encrypt(privateKey),
        encrypt(address),
        encrypt(email)
    ]);
}

export async function getCredential(sub: string) {
    const db = await openDb();
    const row = await db.get(`SELECT sub, private_key, address, email FROM credentials WHERE sub = ?`, encrypt(sub));
    if (row) {
        return {
            sub: decrypt(row.sub),
            privateKey: decrypt(row.private_key),
            address: decrypt(row.address),
            email: decrypt(row.email)
        };
    }
    return null;
}