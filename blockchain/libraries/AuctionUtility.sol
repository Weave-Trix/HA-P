// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

library AuctionUtility {
    function getWeiPerUsdRate() public view returns (uint256) {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(
            0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e
        );
        (, int256 price, , , ) = priceFeed.latestRoundData(); // WeiPerUsd (in 8 decimals)
        return uint256(price * 1e10);
    }

    function convertWeiToUsd(uint256 p_weiAmount)
        public
        view
        returns (uint256)
    {
        uint256 ethRate = getWeiPerUsdRate();
        uint256 usdEquivalent = (p_weiAmount * ethRate) / (1e18 * 1e18);
        return usdEquivalent;
    }

    function convertUsdToWei(uint256 p_usdAmount)
        public
        view
        returns (uint256)
    {
        uint256 ethRate = getWeiPerUsdRate();
        uint256 weiEquivalent = (1e18 * 1e18) / (p_usdAmount * ethRate);
        return weiEquivalent;
    }

    function hourToSec(uint inHours) public pure returns (uint256 inMinutes) {
        return (inHours * 60 * 60);
    }

    function getContractType(address _contractAddress)
        public
        returns (Constants.ContractType)
    {
        (bool success, bytes memory data) = _contractAddress.call(
            abi.encodeWithSignature("getContractType()")
        );
        require(success, "Unable to determine the contract type!");
        return abi.decode(data, (Constants.ContractType));
    }
}

library Constants {
    enum ContractType {
        AUCTION,
        AUCTION_MANAGER,
        AUCTION_REGISTRY
    }

    enum AuctionEndState {
        NOT_ENDED,
        NO_BIDDER,
        REJECTED_BY_SELLER,
        PAYMENT_OVERDUE,
        AUDIT_REJECTED,
        OWNERSHIP_TRANSFERRED
    }
}
