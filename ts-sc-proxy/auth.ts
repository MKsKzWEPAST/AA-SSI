import {OAuth2Client} from 'google-auth-library';
import {getCredential} from "./db";
import {CLIENT_ID} from "./consts";
import {getAuth} from "firebase-admin/auth";
import {fbApp} from "./main";

const client = new OAuth2Client(CLIENT_ID);
export async function verifyGoogleIDToken(idToken: string) {
    const ticket = await client.verifyIdToken({
        idToken,
        audience: CLIENT_ID, // Specify the CLIENT ID for the intended audience
    });
    return ticket.getPayload();
}

export async function verifyFirebaseToken(token: string) {
    try {
        return await getAuth(fbApp).verifyIdToken(token);
    } catch (e) {
        console.log(`Error while verifying id token with firebase: ${e}`);
    }

}

// helper function authenticating a user using the email and id token from Google sign in.
export async function authenticate(id_token: string, post_email: string) {
    if (!id_token || !post_email) {
        return {"code": 400,"credential": null,"sub": "","message": 'Missing required fields to access address'};
    }

    try {
        // get token id payload
        let payload = await verifyFirebaseToken(id_token);
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