// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.8;

/*
1. Seller can start the auction directly or choose to send the vehicle for verification
2. Seller must set the duration for the auction and the starting price for the auction
3. Bidder can join the auction by paying a deposit of 500$, the deposit only has to be paid once
4. The deposit can be reclaimed by bidder after the auction ends,
    if the bidder lost the auction or 
    the bidder won the auction and settled the full payment of the vehicle
5. Bidder can bid for the vehicle provided that the new bid is higher than the current highest bid
6. Seller cannot bid on their own auction
7. When the highese bid is updated within 60 seconds of the ending time, 
    the duration of the auction will be reset to 3 minutes
8. The winner of the auction will be the bidder with the highest bid when the auction ends
9. The ownership of the auction will be transferred to the winner once the winner settled the payment
10. The payment must be exactly the amount of the winning bid
11. The payment must be made within 5 days after the auction ends, 
    otherwise payment cannot be made and the NFT will not be transferred
*/
contract BidHost {
    event AuctionStarted();
    event AuctionEnded(address highestBidder, uint256 highestBid);
    event Bid(address indexed bidder, uint256 amount);
    event WithdrawDeposit(address indexed bidder, uint128 amount);

    address payable public seller;
    bool public hasStarted;
    bool public hasEnded;
    uint256 public endTime;
    uint128 public durationHr;
    uint128 public deposit = 50000000000;

    uint256 public highestBid;
    address public highestBidder;
    mapping(address => uint128) public bidderToDeposits;

    constructor() {
        seller = payable(msg.sender);
    }

    function startAuction(uint128 p_durationHr, uint128 p_startingBid)
        external
    {
        require(!hasStarted, "Already started!");
        require(msg.sender == seller, "Start auction requires owner!");
        hasStarted = true;
        endTime = block.timestamp + (p_durationHr * 60 * 60);
        durationHr = p_durationHr;
        highestBid = p_startingBid;

        emit AuctionStarted();
    }

    function endAuction() external {
        require(hasStarted, "Auction not started!");
        require(block.timestamp >= endTime, "Auction is ongoing!");
        require(!hasEnded, "Auction already ended!");

        hasEnded = true;
        emit AuctionEnded(highestBidder, highestBid);
    }

    function placeDeposit() external payable {
        require(hasStarted, "Auction not started!");
        require(!hasEnded, "Auction already ended!");
        require(
            (bidderToDeposits[msg.sender] <= deposit),
            "You have already deposited!"
        );
        require((msg.value == deposit), "Please pay the exact deposit amount!");
        bidderToDeposits[msg.sender] += uint128(msg.value);
    }

    function placeBid() external payable {
        require(hasStarted, "Auction not started!");
        require(block.timestamp < endTime, "Auction has ended!");
        require(
            (bidderToDeposits[msg.sender] >= deposit),
            "Please deposit before bidding!"
        );
        require(
            msg.value > highestBid,
            "Your bid is lower than the current highest bid!"
        );

        highestBid = msg.value;
        highestBidder = msg.sender;

        emit Bid(msg.sender, msg.value);
    }

    function withdrawDeposit() external payable {
        require(
            (msg.sender != highestBidder),
            "You can only withdraw the deposit if you are not the highest bidder!"
        );
        // TODO: requires bidder to settle full payment for withdrawal
        // TODO: requires bidder to not exceed the expiry date for full payment settlement
        uint128 depositBalance = bidderToDeposits[msg.sender];
        bidderToDeposits[msg.sender] = 0;
        (bool sent, bytes memory data) = payable(msg.sender).call{
            value: depositBalance
        }("");
        require(sent, "Withdrawal failed!");

        emit WithdrawDeposit(msg.sender, uint128(msg.value));
    }

    function getBlockTime() public view returns (uint256) {
        return block.timestamp;
    }
}
