// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

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
        IERC20 token;
    }

    // Initialize orders/payments with orderID and price to be received
    function initializeOrder(uint256 orderID, uint256 price, bool ageRequired)
    external
    {
        require(orders[orderID].price == 0, "Order already exists");
        orders[orderID].price = price;
        orders[orderID].verified = !ageRequired;
    }

    function payErc20(uint256 orderID, address _token, uint256 amount) external {
        require(orders[orderID].price == amount && amount>0, "Order does not exist or price doesn't match [ERC20]");
        require(!orders[orderID].paid, "Order already paid [ERC20]");

        IERC20 tokenContract = IERC20(_token);

        uint256 allowance = tokenContract.allowance(msg.sender, address(this));
        uint256 balance = tokenContract.balanceOf(msg.sender);
        require(allowance >= amount && balance >= amount, "Insufficient allowance or balance [ERC20]");

        // Attempt to transfer tokens from the sender to this contract
        bool success = tokenContract.transferFrom(msg.sender, address(this), amount);
        require(success, "Token transfer failed [ERC20]");

        orders[orderID].paid = true;
        orders[orderID].token = tokenContract;
        conditionalOutput(orderID, false);
    }

    // Notification function for the verification status of the order
    function notify(uint256 orderID, bool verified) external onlyOwner {
        require(orders[orderID].price > 0, "Order does not exist");
        require(orders[orderID].verified == false, "Order already verified");
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
            IERC20 token = orders[orderID].token;
            delete orders[orderID];
            emit CompletePurchase(orderID,true);
            // Cash-out to the shop's account
            token.transfer(shopAddress, price);
        }
    }
}
