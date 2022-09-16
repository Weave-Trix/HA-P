// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/*
1. Seller can register a new vehicle by minting a vehicle NFT
2. Seller can host an auction for vehicles NFT that they own by creating a new BiddingHost contract
3. BiddingHost can call HAP to emit events 
    to record each bid, extend bid end time, end bid, and record pending payments
4. Chainlink Keeper is needed for automated end bid + refund deposit, lock contract + send deposit to HAP owner
5. Chainlink Oracle is needed to fetch the latest usd -> eth rate
*/

contract BidHostManager {
    function getWeiPerUsdRate() public view returns (uint256) {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e);
        (,int256 price,,,) = priceFeed.latestRoundData(); // WeiPerUsd (in 8 decimals)
        return uint256(price * 1e10);
    }

    function convertWeiToUsd(uint256 p_weiAmount) public view returns (uint256) {
        uint256 ethRate = getWeiPerUsdRate();
        uint256 usdEquivalent = (p_weiAmount / ethRate);
        return usdEquivalent;
    }

    function convertUsdToWei(uint256 p_usdAmount) public view returns (uint256) {
        uint256 ethRate = getWeiPerUsdRate();
        uint256 weiEquivalent = (p_usdAmount * ethRate);
        return weiEquivalent;
    }
}