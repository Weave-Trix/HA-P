// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./Auction.sol";
import "../libraries/AuctionUtility.sol";

/*
1. Seller can register a new vehicle by minting a vehicle NFT
2. Seller can host an auction for vehicles NFT that they own by creating a new BiddingHost contract
3. BiddingHost can call HAP to emit events 
    to record each bid, extend bid end time, end bid, and record pending payments
4. Chainlink Keeper is needed for automated end bid + refund deposit, lock contract + send deposit to HAP owner
5. Chainlink Oracle is needed to fetch the latest usd -> eth rate
*/

contract AuctionManager {
    // TODO: Maintain an array to check timeLeft of BIDDING auctions (if timeLeft==0, perform Upkeep)
    // TODO: Maintain an array to check timeLeft of PENDING_PAYMENT auctions (if timeLeft==0, perform Upkeep)
    address[] public biddingAuctions;
    address[] public pendingPaymentAuctions;

    // TODO: transition between Auction states
    // TODO: chainlink keepers for automated transition to VERIFYING_WINNER state when the auction ended
    // TODO: chainlink keepers for automated transition to ENDED state when payment timer's up

    // TODO: emit event when Auction state changed
    /*
    1. Auction registered
    2. Auction accepting bids
    3. Auction closed bids (with winner declaration)
    4. Auction awaiting payments (seller accepted winning bid)
    5. Auction ended
    */

    // TODO: emit event when Bidder perform action
    /*
   1. Bidder submit bids
   */

    constructor() {}

    function createAuction(uint256 _tokenId) external {
        // call AuctionRegistry, register auction
        // create Auction contract
        Auction newAuctionInstance = new Auction(msg.sender, address(this));
        biddingAuctions.push(address(newAuctionInstance));
    }
}
