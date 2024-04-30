import { OAuth2Client } from 'google-auth-library';

import admin = require("firebase-admin");


const CLIENT_ID = "423030272874-t2q3clv1q6cgnqbu29f545s690cp3bje.apps.googleusercontent.com";

const client = new OAuth2Client(CLIENT_ID);
export async function verifyIDToken(idToken: string) {
    const ticket = await client.verifyIdToken({
        idToken,
        audience: CLIENT_ID, // Specify the CLIENT ID for the intended audience
    });
    console.log(ticket);
    return ticket.getPayload();
}