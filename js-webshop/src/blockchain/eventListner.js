import {ethers} from "ethers";
import SmartMoneyABI from "./SmartMoneyAbi.json";

const rpcUrl = "https://api.stackup.sh/v1/node/04832ebeb6088d4ca33e86e7bc9054fdc03115d2d1e295df3122acf11817fb95";
const smartMoneyAddress = "0x1973dD4486c8BA89C7ab3988Cc54e60F6E54Ef66";


// initializing smart money contracts


export function startListenForID(requestID, onComplete) {
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const smartMoney = new ethers.Contract(smartMoneyAddress, SmartMoneyABI, provider);

    // FIXME: 429 (Too Many Requests)
    smartMoney.on("CompletePurchase", (eventRequestID, success) => {
        if(eventRequestID === requestID) {
            console.log("\nPurchase completed: requestId", eventRequestID, " - success=", success, "\n");
            onComplete(success);
            smartMoney.off("CompletePurchase", (id, s) => {})
        }
    })
}