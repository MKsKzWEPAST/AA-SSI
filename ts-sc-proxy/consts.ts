// TOKEN decimals set at 18 (common decimals for price)
import {Presets} from "userop";

export const TOKEN_ADDRESSES = new Map([
    ["dai", "0xd7dB0FE7506829004c99d75d1c04c6498CA9A270"],
    ["tusd", "0x345a017dC4A6E3082FEe99DB5FAfA5C02bBA0e57"],
]);

// ABIs =============================
const TOKEN_ABIS = new Map([
    ["dai", "./ABIs/DaiAbi.json"],
    ["tusd", "./ABIs/TrueUSDAbi.json"],
]);

// TOKEN decimals set at 18 (common decimals for price)
const TOKEN_DECIMALS = BigInt(18);

// stackup =======================

export const rpcUrl = 'https://api.stackup.sh/v1/node/04832ebeb6088d4ca33e86e7bc9054fdc03115d2d1e295df3122acf11817fb95';
export const paymasterUrl = 'https://api.stackup.sh/v1/paymaster/04832ebeb6088d4ca33e86e7bc9054fdc03115d2d1e295df3122acf11817fb95';
export const paymasterMiddleware = Presets.Middleware.verifyingPaymaster(paymasterUrl, {type: 'payg'});
export const opts = {paymasterMiddleware: paymasterMiddleware};


// smart contracts ===================
export const verifierSCAddress = "0x1cf0a1819Dd8853d5c69f6896Fe78373Dd33b962";
export const smartMoneyAddress = "0x1973dD4486c8BA89C7ab3988Cc54e60F6E54Ef66";

