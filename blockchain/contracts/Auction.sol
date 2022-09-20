// SPDX-License-Identifier: MIT
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
12. If no one bid on the vehicle after the bidding time is up, the auctin will end with EndState.NOT_ENDED
*/

error Auction_RestrictedSellerAccess();
error Auction_NotInPendingPaymentState();

interface AuctionManager {
    function convertUsdToWei(uint256 p_usdAmount) external view returns (uint256);
}

contract Auction {
    event BiddingStarted();
    event BiddingEnded(address highestBidder, uint256 highestBid);
    event Bid(address indexed bidder, uint256 amount);
    event WithdrawDeposit(address indexed bidder, uint128 amount);
    // TODO: call AuctionManager to emit event

    address public immutable auctionManagerAddress;
    address payable public seller;
    uint256 public startTime;
    uint256 public endTime;
    uint128 public durationSec;
    uint128 public depositUSD = 500;

    enum AuctionState {
        REGISTERED,
        BIDDING,
        VERIFYING_WINNER,
        PENDING_PAYMENT,
        ENDED
    }
    enum EndState {
        NOT_ENDED,
        NO_WINNER,
        SELLER_REJECTED,
        PAYMENT_OVERDUE,
        OWNERSHIP_TRANSFERRED
    }

    AuctionState public currAuctionState;
    EndState public auctionEndState;
    uint256 public highestBid;
    address public highestBidder;
    mapping(address => uint128) public bidderToDeposits;

    constructor(address _seller, address _auctionManagerAddress) {
        seller = payable(_seller);
        auctionManagerAddress =_auctionManagerAddress;
        currAuctionState = AuctionState.REGISTERED;
    }

    modifier onlySeller() {
        if (msg.sender != seller) {
            revert Auction_RestrictedSellerAccess();
        }
        _;
    }

    function inRegisteredState() public view returns (bool) {
        if (currAuctionState == AuctionState.REGISTERED) {
            return true;
        } else {
            return false;
        }
    }

    function inBiddingState() public view returns (bool) {
        if (currAuctionState == AuctionState.BIDDING) {
            return true;
        } else {
            return false;
        }
    }

    function inVerifyWinnerState() public view returns (bool) {
        if (currAuctionState == AuctionState.VERIFYING_WINNER) {
            return true;
        } else {
            return false;
        }
    }

    function inPendingPaymentState() public view returns (bool) {
        if (currAuctionState == AuctionState.PENDING_PAYMENT) {
            return true;
        } else {
            return false;
        }
    }

    function inEndedState() public view returns (bool) {
        if (currAuctionState == AuctionState.ENDED) {
            return true;
        } else {
            return false;
        }
    }

    function startBidding(uint128 _durationSec, uint128 _startingBid) external {
        require(inRegisteredState(), "Auction not in Registered state!");
        require(msg.sender == seller, "Start auction requires owner!");
        require(_startingBid > 0, "Starting bid must be greater than 0 wei");
        startTime = block.timestamp;
        endTime = startTime + _durationSec;
        durationSec = _durationSec;
        highestBid = _startingBid;
        currAuctionState = AuctionState.BIDDING;

        emit BiddingStarted();
    }

    function endBidding() external {
        require(inBiddingState(), "Auction not in StartedBidding state!");
        require(
            block.timestamp >= endTime,
            "Auction has not reached end time yet!"
        );
        if (highestBidder == address(0x0)) {
            currAuctionState = AuctionState.ENDED;
            auctionEndState = EndState.NO_WINNER;
        } else {
            currAuctionState = AuctionState.VERIFYING_WINNER;
        }

        emit BiddingEnded(highestBidder, highestBid);
    }

    function verifyWinner(bool approveWinningBid) external onlySeller {
        require(inVerifyWinnerState(), "Auction not in VerifyingWinner state!");
    }

    function placeDeposit() external payable {
        require(inBiddingState(), "Auction not in StartedBidding state!");
        require(
            (bidderToDeposits[msg.sender] == 0),
            "You have already deposited!"
        );
        require((msg.value >= getDepositInWei()), "Please pay the exact deposit amount!");
        bidderToDeposits[msg.sender] += uint128(msg.value);
    }

    function placeBid() external payable {
        require(inBiddingState(), "Auction not in StartedBidding state!");
        require(
            (bidderToDeposits[msg.sender] >= getDepositInWei()),
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
        // TODO: requires bidder to settle full payment for withdrawal (full payment only when the seller accepted the result)
        // TODO: requires bidder to not exceed the expiry date for full payment settlement
        // TODO: close the auction when the expiry date is reached
        uint128 depositBalance = bidderToDeposits[msg.sender];
        bidderToDeposits[msg.sender] = 0;
        (bool sent, bytes memory data) = payable(msg.sender).call{
            value: depositBalance
        }("");
        require(sent, "Withdrawal failed!");

        emit WithdrawDeposit(msg.sender, uint128(msg.value));
        // TODO: event for bidder quit
    }

    function getBlockTime() public view returns (uint256) {
        return (block.timestamp);
    }

    function getTimeLeft() public view returns (uint256) {
        return (endTime - getBlockTime());
    }

    function getDepositInWei() public view returns (uint256) {
        AuctionManager auctionManager = AuctionManager(auctionManagerAddress);
        return (auctionManager.convertUsdToWei(depositUSD));
    }
}
