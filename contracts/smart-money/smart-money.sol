// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract SmartMoney is Ownable(msg.sender) {

    //define event when finishing purchase workflow
    event CompletePurchase(uint256 requestId, bool success);

    // Define the mapping from orderID to order details
    mapping(uint256 => Order) public orders;
    address public shopAddress = 0x40775600Bb4E2E4Ab1c24B5c8bA4734cC47EE02E;

    function setShopAddress(address _shopAddress) external onlyOwner {
        shopAddress = _shopAddress;
    }

    struct Order {
        bool verified;
        uint256 price;
        bool paid;
    }

    // Initialize orders/payments with orderID and price to be received
    function initializeOrder(uint256 orderID, uint256 price, bool ageRequired)
    external
    {
        require(orders[orderID].price == 0, "Order already exists");
        orders[orderID].price = price;
        orders[orderID].verified = !ageRequired;
    }

    // Receive payment for an order
    function pay(uint256 orderID) external payable {
        require(orders[orderID].price == msg.value && msg.value != 0, "Order does not exist or price doesn't match");
        require(!orders[orderID].paid, "Order already paid");
        orders[orderID].paid = true;
        conditionalOutput(orderID, false);
    }

    // Notification function for the verification status of the order
    function notify(uint256 orderID, bool verified) external onlyOwner {
        require(orders[orderID].price > 0, "Order does not exist");
        require(orders[orderID].verified == false, "Order already validated");
        orders[orderID].verified = verified;
        conditionalOutput(orderID, true);
    }

    function conditionalOutput(uint256 orderID, bool fromVerify)
    internal
    {
        if (fromVerify && !orders[orderID].verified) {
            // Cancel the order
            delete orders[orderID];
            emit CompletePurchase(orderID,false);
        }
        if (orders[orderID].paid && orders[orderID].verified) {
            uint256 price = orders[orderID].price;
            delete orders[orderID];
            emit CompletePurchase(orderID,true);
            // Cash-out to the shop's account
            payable(shopAddress).transfer(price);

        }
    }
}
