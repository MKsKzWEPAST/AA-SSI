import { OAuth2Client } from 'google-auth-library';

const CLIENT_ID = "423030272874-2sqc5pefkm14a9lsd1vfp278665l7nro.apps.googleusercontent.com";

const client = new OAuth2Client(CLIENT_ID);
export async function verifyIDToken(idToken: string) {
    const ticket = await client.verifyIdToken({
        idToken,
        audience: CLIENT_ID, // Specify the CLIENT ID for the intended audience
    });
    return ticket.getPayload();
}