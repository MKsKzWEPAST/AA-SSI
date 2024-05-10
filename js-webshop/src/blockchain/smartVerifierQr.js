import {AGE_VERIFIER_ADDRESS} from "../consts";

const age_verifier_address = AGE_VERIFIER_ADDRESS;

export default function GetAuthRequestAge(orderID, date) {

    const data = {
        "id": "7f38a193-0918-4a48-9fac-36adfdb8b542",
        "typ": "application/iden3comm-plain-json",
        "type": "https://iden3-communication.io/proofs/1.0/contract-invoke-request",
        "thid": "7f38a193-0918-4a48-9fac-36adfdb8b542",
        "body": {
            "reason": "Age check for alcohol",
            "transaction_data": {
                "contract_address": age_verifier_address,
                "method_id": "b68967e2",
                "chain_id": 80002,
                "network": "polygon-amoy"
            },
            "scope": [
                {
                    "id": orderID,
                    "circuitId": "credentialAtomicQuerySigV2OnChain",
                    "query": {
                        "allowedIssuers": ["*"],
                        "context": "https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld",
                        "credentialSubject": {
                            "birthday": {
                                "$lt": date
                            }
                        },
                        "type": "KYCAgeCredential"
                    }
                }
            ]
        }
    };

    return JSON.stringify(data);
}