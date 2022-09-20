// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

error AuctionRegistry_RestrictedOwnerAccess();
error AuctionRegistry__RestrictedManagerAccess();
error AuctionRegistry__AuctionOngoing();

interface Auction {
    function inEndedState() external view returns (bool);
}

contract AuctionEventRegistry {
    address public immutable owner;
    address public auctionManagerAddress;

    mapping(uint256 => address) public tokenIdToAuctionAddress;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert AuctionRegistry_RestrictedOwnerAccess();
        }
        _;
    }

    modifier onlyAuctionManager() {
        if (msg.sender != auctionManagerAddress) {
            revert AuctionRegistry__RestrictedManagerAccess();
        }
        _;
    }

    modifier onlyAuctionEnded(address _auctionAddress) {
        // if event still not ended, unable to create a same auction for the NFT
        // create interface of Auction.sol
        Auction auction = Auction(_auctionAddress);
        // call Auction.getEventState();
        if (!(auction.inEndedState())) {
            revert AuctionRegistry__AuctionOngoing();
        }
        _;
    }

    function setAuctionManagerAddress(address _auctionManagerAddress)
        public
        onlyOwner
    {
        auctionManagerAddress = _auctionManagerAddress;
    }

    function registerAuction(uint256 _tokenId, address _auctionAddress)
        public
        onlyAuctionManager
        onlyAuctionEnded(_auctionAddress)
    {
        // if NFT id not in map, store the NFT -> address mapping
        // else if NFT id already exist, update the mapping
        tokenIdToAuctionAddress[_tokenId] = _auctionAddress; // this line does it all
    }

    // TODO: registerTechnician
}
