pragma solidity 0.8.20;


import {PrimitiveTypeUtils} from "@iden3/contracts/lib/PrimitiveTypeUtils.sol";
import {ICircuitValidator} from "@iden3/contracts/interfaces/ICircuitValidator.sol";
import {ZKPVerifier} from "@iden3/contracts/verifiers/ZKPVerifier.sol";
import "../smart-money/smart-money.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract AgeVerifier is ZKPVerifier {

    SmartMoney public smc = SmartMoney(0x7bE17fF7A33F1F2d40dc154B9654098BDD38BA16); 

    mapping(uint64 => bool) public pendingRequests;

    function _beforeProofSubmit(
        uint64  requestId,
        uint256[] memory inputs,
        ICircuitValidator validator
    ) internal override {
        // this is linking between msg.sender and address
        pendingRequests[requestId] = true;

    }

    function _afterProofSubmit(
        uint64 requestId,
        uint256[] memory inputs,
        ICircuitValidator validator
    ) internal override {
        require( 
             pendingRequests[requestId],"no pending request found for the given id");

        // smartMoney logic
        string memory req = Strings.toString(requestId);
        smc.notify(req, true);
        pendingRequests[requestId] = false;
        
    }
}