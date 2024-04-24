// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract SmartMoney is Ownable(msg.sender) {
    // Define the mapping from orderID to order details
    mapping(uint256 => Order) public orders;
    address public shopAddress = 0x40775600Bb4E2E4Ab1c24B5c8bA4734cC47EE02E;

    struct Order {
        bool verified;
        uint256 received;
        uint256 price;
        bool paid;
        address payable sender; // wallet from which the last payment originated - TODO see if needed to send back the money
    }

    // Initialize orders/payments with orderID and price to be received
    function initializeOrder(uint256 orderID, uint256 price) // TODO check if only from the shop smart account
        external
    {
        require(orders[orderID].price == 0, "Order already exists");
        orders[orderID].price = price;
    }

    // Receive payment for an order
    function pay(uint256 orderID) external payable {
        require(orders[orderID].price > 0, "Order does not exist");

        // Update the received amount
        orders[orderID].received += msg.value;
        orders[orderID].sender = payable(msg.sender);

        // Check if received amount exceeds price, and update verified status accordingly
        if (orders[orderID].received >= orders[orderID].price) {
            orders[orderID].paid = true;
            conditionalOutput(orderID, false);
        }
    }

    // Notification function for the verification status of the order
    function notify(uint256 orderID, bool verified) external onlyOwner {
        require(orders[orderID].price > 0, "Order does not exist");
        orders[orderID].verified = verified;
        conditionalOutput(orderID, true);
    }

    function conditionalOutput(uint256 orderID, bool fromVerify)
        internal
    {
        if (fromVerify && !orders[orderID].verified) {
            // Send back received money so-far to the sender
            orders[orderID].sender.transfer(orders[orderID].received);
            delete orders[orderID];
        }
        if (orders[orderID].paid && orders[orderID].verified) {
            // Cash-out to the shop's account
            payable(shopAddress).transfer(orders[orderID].received);
            delete orders[orderID];
        }
    }
}
