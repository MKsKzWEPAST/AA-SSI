import express = require('express');
import bodyParser = require('body-parser');

import { ethers } from 'ethers';
import { Presets, Client } from 'userop';

const rpcUrl = 'https://api.stackup.sh/v1/node/04832ebeb6088d4ca33e86e7bc9054fdc03115d2d1e295df3122acf11817fb95';
const paymasterUrl = 'https://api.stackup.sh/v1/paymaster/04832ebeb6088d4ca33e86e7bc9054fdc03115d2d1e295df3122acf11817fb95';
const paymasterMiddleware = Presets.Middleware.verifyingPaymaster(paymasterUrl, { type: 'payg' });
const opts = {paymasterMiddleware: paymasterMiddleware};

async function sendSponsored(amount_token : number , token_address : string, destination_address?:string) {
    // Initialize the account
    const signingKey = getAccountPrivateKey("01"); // TODO more than test-id 01 for the POC if needed
    const signer = new ethers.Wallet(signingKey);
    const builder = await Presets.Builder.SimpleAccount.init(signer, rpcUrl, opts);
    const address = builder.getSender();

    console.log(`Account address: ${address}`);

    // Create the call data
    let to = address; // Receiving address (us if not specified)
    if (destination_address !== 'undefined'){
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

async function forwardZKP(proof: any, orderID: string) {
// Initialize the account
    const signingKey = getAccountPrivateKey("01"); // TODO more than test-id 01 for the POC if needed
    const signer = new ethers.Wallet(signingKey);
    const builder = await Presets.Builder.SimpleAccount.init(signer, rpcUrl, opts);
    const address = builder.getSender();

    console.log(`Account address: ${address}`);

    // Create the call data
    let verifierSCAddress = "0x<TODO ADDRESS OF THE OnChainVerifier>"; // Receiving address (us if not specified)

    // Read the ERC-20 token contract
    const VerifierABI = require('./<TODO VerifierABI>.json'); // TODO: take ABI of OnChainVerifier contract
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const verifier = new ethers.Contract(verifierSCAddress, VerifierABI, provider);

    const callTo = [verifierSCAddress];

    // TODO put "proof" into these fields
    const requestId = 0;
    const inputs = [0];
    const a = [0,0];
    const b = [[0,0],[0,0]];
    const c = [0,0];


    const callData = [
        verifier.interface.encodeFunctionData('submitZKPResponse', [requestId, inputs, a, b, c]),
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

function getAccountPrivateKey(id : string) {
    return "0x" + (id + "43374337433eb8b9db305859812b374337eb8b9db777777759812b433743374337efefabba45343374337").substring(0, 64);
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


app.post('/api/initZKP/:orderID', (req, res) => {
    console.log("InitZKP")
    // TODO
    res.json({ message: 'TODO!' });
});

app.post('/api/forwardZKP/:orderID', (req, res) => {
    console.log("ForwardZKP")
    console.log("Body");
    console.log(req.body);
    const orderID = req.params.orderID; // TODO probably going to remove the orderID from here (only in the proof response)
    forwardZKP(req.body, orderID).catch((err) => console.error('Error:', err));
    res.json({ message: 'Proof sent to Verifier Contract!' });
});

app.post('/api/sendRC20/:orderID', (req, res) => {
    // TODO
    console.log("SendRC20")

    // test
    sendSponsored(0, '0x3870419Ba2BBf0127060bCB37f69A1b1C090992B').catch((err) => console.error('Error:', err));

    res.json({ message: 'Sending token test (with account 01)!' });
});


// Test address
const signingKey = getAccountPrivateKey("01"); // TODO more than test-id 01 for the POC if needed
const signer = new ethers.Wallet(signingKey);
const builder = Presets.Builder.SimpleAccount.init(signer, rpcUrl, opts);
const address = builder.then(a => console.log("ADDRESS" + a.getSender()));

console.log(`Account address: ${address}`);



app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// https://broadly-assured-piglet.ngrok-free.app/api/forwardZKP