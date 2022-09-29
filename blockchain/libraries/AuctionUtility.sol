// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

library AuctionUtility {
    function getWeiPerUsdRate() internal view returns (uint256) {
        // for testnet
        /*
        AggregatorV3Interface priceFeed = AggregatorV3Interface(
            0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e
        );
        (, int256 price, , , ) = priceFeed.latestRoundData(); // WeiPerUsd (in 8 decimals)
        */
        // for local network
        int256 price = 132102000000;

        return uint256(price * 1e10);
    }

    function convertWeiToUsd(uint256 p_weiAmount)
        internal
        view
        returns (uint256)
    {
        uint256 ethRate = getWeiPerUsdRate();
        uint256 usdEquivalent = (p_weiAmount * ethRate) / (1e18 * 1e18);
        return usdEquivalent;
    }

    function convertUsdToWei(uint256 p_usdAmount)
        internal
        view
        returns (uint256)
    {
        uint256 ethRate = getWeiPerUsdRate();
        uint256 weiEquivalent = (1e18 * 1e18) / (p_usdAmount * ethRate);
        return weiEquivalent;
    }

    function hourToSec(uint inHours) internal pure returns (uint256 inMinutes) {
        return (inHours * 60 * 60);
    }

    function getContractType(address _contractAddress)
        internal
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
        AUCTION_REGISTRY,
        CONTRACT_FACTORY,
        AUCTION_KEEPER
    }

    enum AuctionEndState {
        NOT_ENDED,
        CANCELED,
        NO_BIDDER,
        REJECTED_BY_SELLER,
        PAYMENT_OVERDUE,
        AUDIT_REJECTED,
        OWNERSHIP_TRANSFERRED
    }
}
