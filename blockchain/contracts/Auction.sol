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
11. The payment must be made within 1 day(s) after the auction ends, 
    otherwise payment cannot be made and the NFT will not be transferred
12. If no one bid on the vehicle after the bidding time is up, the auctin will end with EndState.NO_BIDDER
*/
import "../libraries/AuctionUtility.sol";

error Auction_RestrictedSellerAccess();
error Auction_NotInPendingPaymentState();
error Auction_RestrictedWinnerAccess();
error Auction_SelfBiddingIsNotAllowed();
error Auction_NoProceeds();

contract Auction {
    enum AuctionState {
        REGISTERED,
        BIDDING,
        VERIFYING_WINNER,
        PENDING_PAYMENT,
        AUCTION_CLOSED
    }
    enum EndState {
        NOT_ENDED,
        NO_BIDDER,
        REJECTED_BY_SELLER,
        PAYMENT_OVERDUE,
        OWNERSHIP_TRANSFERRED
    }

    address public immutable auctionManagerAddress;
    address payable public seller;
    uint128 public depositUSD = 500;
    uint256 public startTime;
    uint256 public endTime;
    uint128 public durationSec;
    uint256 public payment_startTime;
    uint256 public payment_expiryTime;
    uint256 public payment_durationDayLeft = 1 days;
    AuctionState public currAuctionState = AuctionState.REGISTERED;
    EndState public auctionEndState = EndState.NOT_ENDED;
    uint256 public highestBid;
    address public highestBidder;
    bool winnerPaid = false;
    mapping(address => uint128) private bidderToDeposits;
    mapping(address => uint256) private fullSettlement;

    event BiddingStarted();
    event BiddingEnded(
        address indexed seller,
        address highestBidder,
        uint256 highestBid
    );
    event Bid(address indexed bidder, uint256 amount);
    event WithdrawDeposit(address indexed bidder, uint128 amount);

    // TODO: call AuctionManager to emit event

    constructor(address _seller, address _auctionManagerAddress) {
        seller = payable(_seller);
        auctionManagerAddress = _auctionManagerAddress;
        currAuctionState = AuctionState.REGISTERED;
    }

    modifier onlySeller() {
        if (msg.sender != seller) {
            revert Auction_RestrictedSellerAccess();
        }
        _;
    }

    modifier onlyWinnerPayment() {
        if (msg.sender != highestBidder && inPendingPaymentState()) {
            revert Auction_RestrictedWinnerAccess();
        }
        _;
    }

    modifier notForSeller() {
        if (msg.sender != seller) {
            revert Auction_SelfBiddingIsNotAllowed();
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
        if (currAuctionState == AuctionState.AUCTION_CLOSED) {
            return true;
        } else {
            return false;
        }
    }

    function startAuction(uint128 _durationSec, uint128 _startingBid) external {
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

    function endBidding() public {
        require(inBiddingState(), "Auction not in StartedBidding state!");
        require(
            block.timestamp >= endTime,
            "Auction has not reached end time yet!"
        );
        if (highestBidder == address(0x0)) {
            closeAuction();
            auctionEndState = EndState.NO_BIDDER;
        } else {
            currAuctionState = AuctionState.VERIFYING_WINNER;
            // TODO: emit event
        }

        emit BiddingEnded(seller, highestBidder, highestBid);
    }

    function verifyWinner(bool approveWinningBid) external onlySeller {
        require(inVerifyWinnerState(), "Auction not in VerifyingWinner state!");
        if (approveWinningBid) {
            // TODO: emit event
            payment_startTime = getBlockTime();
            payment_expiryTime = payment_startTime + payment_durationDayLeft;
            currAuctionState = AuctionState.PENDING_PAYMENT;
        } else {
            // TODO: emit event
            currAuctionState = AuctionState.AUCTION_CLOSED;
            auctionEndState = EndState.REJECTED_BY_SELLER;
        }
    }

    function closeAuction() public {
        // can only be closed when the winner pays or the payment pending expired (chainlink keepers trigger)
        require(
            ((currAuctionState == AuctionState.PENDING_PAYMENT) &&
                (msg.sender == highestBidder)) ||
                (msg.sender == auctionManagerAddress),
            "Function not to be called manually!"
        );
        currAuctionState = AuctionState.AUCTION_CLOSED; // TODO: emit event
        if (winnerPaid) {
            auctionEndState = EndState.OWNERSHIP_TRANSFERRED;
        } else {
            auctionEndState = EndState.PAYMENT_OVERDUE;
        }
    }

    function placeDeposit() external payable notForSeller {
        require(inBiddingState(), "Auction not in StartedBidding state!");
        require(
            (bidderToDeposits[msg.sender] == 0),
            "You have already deposited!"
        );
        require(
            (msg.value >= getDepositInWei()),
            "Please pay the exact deposit amount!"
        );
        bidderToDeposits[msg.sender] += uint128(msg.value);
    }

    function placeBid() external payable notForSeller {
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
            ((msg.sender != highestBidder) ||
                (msg.sender == highestBidder && winnerPaid == true)),
            "You can only withdraw the deposit if you are not the highest bidder! or You won and paid for the full payment!"
        );
        // TODO: requires bidder to settle full payment for withdrawal (full payment only when the seller accepted the result)
        // TODO: requires bidder to not exceed the expiry date for full payment settlement
        // TODO: close the auction when the expiry date is reached
        uint128 depositBalance = bidderToDeposits[msg.sender];
        bidderToDeposits[msg.sender] = 0;
        (bool sent, ) = payable(msg.sender).call{value: depositBalance}("");
        require(sent, "ETH withdrawal failed!");

        emit WithdrawDeposit(msg.sender, uint128(msg.value));
        // TODO: event for bidder quit
    }

    function payFullSettlement() external payable onlyWinnerPayment {
        require(
            (inPendingPaymentState()),
            "Auction not in PendingPayment state!"
        );
        require(
            (msg.value == highestBid),
            "Payment value must be equal to your winning bid!"
        );
        require((!winnerPaid), "You have paid!");
        fullSettlement[seller] = msg.value;
        // TODO: transfer NFT ownership
    }

    function withdrawFullSettlement() external onlySeller {
        uint256 proceeds = fullSettlement[msg.sender];
        if (proceeds <= 0) {
            revert Auction_NoProceeds();
        }
        fullSettlement[msg.sender] = 0;
        (bool sent, ) = payable(msg.sender).call{value: proceeds}("");
        require(sent, "ETH transfer failed");
        // TODO: emit event
    }

    function getBlockTime() public view returns (uint256) {
        return (block.timestamp);
    }

    function getTimeLeft() public view returns (uint256) {
        return (endTime - getBlockTime());
    }

    function getDepositInWei() public view returns (uint256) {
        return (AuctionUtility.convertUsdToWei(depositUSD));
    }

    function hourToSec(uint inHours) public pure returns (uint256 inMinutes) {
        return (inHours * 60 * 60);
    }
}
