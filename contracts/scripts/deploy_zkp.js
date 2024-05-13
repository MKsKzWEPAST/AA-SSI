const { Web3 } = require("web3");
const { poseidon } = require("@iden3/js-crypto");
const { SchemaHash } = require("@iden3/js-iden3-core");
const { prepareCircuitArrayValues } = require("@0xpolygonid/js-sdk");
const { ethers} = require('ethers');
require('dotenv').config()

// getting env variables
const deploy_private_key = "0x" + process.env.DEPLOY_PRIVATE_KEY;
const amoy_rpc = process.env.AMOY_RPC;
const age_verifier_address = process.env.AGE_VERIFIER_ADDRESS;

const VerifierABI = require('./AgeVerifier.json');

// serialization helper function
function packV2ValidatorParams(query, allowedIssuers= []) {
    const web3 = new Web3(Web3.givenProvider || 'ws://localhost:8545');
    return web3.eth.abi.encodeParameter(
        {
            CredentialAtomicQuery: {
                schema: 'uint256',
                claimPathKey: 'uint256',
                operator: 'uint256',
                slotIndex: 'uint256',
                value: 'uint256[]',
                queryHash: 'uint256',
                allowedIssuers: 'uint256[]',
                circuitIds: 'string[]',
                skipClaimRevocationCheck: 'bool',
                claimPathNotExists: 'uint256'
            }
        },
        {
            schema: query.schema,
            claimPathKey: query.claimPathKey,
            operator: query.operator,
            slotIndex: query.slotIndex,
            value: query.value,
            queryHash: query.queryHash,
            allowedIssuers: allowedIssuers,
            circuitIds: query.circuitIds,
            skipClaimRevocationCheck: query.skipClaimRevocationCheck,
            claimPathNotExists: 0
        }
    );
}

// conversion helper function to get a date in the right format
function getYYYYMMDD18() {
    const date = new Date();
    const year = date.getFullYear() - 18;
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return parseInt(`${year}${month}${day}`);
}

// ZKP op
const Operators = {
    NOOP: 0, // No operation, skip query verification in circuit
    EQ: 1, // equal
    LT: 2, // less than
    GT: 3, // greater than
    IN: 4, // in
    NIN: 5, // not in
    NE: 6 // not equal
};


// poseidon hash function
function calculateQueryHashV2(
    values,
    schema,
    slotIndex,
    operator,
    claimPathKey,
    claimPathNotExists
) {
    const expValue = prepareCircuitArrayValues(values, 64);
    const valueHash = poseidon.spongeHashX(expValue, 6);
    const schemaHash = coreSchemaFromStr(schema);
    return poseidon.hash([
        schemaHash.bigInt(),
        BigInt(slotIndex),
        BigInt(operator),
        BigInt(claimPathKey),
        BigInt(claimPathNotExists),
        valueHash
    ]);
}

const coreSchemaFromStr = (schemaIntString) => {
    const schemaInt = BigInt(schemaIntString);
    return SchemaHash.newSchemaHashFromInt(schemaInt);
};

async function setZKPRequest() {
    // you can run https://go.dev/play/p/3id7HAhf-Wi to get schema hash and claimPathKey using YOUR schema
    const schema = '74977327600848231385663280181476307657';
    // merklized path to field in the W3C credential according to JSONLD  schema e.g. birthday in the KYCAgeCredential under the url "https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld"
    const schemaUrl =
        'https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld';
    const type = 'KYCAgeCredential';
    const schemaClaimPathKey =
        '20376033832371109177683048456014525905119173674985843915445634726167450989630';
    const value = [getYYYYMMDD18(), ...new Array(63).fill(0)];
    const slotIndex = 0; // because schema  is merklized for merklized credential, otherwise you should actually put slot index  https://docs.iden3.io/protocol/non-merklized/#motivation

    // set default query
    const circuitIdSig = 'credentialAtomicQuerySigV2OnChain';

    // loading the age verifier contract
    const provider = new ethers.providers.JsonRpcProvider(amoy_rpc);
    const signer = new ethers.Wallet(deploy_private_key,provider)
    const ageVerifier = new ethers.Contract(age_verifier_address, VerifierABI, signer);

    // current sig validator address on polygon amoy
    const validatorAddressSig = '0x8c99F13dc5083b1E4c16f269735EaD4cFbc4970d';
    const network = 'polygon-amoy';
    const chainId = 80002;

    // ZKP query
    const query = {
        schema: schema,
        claimPathKey: schemaClaimPathKey,
        operator: Operators.LT,
        slotIndex: slotIndex,
        value: value,
        queryHash: calculateQueryHashV2(
            value,
            schema,
            slotIndex,
            Operators.LT,
            schemaClaimPathKey,
            0,
        ).toString(),
        circuitIds: [circuitIdSig],
        allowedIssuers: [],
        skipClaimRevocationCheck: false,
        claimPathNotExist: 0,
    };

    const requestIdSig = 1;

    // metadate for proof query
    const invokeRequestMetadata = {
        id: '7f38a193-0918-4a48-9fac-36adfdb8b542',
        typ: 'application/iden3comm-plain-json',
        type: 'https://iden3-communication.io/proofs/1.0/contract-invoke-request',
        thid: '7f38a193-0918-4a48-9fac-36adfdb8b542',
        body: {
            reason: 'verify your age',
            transaction_data: {
                contract_address: age_verifier_address,
                method_id: 'b68967e2',
                chain_id: chainId,
                network: network
            },
            scope: [
                {
                    id: requestIdSig,
                    circuitId: circuitIdSig,
                    query: {
                        allowedIssuers: ['*'],
                        context: schemaUrl,
                        credentialSubject: {
                            birthday: {
                                $lt: value[0]
                            }
                        },
                        type: type
                    }
                }
            ]
        }
    };

    try {
        // sig request set
        const txSig = await ageVerifier.setZKPRequest(requestIdSig, {
            metadata: JSON.stringify(invokeRequestMetadata, (_, v) =>
                typeof v === 'bigint' ? v.toString() : v
            ),
            validator: validatorAddressSig,
            data: packV2ValidatorParams(query)
        },  {
            gasLimit:  3000000,
        });
        await txSig.wait();
        console.log(txSig.hash);
    } catch (e) {
        console.log('error: ', e);
    }
}

setZKPRequest()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

module.exports = setZKPRequest();