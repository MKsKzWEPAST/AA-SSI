import {setZKPRequest} from "./deploy_zkp";

setZKPRequest().then(r => process.exit(0))
    .catch(e => {
        console.error(e);
        process.exit(1);
    });