import express = require('express');
import bodyParser = require('body-parser');
import SmartMoneyABI = require('./ABIs/SmartMoneyAbi.json');
import {initializeDatabase, insertCredential} from './db'
import {ethers} from 'ethers';
import {Client, Presets} from 'userop';
import {authenticate} from "./auth";
import {computePrivateKeyFrom} from "./cryptoUtils"
import {rpcUrl,smartMoneyAddress,opts,TOKEN_ABIS,TOKEN_ADDRESSES,TOKEN_DECIMALS,verifierSCAddress} from "./consts";
import admin = require('firebase-admin');
import {maintainZKPRequest} from "./cron";

// initializing smart money contracts
const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
const smartMoney = new ethers.Contract(smartMoneyAddress, SmartMoneyABI, provider);

// orders from the website
const orders: Map<number, number> = new Map();

export const fbApp = admin.initializeApp({
    credential: admin.credential.cert("./sk-fb.json")
});

// user credentials database initialization
initializeDatabase().then(() => console.log("db initialized"));


async function payERC20(orderID: number, amountToken: number, token: string, shopSmartMoney: string, credential: { sub?: any; privateKey: any; address?: string; email?: string; }) {
    // Initialize the account
    const signingKey = credential.privateKey;
    const signer = new ethers.Wallet(signingKey);
    const builder = await Presets.Builder.SimpleAccount.init(signer, rpcUrl, opts);
    const address = builder.getSender();

    console.log(`Account address: ${address}`);
    console.log(`OrderID: >${orderID}<`);

    // Create the call data
    let tokenAddress = TOKEN_ADDRESSES.get(token)!;

    // Read the ERC-20 token contract
    const abi_path = TOKEN_ABIS.get(token);
    if (abi_path == undefined) {
        console.log(`Invalid token name: ${token}`);
        return false;
    }
    const ERC20_ABI = require(abi_path); // ERC-20 ABI in json format
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl,);
    const erc20 = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const amount = BigInt(amountToken) * (BigInt(10) ** TOKEN_DECIMALS);
    console.log(`Amount: >${amount}<`);

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
    return ev?.decodeError == undefined;
}

async function forwardZKP(proof: any,credential: { sub?: any; privateKey: any; address?: string; email?: string; }) {
// Initialize the account
    const signingKey = credential.privateKey
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

function getCallerAccountPrivateKey(id: string) {
    return "0x" + (id + "43374337433eb8b9db305859812b374337eb8b9db777777759812b433743374337efefabba45343374337").substring(0, 64);
}

async function initOrder(orderID: number, price: number, ageRequired: boolean) {
    const signingKey = getCallerAccountPrivateKey("01");
    const signer = new ethers.Wallet(signingKey);
    const builder = await Presets.Builder.SimpleAccount.init(signer, rpcUrl, opts);
    const address = builder.getSender();

    console.log(`Account address: ${address}`);
    console.log(`OrderID: >${orderID}<`);

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

    return ev?.decodeError == undefined;
}

// === server def
const app = express();
const PORT = process.env.PORT || 3003;

// enables the use of ngrok without disabling protections
const cors = require('cors');
app.use(cors());

app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true,
    }),
);

app.post('/api/initOrder', async (req, res) => {
    console.log("\n====InitOrder====")

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

    orders.set(orderID, 0);

    const actionResult = await initOrder(orderID, price, ageRequired == 1).catch((err) => console.error('Error:', err));
    if (actionResult) {
        res.json({message: 'Init ZKP request sent!!'});
    } else {
        return res.status(400).send("Couldn't init the order.")
    }
});

app.post('/api/forwardZKP', async (req, res) => {
    console.log("\n====ForwardZKP====")
    const proof = req.body.proof;
    const id_token = req.body.id_token;
    const post_email = req.body.email;
    const credentialObj = await authenticate(id_token, post_email);
    if (credentialObj.code != 200) {
        return res.status(credentialObj.code).send(credentialObj.message);
    }
    const credential = credentialObj.credential;
    if (!credential) {
        return res.status(401).send("Account has not yet been initialized for this user");
    }

    forwardZKP(proof,credential).catch((err) => console.error('Error:', err));

    res.json({message: 'Proof sent to Verifier Contract!'});
});

app.post('/api/sendERC20', async (req, res) => {
    console.log("\n====SendERC20====")

    const id_token = req.body.id_token;
    const post_email = req.body.email;
    const credentialObj = await authenticate(id_token, post_email);
    if (credentialObj.code != 200) {
        return res.status(credentialObj.code).send(credentialObj.message);
    }
    const credential = credentialObj.credential;
    if (!credential) {
        return res.status(401).send("Account has not yet been initialized for this user");
    }

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
    if (token == undefined || TOKEN_ADDRESSES.get(token.toString()) == undefined) {
        return res.status(400).send('The given `token` is invalid.');
    }
    if (shop == undefined || shop.toString().length != 42) {
        return res.status(400).send('The given `shop` is invalid.');
    }

    const actionResult = await payERC20(orderID, amount, token.toString(), shop.toString(), credential).catch((err) => console.error('Error:', err));
    if (actionResult) {
        res.json({message: 'Tokens sent!'});
    } else {
        return res.status(400).send("Couldn't send your tokens.")
    }
});


app.post('/api/getbalance/:smcAddress', async (req, res) => {
    const addr = req.params.smcAddress;
    console.log(addr);
    const coin = req.body.coin;
    let erc20_sc = TOKEN_ADDRESSES.get(coin);
    if (!erc20_sc) erc20_sc = "";
    let erc20AbiPath = TOKEN_ABIS.get(coin);
    if (!erc20AbiPath) erc20AbiPath = "";

    const erc20Abi = require(erc20AbiPath);
    const contract = new ethers.Contract(erc20_sc, erc20Abi, provider);

    console.log(coin);
    console.log(erc20_sc);
    try {
        // Call balanceOf function from the contract
        const balance = await contract.balanceOf(addr);
        console.log(Number(balance));
        // Convert the balance from BigNumber to string for easier reading
        const balanceFormatted = ethers.utils.formatEther(balance);
        console.log(balanceFormatted);
        res.status(200).send({ address, balance: balanceFormatted});
    } catch (error) {
        console.log(error);
        res.status(500).send({ error: 'Failed to retrieve token balance', details: error });
    }

});

app.post('/api/getaddress', async (req, res) => {
    console.log("Get Smart Account Address");
    const id_token = req.body.id_token;
    const post_email = req.body.email;
    const credentialObj = await authenticate(id_token,post_email);
    if (credentialObj.code != 200) {
        res.status(credentialObj.code).send(credentialObj.message);
        return;
    }
    const credential = credentialObj.credential;
    const sub = credentialObj.sub;
    // smart account address for the user
    let sa_address = "";
        try {
        if (!credential) {
            console.log("That's a new account!");
            const sk = computePrivateKeyFrom(post_email, sub);
            const signer = new ethers.Wallet(sk);
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
        res.json({event_status: status});

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

// Returns the date of birth required to match the 18+ requirement
app.get('/api/getReqDate', async (req, res) => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 1000 * 60 * 60 * 24);
    const year = tomorrow.getFullYear() - 18;
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    res.json({date: parseInt(`${year}${month}${day}`)});
})

// backend health check
app.get('api/ping', async (req,res) => {
    return res.status(200).send("pong");
})

// Test address
const signingKey = getCallerAccountPrivateKey("01");
const signer = new ethers.Wallet(signingKey);
const builder = Presets.Builder.SimpleAccount.init(signer, rpcUrl, opts);
const address = builder.then(a => console.log("ADDRESS (01): " + a.getSender()));

smartMoney.on("CompletePurchase", (requestID, event_status) => {
    console.log("\nPurchase completed: requestId", requestID, " - status=", event_status, "\n");
    orders.set(requestID.toNumber(), event_status);
})

const cron = maintainZKPRequest();

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Gracefully stops the cron task
cron.then(timeout => clearTimeout(timeout));