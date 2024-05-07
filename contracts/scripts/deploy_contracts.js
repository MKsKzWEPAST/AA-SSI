const {ContractFactory, ethers} = require('ethers');
const {readFileSync} = require("fs");
require('dotenv').config()

const deploy_private_key = "0x" + process.env.DEPLOY_PRIVATE_KEY;
console.log(deploy_private_key);
const amoy_rpc = process.env.AMOY_RPC;

const provider = new ethers.providers.JsonRpcProvider(amoy_rpc);
const signer = new ethers.Wallet(deploy_private_key,provider)
async function main() {
    const abis = ["./abis/age_zkp_verifier.json","./abis/smart_money.json"];
    const byteCodes = ["./bytecodes/age_zkp_verifier.bin","./bytecodes/smart_money.bin"];
    const names = ["ageZKPVerifier","SmartMoney"];
    for (let i = 0; i < abis.length ; i++) {
        const abi = JSON.parse(readFileSync(abis[i]).toString());
        const byteCode = readFileSync(byteCodes[i]).toString();

        const factory = new ContractFactory(abi,byteCode,signer);
        const contract = await factory.deploy();
        console.log(contract.deployTransaction);
        console.log(`${names[i]} : ${contract.address}`);

        await contract.deployTransaction.wait();

    }
}

main();

