import {Presets} from "userop";

export const TOKEN_ADDRESSES = new Map([
    ["dai", "0xd7dB0FE7506829004c99d75d1c04c6498CA9A270"],
    ["tusd", "0x345a017dC4A6E3082FEe99DB5FAfA5C02bBA0e57"],
]);

// ABIs =============================
export const TOKEN_ABIS = new Map([
    ["dai", "./ABIs/DaiAbi.json"],
    ["tusd", "./ABIs/TrueUSDAbi.json"],
]);

// TOKEN decimals set at 18 (common decimals for price)
export const TOKEN_DECIMALS = BigInt(18);

// stackup =======================
export const rpcUrl = 'https://api.stackup.sh/v1/node/04832ebeb6088d4ca33e86e7bc9054fdc03115d2d1e295df3122acf11817fb95';
export const paymasterUrl = 'https://api.stackup.sh/v1/paymaster/04832ebeb6088d4ca33e86e7bc9054fdc03115d2d1e295df3122acf11817fb95';
export const paymasterMiddleware = Presets.Middleware.verifyingPaymaster(paymasterUrl, {type: 'payg'});
export const opts = {paymasterMiddleware: paymasterMiddleware};


// smart contracts ===================
export const verifierSCAddress = "0xf463aefB5975e712059eAF56276a7dfe7D4B5542";
export const smartMoneyAddress = "0x46346F5Db118505707F17B6c1805D0a557bb3ADA";

// google auth ==================
export const CLIENT_ID = "450618253210-eaoigvic0jsf099369qaf0a6nfs8903q.apps.googleusercontent.com";
