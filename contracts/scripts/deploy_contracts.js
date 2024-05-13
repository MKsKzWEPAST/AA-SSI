const {ContractFactory, ethers} = require('ethers');
const fs = require("fs");
require('dotenv').config()

// env variables
const deploy_private_key = "0x" + process.env.DEPLOY_PRIVATE_KEY;
const amoy_rpc = process.env.AMOY_RPC;
// paths
const abis = ["./abis/age_zkp_verifier.json","./abis/smart_money.json"];
const byteCodes = ["./bytecodes/age_zkp_verifier.bin","./bytecodes/smart_money.bin"];

// contract names
const names = ["ageZKPVerifier","SmartMoney"];

// addresses
const shopAddr ="0x40775600Bb4E2E4Ab1c24B5c8bA4734cC47EE02E";
const dai = "0xd7dB0FE7506829004c99d75d1c04c6498CA9A270";
const tusd = "0x345a017dC4A6E3082FEe99DB5FAfA5C02bBA0e57";

// stringified ABIs
const abi_verifier = JSON.parse(fs.readFileSync(abis[0]).toString());
const abi_smart_money = JSON.parse(fs.readFileSync(abis[1]).toString());

// provider (private rpc) and signer (wallet);
const provider = new ethers.providers.JsonRpcProvider(amoy_rpc);
const signer = new ethers.Wallet(deploy_private_key,provider)

async function main() {
    const addresses = ["", ""];
    for (let i = 0; i < abis.length ; i++) {
        const abi = JSON.parse(readFileSync(abis[i]).toString());
        const byteCode = readFileSync(byteCodes[i]).toString();

        const factory = new ContractFactory(abi,byteCode,signer);
        const contract = await factory.deploy();
        addresses[i] = contract.address;
        await contract.deployTransaction.wait();
    }

    const verifier = new ethers.Contract(addresses[0],abi_verifier,signer);
    const smart_money = new ethers.Contract(addresses[1],abi_smart_money,signer);

    // VERIFIER ===== ===== ======
    await verifier.initialize();
    await verifier.setSmartMoneyAddress(addresses[1], {gasLimit:  3000000,});

    // SMART MONEY ===== ===== =====
    await smart_money.setShopAddress(shopAddr, {gasLimit:  300000,});
    await smart_money.setVerifierAddress(addresses[0], {gasLimit:  300000,});
    await smart_money.addValidToken(dai, {gasLimit:  300000,});
    await smart_money.addValidToken(tusd, {gasLimit:  300000,});

    const config = {
        "verifier_address": addresses[0],
        "smart_money_address": addresses[1],
    }

    fs.writeFile('../../js-webshop/config.json', config, 'utf8', (err) => {
        if (err) {
            console.error('Error writing JSON file:', err);
        }
    });

    fs.writeFile('../../ts-sc-proxy/config.json', config, 'utf8', (err) => {
        if (err) {
            console.error('Error writing JSON file:', err);
        }
    });

    }

main();

