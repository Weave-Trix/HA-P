// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@chainlink/contracts/src/v0.8/KeeperCompatible.sol";
import "../libraries/AuctionUtility.sol";

error AuctionManager_BiddingAuctionNotFound();
error AuctionManager_PendingPaymentAuctionNotFound();
error AuctionManager_VerifyWinnerAuctionNotFound();

error AuctionRegistry_RestrictedOwnerAccess();
error AuctionRegistry__RestrictedManagerAccess();
error AuctionRegistry__AuctionOngoing();

error Auction_RestrictedSellerAccess();
error Auction_NotInPendingPaymentState();
error Auction_RestrictedWinnerPaymentAccess();
error Auction_SelfBiddingIsNotAllowed();
error Auction_NoProceeds();

/*
1. Seller can register a new vehicle by minting a vehicle NFT
2. Seller can host an auction for vehicles NFT that they own by creating a new BiddingHost contract
3. BiddingHost can call HAP to emit events 
    to record each bid, extend bid end time, end bid, and record pending payments
4. Chainlink Keeper is needed for automated end bid + refund deposit, lock contract + send deposit to HAP owner
5. Chainlink Oracle is needed to fetch the latest usd -> eth rate
*/

contract AuctionManager {
    event AuctionRegistered(
        address indexed auction,
        address seller,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 registerTime
    );

    event AuctionStartedBidding(
        address indexed auction,
        address seller,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 depositWei,
        uint256 bidStartTime,
        uint256 bidEndTime,
        uint256 startingBid
    );

    event AuctionVerifyingWinner(
        address indexed auction,
        address seller,
        address nftAddress,
        uint256 indexed tokenId,
        address indexed winner,
        uint256 winningBid,
        uint256 bidStartTime,
        uint256 expiryTime
    );

    event AuctionPendingPayment(
        address indexed auction,
        address seller,
        address nftAddress,
        uint256 indexed tokenId,
        address indexed winner,
        uint256 winningBid,
        uint256 bidStartTime,
        uint256 expiryTime
    );

    // if winner did not pay, in the event listener, change the deposit placed event record (boolean winnerWithdrawal to false)
    event AuctionClosed(
        address indexed auction,
        address seller,
        address nftAddress,
        uint256 indexed tokenId,
        uint256 closeTime,
        address winner,
        uint256 winningBid,
        Constants.AuctionEndState indexed endState
    );

    event AuctionDepositPlaced(
        address indexed auction,
        address indexed nftAddress,
        uint256 indexed tokenId,
        address bidder,
        uint256 depositAmount,
        uint256 depositTime
    );

    event AuctionDepositRetrieved(
        address indexed auction,
        address indexed nftAddress,
        uint256 indexed tokenId,
        address bidder,
        uint256 retrieveAmount,
        uint256 retrievalTime
    );

    event AuctionBidPlaced(
        address indexed auction,
        address indexed nftAddress,
        uint256 indexed tokenId,
        address bidder,
        uint256 bidAmount,
        uint256 bidTime
    );

    event AuctionFullSettlementPaid(
        address indexed auction,
        address indexed nftAddress,
        uint256 indexed tokenId,
        address winner,
        address seller,
        uint256 paidAmount,
        uint256 paidTime
    );

    event AuctionProceedsRetrieved(
        address indexed auction,
        address indexed nftAddress,
        uint256 indexed tokenId,
        address seller,
        uint256 retrieveAmount,
        uint256 retrievalTime
    );

    // TODO: Maintain an array to check timeLeft of BIDDING auctions (if timeLeft==0, perform Upkeep)
    // TODO: Maintain an array to check timeLeft of PENDING_PAYMENT auctions (if timeLeft==0, perform Upkeep)
    address[] public biddingAuctions;
    address[] public verifyWinnerAuctions;
    address[] public pendingPaymentAuctions;
    address auctionRegistryAdrress;

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

    constructor(address _auctionRegistryAddress) {
        auctionRegistryAdrress = _auctionRegistryAddress;
    }

    modifier onlyAuction(address _senderAddress) {
        AuctionUtility.getContractType(_senderAddress);
        _;
    }

    function getContractType() public pure returns (Constants.ContractType) {
        return Constants.ContractType.AUCTION_MANAGER;
    }

    function createAuction(address _nftAddress, uint256 _tokenId) external {
        // call AuctionRegistry, register auction
        // create Auction contract
        Auction newAuctionInstance = new Auction(
            msg.sender,
            address(this),
            _nftAddress,
            _tokenId
        );
        AuctionRegistry auctionRegistry = AuctionRegistry(
            auctionRegistryAdrress
        );
        auctionRegistry.registerAuction(_tokenId, address(newAuctionInstance));
    }

    function addBiddingAuction(address _auctionAddress)
        public
        onlyAuction(msg.sender)
    {
        // TODO: to be called when bidding starts (by Auction.startAuction())
        biddingAuctions.push(address(_auctionAddress));
    }

    function removeBiddingAuction(address _auctionAddress)
        public
        onlyAuction(msg.sender)
    {
        // TODO: to be called when bidding end time reached (by keepers)
        uint auctionIndex = searchBiddingAuction(_auctionAddress);
        for (uint i = auctionIndex; i < biddingAuctions.length - 1; i++) {
            biddingAuctions[i] = biddingAuctions[i + 1];
        }
        biddingAuctions.pop();
    }

    function addVerifyWinnerAuction(address _auctionAddress)
        public
        onlyAuction(msg.sender)
    {
        // TODO: to be called when bidding end time reached (by keepers)
        verifyWinnerAuctions.push(address(_auctionAddress));
    }

    function removeVerifyWinnerAuction(address _auctionAddress)
        public
        onlyAuction(msg.sender)
    {
        // TODO: to be called when winner paid (by Auction.payFullSettlement()) / payment expiry time reached (by keepers)
        uint auctionIndex = searchVerifyWInnerAuction(_auctionAddress);
        for (uint i = auctionIndex; i < verifyWinnerAuctions.length - 1; i++) {
            verifyWinnerAuctions[i] = verifyWinnerAuctions[i + 1];
        }
        verifyWinnerAuctions.pop();
    }

    function addPendingPaymentAuction(address _auctionAddress)
        public
        onlyAuction(msg.sender)
    {
        // TODO: to be called when bidding end time reached (by keepers)
        pendingPaymentAuctions.push(address(_auctionAddress));
    }

    function removePendingPaymentAuction(address _auctionAddress)
        public
        onlyAuction(msg.sender)
    {
        // TODO: to be called when winner paid (by Auction.payFullSettlement()) / payment expiry time reached (by keepers)
        uint auctionIndex;
        int searchResult = searchPendingPaymentAuction(_auctionAddress);
        if (searchResult >= 0) {
            auctionIndex = uint(searchResult);
            for (
                uint i = auctionIndex;
                i < pendingPaymentAuctions.length - 1;
                i++
            ) {
                pendingPaymentAuctions[i] = pendingPaymentAuctions[i + 1];
            }
            pendingPaymentAuctions.pop();
        }
    }

    function searchBiddingAuction(address _auctionAddress)
        internal
        view
        returns (uint)
    {
        for (uint i = 0; i < uint(biddingAuctions.length); i++) {
            if (biddingAuctions[i] == _auctionAddress) {
                return uint(i);
            }
        }
        revert AuctionManager_BiddingAuctionNotFound();
    }

    function searchVerifyWInnerAuction(address _auctionAddress)
        internal
        view
        returns (uint)
    {
        for (uint i = 0; i < uint(verifyWinnerAuctions.length); i++) {
            if (verifyWinnerAuctions[i] == _auctionAddress) {
                return uint(i);
            }
        }
        revert AuctionManager_VerifyWinnerAuctionNotFound();
    }

    function searchPendingPaymentAuction(address _auctionAddress)
        internal
        view
        returns (int)
    {
        for (uint i = 0; i < uint(pendingPaymentAuctions.length); i++) {
            if (pendingPaymentAuctions[i] == _auctionAddress) {
                return int(i);
            }
        }
        revert AuctionManager_PendingPaymentAuctionNotFound();
    }

    function emitAuctionRegistered(
        address _auction,
        address _seller,
        address _nftAddress,
        uint256 _tokenId,
        uint256 _registerTime
    ) public onlyAuction(msg.sender) {
        emit AuctionRegistered(
            _auction,
            _seller,
            _nftAddress,
            _tokenId,
            _registerTime
        );
    }

    function emitAuctionStartedBidding(
        address _auction,
        address _seller,
        address _nftAddress,
        uint256 _tokenId,
        uint256 _depositWei,
        uint256 _startTime,
        uint256 _bidEndTime,
        uint256 _startingBid
    ) public onlyAuction(msg.sender) {
        emit AuctionStartedBidding(
            _auction,
            _seller,
            _nftAddress,
            _tokenId,
            _depositWei,
            _startTime,
            _bidEndTime,
            _startingBid
        );
    }

    function emitAuctionVerifyingWinner(
        address _auction,
        address _seller,
        address _nftAddress,
        uint256 _tokenId,
        address _winner,
        uint256 _winningBid,
        uint256 _startTime,
        uint256 _expiryTime
    ) public onlyAuction(msg.sender) {
        emit AuctionVerifyingWinner(
            _auction,
            _seller,
            _nftAddress,
            _tokenId,
            _winner,
            _winningBid,
            _startTime,
            _expiryTime
        );
    }

    function emitAuctionPendingPayment(
        address _auction,
        address _seller,
        address _nftAddress,
        uint256 _tokenId,
        address _winner,
        uint256 _winningBid,
        uint256 _startTime,
        uint256 _expiryTime
    ) public onlyAuction(msg.sender) {
        emit AuctionPendingPayment(
            _auction,
            _seller,
            _nftAddress,
            _tokenId,
            _winner,
            _winningBid,
            _startTime,
            _expiryTime
        );
    }

    function emitAuctionClosed(
        address _auction,
        address _seller,
        address _nftAddress,
        uint256 _tokenId,
        uint256 _closeTime,
        address _winner,
        uint256 _winningBid,
        Constants.AuctionEndState _endState
    ) public onlyAuction(msg.sender) {
        emit AuctionClosed(
            _auction,
            _seller,
            _nftAddress,
            _tokenId,
            _closeTime,
            _winner,
            _winningBid,
            _endState
        );
    }

    function emitAuctionDepositPlaced(
        address _auction,
        address _nftAddress,
        uint256 _tokenId,
        address _bidder,
        uint256 _depositAmount,
        uint256 _depositTime
    ) public onlyAuction(msg.sender) {
        emit AuctionDepositPlaced(
            _auction,
            _nftAddress,
            _tokenId,
            _bidder,
            _depositAmount,
            _depositTime
        );
    }

    function emitAuctionBidPlaced(
        address _auction,
        address _nftAddress,
        uint256 _tokenId,
        address _bidder,
        uint256 _bidAmount,
        uint256 _bidTime
    ) public onlyAuction(msg.sender) {
        emit AuctionBidPlaced(
            _auction,
            _nftAddress,
            _tokenId,
            _bidder,
            _bidAmount,
            _bidTime
        );
    }

    function emitAuctionFullSettlementPaid(
        address _auction,
        address _nftAddress,
        uint256 _tokenId,
        address _winner,
        address _seller,
        uint256 _paidAmount,
        uint256 _paidTime
    ) public onlyAuction(msg.sender) {
        emit AuctionFullSettlementPaid(
            _auction,
            _nftAddress,
            _tokenId,
            _winner,
            _seller,
            _paidAmount,
            _paidTime
        );
    }

    function emitAuctionDepositRetrieved(
        address _auction,
        address _nftAddress,
        uint256 _tokenId,
        address _bidder,
        uint256 _retrieveAmount,
        uint256 _retrievalTime
    ) public onlyAuction(msg.sender) {
        emit AuctionDepositRetrieved(
            _auction,
            _nftAddress,
            _tokenId,
            _bidder,
            _retrieveAmount,
            _retrievalTime
        );
    }

    function emitAuctionProceedsRetrieved(
        address _auction,
        address _nftAddress,
        uint256 _tokenId,
        address _seller,
        uint256 _retrieveAmount,
        uint256 _retrievalTime
    ) public onlyAuction(msg.sender) {
        emit AuctionProceedsRetrieved(
            _auction,
            _nftAddress,
            _tokenId,
            _seller,
            _retrieveAmount,
            _retrievalTime
        );
    }
}

contract AuctionRegistry {
    address public immutable owner;
    address public auctionManagerAddress;
    AuctionManager private auctionManager;

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

    modifier onlyAuctionInactive(uint256 _tokenId, address _auctionAddress) {
        // if event still not ended, unable to create a same auction for the NFT
        // create interface of Auction.sol
        Auction auction = Auction(_auctionAddress);
        // call Auction.getEventState();
        if (
            !(auction.inClosedState() ||
                (tokenIdToAuctionAddress[_tokenId] == address(0x0)))
        ) {
            revert AuctionRegistry__AuctionOngoing();
        }
        _;
    }

    function getContractType() public pure returns (Constants.ContractType) {
        return Constants.ContractType.AUCTION_REGISTRY;
    }

    function setAuctionManagerAddress(address _auctionManagerAddress)
        public
        onlyOwner
    {
        auctionManagerAddress = _auctionManagerAddress;
        auctionManager = AuctionManager(auctionManagerAddress);
    }

    function registerAuction(uint256 _tokenId, address _auctionAddress)
        public
        onlyAuctionManager
        onlyAuctionInactive(_tokenId, _auctionAddress)
    {
        // if NFT id not in map, store the NFT -> address mapping
        // else if NFT id already exist, update the mapping
        tokenIdToAuctionAddress[_tokenId] = _auctionAddress; // this line does it all
    }

    // TODO: registerTechnician
}

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
contract Auction {
    enum AuctionState {
        REGISTERED,
        BIDDING,
        VERIFYING_WINNER,
        PENDING_PAYMENT,
        AUCTION_CLOSED
    }

    address public nftAddress;
    uint256 public tokenId;
    address public immutable auctionManagerAddress;
    address payable public seller;
    uint128 public depositUSD = 1;
    uint256 public depositWei;
    uint256 public bidStartTime;
    uint256 public bidEndTime;
    uint128 public durationSec;
    uint256 public verify_startTime;
    uint256 public verify_expiryTime;
    uint256 public verify_duration = 1 days;
    uint256 public payment_startTime;
    uint256 public payment_expiryTime;
    uint256 public payment_duration = 1 days;
    AuctionState public currAuctionState = AuctionState.REGISTERED;
    Constants.AuctionEndState public auctionEndState =
        Constants.AuctionEndState.NOT_ENDED;
    uint256 public highestBid;
    address public highestBidder;
    bool winnerPaid = false;
    mapping(address => uint128) private bidderToDeposits;
    mapping(address => uint256) private fullSettlement;
    AuctionManager private auctionManager;

    // TODO: call AuctionManager to emit event
    // TODO: chainlink keepers call function verifyAuction(false);

    constructor(
        address _seller,
        address _auctionManagerAddress,
        address _nftAddress,
        uint256 _tokenId
    ) {
        seller = payable(_seller);
        auctionManagerAddress = _auctionManagerAddress;
        auctionManager = AuctionManager(auctionManagerAddress);
        nftAddress = _nftAddress;
        tokenId = _tokenId;
        currAuctionState = AuctionState.REGISTERED;
        depositWei = AuctionUtility.convertUsdToWei(depositUSD);
        auctionManager.emitAuctionRegistered(
            address(this),
            _seller,
            _nftAddress,
            _tokenId,
            getBlockTime()
        );
    }

    modifier onlySeller() {
        if (msg.sender != seller) {
            revert Auction_RestrictedSellerAccess();
        }
        _;
    }

    modifier onlyWinnerPayment() {
        if (msg.sender != highestBidder && !(inPendingPaymentState())) {
            revert Auction_RestrictedWinnerPaymentAccess();
        }
        _;
    }

    modifier notForSeller() {
        if (msg.sender == seller) {
            revert Auction_SelfBiddingIsNotAllowed();
        }
        _;
    }

    function getContractType() public pure returns (Constants.ContractType) {
        return Constants.ContractType.AUCTION;
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

    function inClosedState() public view returns (bool) {
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
        bidStartTime = block.timestamp;
        bidEndTime = bidStartTime + _durationSec;
        durationSec = _durationSec;
        highestBid = _startingBid;
        currAuctionState = AuctionState.BIDDING;

        auctionManager.emitAuctionStartedBidding(
            address(this),
            seller,
            nftAddress,
            tokenId,
            depositWei,
            bidStartTime,
            bidEndTime,
            _startingBid
        );
        auctionManager.addBiddingAuction(address(this));
    }

    function endBidding() public {
        require(inBiddingState(), "Auction not in StartedBidding state!");
        require(
            block.timestamp >= bidEndTime,
            "Auction has not reached end time yet!"
        );
        if (highestBidder == address(0x0)) {
            closeAuction(Constants.AuctionEndState.NO_BIDDER);
        } else {
            currAuctionState = AuctionState.VERIFYING_WINNER;
            verify_startTime = getBlockTime();
            verify_expiryTime = verify_startTime + verify_duration;
            auctionManager.emitAuctionVerifyingWinner(
                address(this),
                seller,
                nftAddress,
                tokenId,
                highestBidder,
                highestBid,
                verify_startTime,
                verify_expiryTime
            );
        }
        auctionManager.removeBiddingAuction(address(this));
        auctionManager.addVerifyWinnerAuction(address(this));
    }

    function verifyWinner(bool approveWinningBid) external onlySeller {
        // TODO: when timer's up, keepers call this function, verifyWinner(false)
        require(inVerifyWinnerState(), "Auction not in VerifyingWinner state!");
        require(
            getVerifyTimeLeft() > 0,
            "Seller did not verify in given time!"
        );
        if (approveWinningBid) {
            payment_startTime = getBlockTime();
            payment_expiryTime = payment_startTime + payment_duration;
            currAuctionState = AuctionState.PENDING_PAYMENT;
            auctionManager.emitAuctionPendingPayment(
                address(this),
                seller,
                nftAddress,
                tokenId,
                highestBidder,
                highestBid,
                payment_startTime,
                payment_expiryTime
            );
            auctionManager.removeVerifyWinnerAuction(address(this));
            auctionManager.addPendingPaymentAuction(address(this));
        } else {
            closeAuction(Constants.AuctionEndState.REJECTED_BY_SELLER);
            auctionManager.removeVerifyWinnerAuction(address(this));
        }
    }

    function closeAuction(Constants.AuctionEndState _endState) public {
        // can only be closed when the winner pays or the payment pending expired (chainlink keepers trigger)
        require(
            ((currAuctionState == AuctionState.PENDING_PAYMENT) &&
                (msg.sender == highestBidder)) ||
                (msg.sender == auctionManagerAddress),
            "Function not to be called manually!"
        );
        currAuctionState = AuctionState.AUCTION_CLOSED; // TODO: emit event
        auctionEndState = _endState;
        auctionManager.emitAuctionClosed(
            address(this),
            seller,
            nftAddress,
            tokenId,
            getBlockTime(),
            highestBidder,
            highestBid,
            _endState
        );
        if (
            (_endState == Constants.AuctionEndState.PAYMENT_OVERDUE) ||
            (_endState == Constants.AuctionEndState.OWNERSHIP_TRANSFERRED)
        ) {
            auctionManager.removePendingPaymentAuction(address(this));
        }
    }

    function placeDeposit() external payable notForSeller {
        require(inBiddingState(), "Auction not in StartedBidding state!");
        require(
            (bidderToDeposits[msg.sender] == 0),
            "You have already deposited!"
        );
        require(
            (msg.value >= depositWei),
            "Please pay the exact deposit amount!"
        );
        bidderToDeposits[msg.sender] += uint128(msg.value);
        auctionManager.emitAuctionDepositPlaced(
            address(this),
            nftAddress,
            tokenId,
            msg.sender,
            msg.value,
            getBlockTime()
        );
    }

    function placeBid(uint256 _bidAmount) external notForSeller {
        require(inBiddingState(), "Auction not in StartedBidding state!");
        require(
            (bidderToDeposits[msg.sender] >= depositWei),
            "Please deposit before bidding!"
        );
        require(
            _bidAmount > highestBid,
            "Your bid is lower than the current highest bid!"
        );

        highestBid = _bidAmount;
        highestBidder = msg.sender;
        auctionManager.emitAuctionBidPlaced(
            address(this),
            nftAddress,
            tokenId,
            msg.sender,
            _bidAmount,
            getBlockTime()
        );
    }

    function withdrawDeposit() external payable {
        require(
            ((msg.sender != highestBidder) ||
                (msg.sender == highestBidder && winnerPaid == true) ||
                (msg.sender == highestBidder && inClosedState())),
            "You can only withdraw the deposit if you are not the highest bidder! or You won and paid for the full payment!"
        );
        // requires bidder to settle full payment for withdrawal (full payment only when the seller accepted the result)
        // requires bidder to not exceed the expiry date for full payment settlement
        // close the auction when the expiry date is reached
        uint128 depositBalance = bidderToDeposits[msg.sender];
        bidderToDeposits[msg.sender] = 0;
        (bool sent, ) = payable(msg.sender).call{value: depositBalance}("");
        require(sent, "ETH withdrawal failed!");
        auctionManager.emitAuctionDepositRetrieved(
            address(this),
            nftAddress,
            tokenId,
            msg.sender,
            depositBalance,
            getBlockTime()
        );
    }

    function payFullSettlement() external payable onlyWinnerPayment {
        require(
            (inPendingPaymentState()),
            "Auction not in PendingPayment state!"
        );
        require(
            (getPaymentTimeLeft() > 0),
            "Payment window for full settlement closed!"
        );
        require(
            (msg.value == highestBid),
            "Payment value must be equal to your winning bid!"
        );
        require((!winnerPaid), "You have paid!");
        fullSettlement[seller] = msg.value;
        winnerPaid = true;
        // TODO: transfer NFT ownership
        auctionManager.emitAuctionFullSettlementPaid(
            address(this),
            nftAddress,
            tokenId,
            msg.sender,
            seller,
            msg.value,
            getBlockTime()
        );
        closeAuction(Constants.AuctionEndState.OWNERSHIP_TRANSFERRED);
    }

    function withdrawFullSettlement() external onlySeller {
        uint256 proceeds = fullSettlement[msg.sender];
        if (proceeds <= 0) {
            revert Auction_NoProceeds();
        }
        fullSettlement[msg.sender] = 0;
        (bool sent, ) = payable(msg.sender).call{value: proceeds}("");
        require(sent, "ETH transfer failed");
        auctionManager.emitAuctionProceedsRetrieved(
            address(this),
            nftAddress,
            tokenId,
            msg.sender,
            proceeds,
            getBlockTime()
        );
    }

    function getBlockTime() public view returns (uint256) {
        return (block.timestamp);
    }

    function getBidTimeLeft() public view returns (uint256) {
        if (getBlockTime() > bidEndTime) {
            return 0;
        } else {
            return (bidEndTime - getBlockTime());
        }
    }

    function getVerifyTimeLeft() public view returns (uint256) {
        if (getBlockTime() > verify_expiryTime) {
            return 0;
        } else {
            return (verify_expiryTime - getBlockTime());
        }
    }

    function getPaymentTimeLeft() public view returns (uint256) {
        if (getBlockTime() > payment_expiryTime) {
            return 0;
        } else {
            return (payment_expiryTime - getBlockTime());
        }
    }
}