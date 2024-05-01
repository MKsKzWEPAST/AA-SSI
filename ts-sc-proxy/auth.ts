import { OAuth2Client } from 'google-auth-library';

import admin = require("firebase-admin");
import {getCredential} from "./db";


const CLIENT_ID = "423030272874-t2q3clv1q6cgnqbu29f545s690cp3bje.apps.googleusercontent.com";

const client = new OAuth2Client(CLIENT_ID);
export async function verifyIDToken(idToken: string) {
    const ticket = await client.verifyIdToken({
        idToken,
        audience: CLIENT_ID, // Specify the CLIENT ID for the intended audience
    });
    return ticket.getPayload();
}

// helper function authenticating a user using the email and id token from Google sign in.
export async function authenticate(id_token: string, post_email: string) {
    if (!id_token || !post_email) {
        return {"code": 400,"credential": null,"sub": "","message": 'Missing required fields to access address'};
    }

    try {

        // get token id payload
        let payload = await verifyIDToken(id_token);
        if (!payload) {
            return {"code": 401,"credential": null,"sub": "", "message": 'Token verification failed'};
        }
        // verify email validity and sub for user_id

        const {sub, email} = payload;
        if (email != post_email) {
            return {"code": 401,"credential": null,"sub": "", "message": 'Email verification failed'};
        }

        return {"code": 200,"credential": await getCredential(sub),"sub":sub,"message": ''};

    } catch (error) {
        console.log(error);
        return {"code": 500,"credential": null,"sub":"","message": 'An error occurred while fetching the address'};
    }
}