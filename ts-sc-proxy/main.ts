import express = require('express');
import bodyParser = require('body-parser');

import {ethers} from 'ethers';
import {Presets, Client} from 'userop';

const rpcUrl = 'https://api.stackup.sh/v1/node/04832ebeb6088d4ca33e86e7bc9054fdc03115d2d1e295df3122acf11817fb95';
const paymasterUrl = 'https://api.stackup.sh/v1/paymaster/04832ebeb6088d4ca33e86e7bc9054fdc03115d2d1e295df3122acf11817fb95';
const paymasterMiddleware = Presets.Middleware.verifyingPaymaster(paymasterUrl, {type: 'payg'});
const opts = {paymasterMiddleware: paymasterMiddleware};

const verifierSCAddress = "0x3080D4B01cd22c2aF2Cae559e43047baB674CaD7";
const smartMoneyAddress = "0x46B5B8D72c7475E30E949F32b373B6A388E077D6";


async function sendSponsored(amount_token: number, token_address: string, destination_address?: string) {
    // Initialize the account
    const signingKey = getAccountPrivateKey("01"); // TODO more than test-id 01 for the POC if needed
    const signer = new ethers.Wallet(signingKey);
    const builder = await Presets.Builder.SimpleAccount.init(signer, rpcUrl, opts);
    const address = builder.getSender();

    console.log(`Account address: ${address}`);

    // Create the call data
    let to = address; // Receiving address (us if not specified)
    if (destination_address !== 'undefined') {
        to = destination_address!;
    }
    const token = token_address;
    const value = amount_token.toString(); // Amount of the ERC-20 token to transfer

    // Read the ERC-20 token contract
    const ERC20_ABI = require('./erc20Abi.json'); // ERC-20 ABI in json format
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const erc20 = new ethers.Contract(token, ERC20_ABI, provider);
    const decimals = await Promise.all([erc20.decimals()]);
    const amount = ethers.utils.parseUnits(value, decimals);

    // Encode the calls
    const callTo = [token, token];
    const callData = [
        erc20.interface.encodeFunctionData('approve', [to, amount]),
        erc20.interface.encodeFunctionData('transfer', [to, amount]),
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
    const VerifierABI = require('./AgeVerifierAbi.json');
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
    const SmartMoneyABI = require('./SmartMoneyAbi.json');
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const smartMoney = new ethers.Contract(smartMoneyAddress, SmartMoneyABI, provider);

    const callTo = [smartMoneyAddress];

    const callData = [
        smartMoney.interface.encodeFunctionData('initializeOrder', [orderID, price, ageRequired])
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

    // TODO - complete the initialization properly | report order initialization "owner" issue (anyone can do it atm)
    initOrder(orderID, price, ageRequired==1).catch((err) => console.error('Error:', err));
    res.json({message: 'Init ZKP request sent!'});
});

app.post('/api/forwardZKP', (req, res) => {
    console.log("ForwardZKP")
    forwardZKP(req.body).catch((err) => console.error('Error:', err));
    //TODO if error => notify smartmoney that verification failed (match error... => 'deny' verif)
    res.json({message: 'Proof sent to Verifier Contract!'});
});

app.post('/api/sendRC20/:orderID', (req, res) => {
    // TODO
    console.log("SendRC20")

    // test
    sendSponsored(0, '0x3870419Ba2BBf0127060bCB37f69A1b1C090992B').catch((err) => console.error('Error:', err));

    res.json({message: 'Sending token test (with account 01)!'});
});


// Test address
const signingKey = getAccountPrivateKey("01"); // TODO more than test-id 01 for the POC if needed
const signer = new ethers.Wallet(signingKey);
const builder = Presets.Builder.SimpleAccount.init(signer, rpcUrl, opts);
const address = builder.then(a => console.log("ADDRESS" + a.getSender()));

console.log(`Account address: ${address}`);

const SmartMoneyAddress = "0x7E8e020459C31982787D7A6Da37FaD1256771bE7";
const SmartMoneyABI = require('./SmartMoneyAbi.json');
const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
const smartMoney = new ethers.Contract(SmartMoneyAddress, SmartMoneyABI, provider);

smartMoney.on("CompletePurchase", (requestId, success) => {
    console.log("Purchase completed: requestId", requestId, " - success=", success);
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// https://broadly-assured-piglet.ngrok-free.app/api/forwardZKP