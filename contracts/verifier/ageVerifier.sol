pragma solidity 0.8.20;


import {PrimitiveTypeUtils} from "@iden3/contracts/lib/PrimitiveTypeUtils.sol";
import {ICircuitValidator} from "@iden3/contracts/interfaces/ICircuitValidator.sol";
import {ZKPVerifier} from "@iden3/contracts/verifiers/ZKPVerifier.sol";
import "../smart-money/smart-money.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract AgeVerifier is ZKPVerifier {

    SmartMoney public smc = SmartMoney(0xaa8904B83864fcfc7dcbF9913fB03566B68a1454); 

    mapping(uint256 => address) public idToAddress;

    mapping(address => uint256) public addressToId;

    mapping(uint64 => bool) public pendingRequests;

    function _beforeProofSubmit(
        uint64  requestId,
        uint256[] memory inputs,
        ICircuitValidator validator
    ) internal override {
        // check that  challenge input is address of sender
        uint256 chal = validator.inputIndexOf("challenge");
        // this is linking between msg.sender and address
        require(
            // for the purpose of the PoC, challenge is a constant string
            chal == 12345678,
            "address in proof is not a sender address"
        );

        pendingRequests[requestId] = true;

    }

    function _afterProofSubmit(
        uint64 requestId,
        uint256[] memory inputs,
        ICircuitValidator validator
    ) internal override {
        require( 
            addressToId[_msgSender()] == 0 && pendingRequests[requestId],
            "proof can not be submitted more than once"
        );

        // get user id
        uint256 id = inputs[1];
        // additional check didn't get airdrop tokens before
        if (idToAddress[id] == address(0) && addressToId[_msgSender()] == 0) {
            addressToId[_msgSender()] = id;
            idToAddress[id] = _msgSender();

            // smartMoney logic
            string memory req = Strings.toString(requestId);
            smc.notify(req, true);
            pendingRequests[requestId] = false;
        }
    }
}