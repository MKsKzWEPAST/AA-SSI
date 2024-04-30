import express = require('express');
import bodyParser = require('body-parser');
import {initializeDatabase, getCredential, insertCredential} from './db'
import {ethers} from 'ethers';
import {Presets, Client} from 'userop';
import {verifyIDToken} from "./auth";
import {computePrivateKeyFrom} from "./cryptoUtils"

const rpcUrl = 'https://api.stackup.sh/v1/node/04832ebeb6088d4ca33e86e7bc9054fdc03115d2d1e295df3122acf11817fb95';
const paymasterUrl = 'https://api.stackup.sh/v1/paymaster/04832ebeb6088d4ca33e86e7bc9054fdc03115d2d1e295df3122acf11817fb95';
const paymasterMiddleware = Presets.Middleware.verifyingPaymaster(paymasterUrl, {type: 'payg'});
const opts = {paymasterMiddleware: paymasterMiddleware};

const verifierSCAddress = "0x1cf0a1819Dd8853d5c69f6896Fe78373Dd33b962";
const smartMoneyAddress = "0x1973dD4486c8BA89C7ab3988Cc54e60F6E54Ef66";

initializeDatabase().then(() => console.log("db initialized"));

// TOKEN decimals set at 18 (common decimals for price)
const TOKEN_DECIMALS = BigInt(18);

const TOKEN_ADDRESSES = new Map([
    ["dai", "0xd7dB0FE7506829004c99d75d1c04c6498CA9A270"],
    ["tusd", "0x345a017dC4A6E3082FEe99DB5FAfA5C02bBA0e57"],
]);

const TOKEN_ABIS = new Map([
    ["dai", "./ABIs/DaiABI.json"],
    ["tusd", "./ABIs/TetherUSDAbi.json"],
]);

import SmartMoneyABI = require('./ABIs/SmartMoneyAbi.json');

const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
const smartMoney = new ethers.Contract(smartMoneyAddress, SmartMoneyABI, provider);

const orders: Map<number, boolean> = new Map();


async function payERC20(orderID: number, amountToken: number, token: string, shopSmartMoney: string) {
    // Initialize the account
    const signingKey = getAccountPrivateKey("01"); // TODO more than test-id 01 for the POC if needed
    const signer = new ethers.Wallet(signingKey);
    const builder = await Presets.Builder.SimpleAccount.init(signer, rpcUrl, opts);
    const address = builder.getSender();

    console.log(`Account address: ${address}`);

    // Create the call data
    let tokenAddress = TOKEN_ADDRESSES.get(token)!;

    // Read the ERC-20 token contract
    const abi_path = TOKEN_ABIS.get(token);
    if (abi_path == undefined) {
        console.log(`Invalid token name: ${token}`);
        return;
    }
    const ERC20_ABI = require(abi_path); // ERC-20 ABI in json format
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl,);
    const erc20 = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const amount = BigInt(amountToken) * (BigInt(10) ** TOKEN_DECIMALS);

    // Encode the calls
    const callTo = [tokenAddress, shopSmartMoney];
    const callData = [
        // allow the SmartMoney contract (="to") of the store to transfer the tokens for the payment
        erc20.interface.encodeFunctionData('approve', [shopSmartMoney, amount]),
        // pay with ERC20. The SmartMoney contract will take erc20 tokens from the user
        smartMoney.interface.encodeFunctionData('payErc20', [orderID, tokenAddress, amount]),
    ];

    // Send the User Operation to the ERC-4337 mempool
    const client = await Client.init(rpcUrl);
    const res = await client.sendUserOperation(
        builder.executeBatch(callTo, callData),
        {
            onBuild: (op) => console.log('Signed UserOperation:', op),
        }
    );

    // Return receipt
    console.log(`UserOpHash: ${res.userOpHash}`);
    console.log('Waiting for transaction...');
    const ev = await res.wait();
    console.log(`Transaction hash: ${ev?.transactionHash ?? null}`);
    console.log(`View here: https://jiffyscan.xyz/userOpHash/${res.userOpHash}`);
}

async function forwardZKP(proof: any) {
// Initialize the account
    const signingKey = getAccountPrivateKey("01"); // TODO more than test-id 01 for the POC if needed
    const signer = new ethers.Wallet(signingKey);
    const builder = await Presets.Builder.SimpleAccount.init(signer, rpcUrl, opts);
    const address = builder.getSender();

    console.log(`Account address: ${address}`);

    console.log("PROOF: ")
    console.log(proof);
    const parseBigIntArray = (arr: string[]): bigint[] => arr.map(BigInt);

    const orderID = proof.id;
    const inputs = parseBigIntArray(proof.pub_signals);
    const a = parseBigIntArray(proof.proof.pi_a.slice(0, 2));
    const b_int = proof.proof.pi_b.map((innerArr: string[]) => parseBigIntArray(innerArr.slice(0, 2)));
    const b: bigint[][] = [[b_int[0][1], b_int[0][0]], [b_int[1][1], b_int[1][0]]]; // Thanks for this PolygonID :)
    const c = parseBigIntArray(proof.proof.pi_c.slice(0, 2));

    // Read the ERC-20 token contract
    const VerifierABI = require('./ABIs/AgeVerifierAbi.json');
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const verifier = new ethers.Contract(verifierSCAddress, VerifierABI, provider);

    const callTo = [verifierSCAddress];

    const callData = [
        verifier.interface.encodeFunctionData('submitZKPResponse', [orderID, inputs, a, b, c]),
    ];

    // Send the User Operation to the ERC-4337 mempool
    const client = await Client.init(rpcUrl);
    const res = await client.sendUserOperation(
        builder.executeBatch(callTo, callData),
        {
            onBuild: (op) => console.log('Signed UserOperation:', op),
        }
    );

    // Return receipt
    console.log(`UserOpHash: ${res.userOpHash}`);
    console.log('Waiting for transaction...');
    const ev = await res.wait();
    console.log(`Transaction hash: ${ev?.transactionHash ?? null}`);
    console.log(`View here: https://jiffyscan.xyz/userOpHash/${res.userOpHash}`);
}

function getAccountPrivateKey(id: string) {
    return "0x" + (id + "43374337433eb8b9db305859812b374337eb8b9db777777759812b433743374337efefabba45343374337").substring(0, 64);
}

async function initOrder(orderID: number, price: number, ageRequired: boolean) {
    const signingKey = getAccountPrivateKey("01"); // TODO more than test-id 01 for the POC if needed
    const signer = new ethers.Wallet(signingKey);
    const builder = await Presets.Builder.SimpleAccount.init(signer, rpcUrl, opts);
    const address = builder.getSender();

    console.log(`Account address: ${address}`);

    // Read the ERC-20 token contract
    const SmartMoneyABI = require('./ABIs/SmartMoneyAbi.json');
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const smartMoney = new ethers.Contract(smartMoneyAddress, SmartMoneyABI, provider);

    const amount = BigInt(price) * (BigInt(10) ** TOKEN_DECIMALS);

    const callTo = [smartMoneyAddress];

    const callData = [
        smartMoney.interface.encodeFunctionData('initializeOrder', [orderID, amount, ageRequired])
    ];

    // Send the User Operation to the ERC-4337 mempool
    const client = await Client.init(rpcUrl);
    const res = await client.sendUserOperation(
        builder.executeBatch(callTo, callData),
        {
            onBuild: (op) => console.log('Signed UserOperation:', op),
        }
    );

    // Return receipt
    console.log(`UserOpHash: ${res.userOpHash}`);
    console.log('Waiting for transaction...');
    const ev = await res.wait();
    console.log(`Transaction hash: ${ev?.transactionHash ?? null}`);
    console.log(`View here: https://jiffyscan.xyz/userOpHash/${res.userOpHash}`);


}

// === server def
const app = express();
const PORT = process.env.PORT || 3003;

app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true,
    }),
);

app.get('/api/initOrder', (req, res) => {
    console.log("InitZKP")
    let orderID = req.query.orderID ? parseInt(req.query.orderID.toString()) : NaN;
    let price = req.query.price ? parseInt(req.query.price.toString()) : NaN;
    let ageRequired = req.query.ageReq ? parseInt(req.query.ageReq.toString()) : NaN;

    // Check parameters
    if (Number.isNaN(orderID) || orderID <= 0) {
        return res.status(400).send('The given `orderID` is invalid.');
    }

    if (Number.isNaN(price) || price <= 0) {
        return res.status(400).send('The given `price` is invalid.');
    }

    if (Number.isNaN(price) || !(ageRequired == 0 || ageRequired == 1)) {
        return res.status(400).send('Invalid age requirement.');
    }

    orders.set(orderID, false);

    // TODO - complete the initialization properly | report order initialization "owner" issue (anyone can do it atm)
    initOrder(orderID, price, ageRequired == 1).catch((err) => console.error('Error:', err));
    res.json({message: 'Init ZKP request sent!'});
});

app.post('/api/forwardZKP', (req, res) => {
    console.log("ForwardZKP")
    forwardZKP(req.body).catch((err) => console.error('Error:', err));

    //TODO if error => notify smartmoney that verification failed (match error... => 'deny' verif)

    res.json({message: 'Proof sent to Verifier Contract!'});
});

app.post('/api/sendRC20', (req, res) => {
    console.log("SendRC20")
    let shop = req.query.storeAddress;
    let orderID = req.query.orderID ? parseInt(req.query.orderID.toString()) : NaN;
    let amount = req.query.amount ? parseInt(req.query.amount.toString()) : NaN;
    let token = req.query.token;

    // Check parameters
    if (Number.isNaN(orderID) || orderID <= 0) {
        return res.status(400).send('The given `orderID` is invalid.');
    }
    if (Number.isNaN(amount) || amount <= 0) {
        return res.status(400).send('The given `price` is invalid.');
    }
    if (token == undefined || !(token! === "dai" || token! === "usdt")) {
        return res.status(400).send('The given `token` is invalid.');
    }
    if (shop == undefined || shop.toString().length != 42) {
        return res.status(400).send('The given `shop` is invalid.');
    }

    payERC20(orderID, amount, token, shop.toString()).catch((err) => console.error('Error:', err));

    res.json({message: 'Sending token test (with account 01)!'});
});

app.post('/api/getaddress', async (req, res) => {
    console.log("Get Smart Account Address");
    const id_token = req.body.id_token;
    const post_email = req.body.email;
    console.log(req.body);
    console.log(post_email);
    if (!id_token || !post_email) {
        res.status(400).send('Missing required fields to access address');
        return;
    }

    try {

        // get token id payload
        let payload = await verifyIDToken(id_token);
        if (!payload) {
            res.status(401).send({message: 'Token verification failed.'});
            return;
        }
        // verify email validity and sub for user_id

        const {sub, email} = payload;
        if (email != post_email) {
            res.status(401).send({message: 'Email verification failed'});
            return;
        }

        console.log(sub);
        // smart account address for the user
        let sa_address = "";

        const credential = await getCredential(sub)

        if (!credential) {
            console.log("That's a new account!");
            const sk = computePrivateKeyFrom(post_email, sub);
            const signer = new ethers.Wallet(signingKey);
            const builder = await Presets.Builder.SimpleAccount.init(signer, rpcUrl, opts);
            sa_address = builder.getSender();

            await insertCredential(sub, sk, sa_address, post_email);
            // INIT ACCOUNT
        } else {
            console.log("No new credentials");
            sa_address = credential.address;
        }
        // Simulate successful operation with a dummy address
        res.json({success: true, address: sa_address});
    } catch (error) {
        console.log(error);
        res.status(500).send('An error occurred while fetching the address');
    }
})

app.get('/api/getOrderStatus', async (req, res) => {
    console.log("Get Order Status");
    let orderID = req.query.orderID ? parseInt(req.query.orderID.toString()) : NaN;

    // Check parameters
    if (Number.isNaN(orderID) || orderID <= 0) {
        return res.status(400).send('The given `orderID` is invalid.');
    }

    const status = orders.get(orderID);
    if (status != undefined) {
        res.json({complete: status});

    } else {
        res.status(400).send('No entry found for orderID: ' + orderID);
    }
})

app.get('/api/readOrderStatus', async (req, res) => {
    console.log("Read Order Status");
    let orderID = req.query.orderID ? parseInt(req.query.orderID.toString()) : NaN;

    // Check parameters
    if (Number.isNaN(orderID) || orderID <= 0) {
        return res.status(400).send('The given `orderID` is invalid.');
    }

    orders.delete(orderID);
    res.json({message: "ok"});
})

// Test address
const signingKey = getAccountPrivateKey("01"); // TODO more than test-id 01 for the POC if needed
const signer = new ethers.Wallet(signingKey);
const builder = Presets.Builder.SimpleAccount.init(signer, rpcUrl, opts);
const address = builder.then(a => console.log("ADDRESS" + a.getSender()));

console.log(`Account address: ${address}`);

smartMoney.on("CompletePurchase", (requestID, success) => {
    console.log("\nPurchase completed: requestId", requestID, " - success=", success, "\n");
    orders.set(requestID.toNumber(), success);
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
