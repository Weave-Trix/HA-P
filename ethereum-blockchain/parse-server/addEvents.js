require("dotenv").config();
const Moralis = require("moralis");
const { EvmChain } = require("@moralisweb3/evm-utils");
const contractAddress = require("../constants/contractAddresses.json");
const nftAbi = require("../artifacts/contracts/VehicleNft.sol/VehicleNft.json");
const auctionAbi = require("../artifacts/contracts/AuctionContracts.sol/EventEmitter.json");

/* const */
const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
const appId = process.env.NEXT_PUBLIC_APPLICATION_ID;
const apiKey = process.env.MORALIS_API_KEY;
const masterKey = process.env.MASTER_KEY;
const chainId = process.env.CHAIN_ID;
const webhookUrl = process.env.WEBHOOK_URL
const eventEmitterAddress =
  contractAddress["EventEmitter"][chainId][
    contractAddress["EventEmitter"][chainId].length - 1
  ];
const vehicleNftAddress =
  contractAddress["VehicleNft"][chainId][
    contractAddress["VehicleNft"][chainId].length - 1
  ];
/* streams */
async function main() {
    await Moralis.default.start({
        apiKey: apiKey
    });

    // nftMinted
    const nftMintOpt = {
        chains: [EvmChain.GOERLI],
        description: "LogNftMinted",
        tag: "LogNftMinted",
        abi: nftAbi.abi,
        includeContractLogs: true,
        topic0: ["NftMinted(address,string,uint256)"],
        webhookUrl: webhookUrl
    };

    const nftMintStream = await Moralis.default.Streams.add(nftMintOpt);

    const nftMintId = nftMintStream.toJSON();

    const nftMintRes = await Moralis.default.Streams.addAddress({
        id: nftMintId.id,
        address: vehicleNftAddress,
    })


    // nftBurnedOpt
    const nftBurnedOpt = {
        chains: [EvmChain.GOERLI],
        description: "LogNftBurned",
        tag: "LogNftBurned",
        abi: nftAbi.abi,
        includeContractLogs: true,
        topic0: ["NftBurned(address,uint256)"],
        webhookUrl: webhookUrl
    };

    const nftBurnedStream = await Moralis.default.Streams.add(nftBurnedOpt);

    const nftBurnedId = nftBurnedStream.toJSON();

    const nftBurnedRes = await Moralis.default.Streams.addAddress({
        id: nftBurnedId.id,
        address: vehicleNftAddress,
    })

    console.log(nftBurnedRes);


    // nftTransferred
    const nftTransferredOpt = {
        chains: [EvmChain.GOERLI],
        description: "LogNftTransferred",
        tag: "LogNftTransferred",
        abi: nftAbi.abi,
        includeContractLogs: true,
        topic0: ["NftTransferred(address,address,uint256)"],
        webhookUrl: webhookUrl
    };

    const nftTransferredStream = await Moralis.default.Streams.add(nftTransferredOpt);

    const nftTransferredId = nftTransferredStream.toJSON();

    const nftTransferredRes = await Moralis.default.Streams.addAddress({
        id: nftTransferredId.id,
        address: vehicleNftAddress,
    })


    // auctionRegistered
    const auctionRegisteredOpt = {
        chains: [EvmChain.GOERLI],
        description: "StateAuctionRegistered",
        tag: "StateAuctionRegistered",
        abi: auctionAbi.abi,
        includeContractLogs: true,
        topic0: ["AuctionRegistered(address,address,address,uint256,uint256)"],
        webhookUrl: webhookUrl
    };

    const auctionRegisteredStream = await Moralis.default.Streams.add(auctionRegisteredOpt);

    const auctionRegisteredId = auctionRegisteredStream.toJSON();

    const auctionRegisteredRes = await Moralis.default.Streams.addAddress({
        id: auctionRegisteredId.id,
        address: eventEmitterAddress,
    })


    // auctionStartedBidding
    const auctionStartedBiddingOpt = {
        chains: [EvmChain.GOERLI],
        description: "StateAuctionStartedBidding",
        tag: "StateAuctionStartedBidding",
        abi: auctionAbi.abi,
        includeContractLogs: true,
        topic0: ["AuctionStartedBidding(address,address,address,uint256,uint256,uint256,uint256,uint256)"],
        webhookUrl: webhookUrl
    };

    const auctionStartedBiddingStream = await Moralis.default.Streams.add(auctionStartedBiddingOpt);

    const auctionStartedBiddingId = auctionStartedBiddingStream.toJSON();

    const auctionStartedBiddingRes = await Moralis.default.Streams.addAddress({
        id: auctionStartedBiddingId.id,
        address: eventEmitterAddress,
    })


    // auctionVerifyingWinner
    const auctionVerifyingWinnerOpt = {
        chains: [EvmChain.GOERLI],
        description: "StateAuctionVerifyingWinner",
        tag: "StateAuctionVerifyingWinner",
        abi: auctionAbi.abi,
        includeContractLogs: true,
        topic0: ["AuctionVerifyingWinner(address,address,address,uint256,address,uint256,uint256,uint256,uint256)"],
        webhookUrl: webhookUrl
    };

    const auctionVerifyingWinnerStream = await Moralis.default.Streams.add(auctionVerifyingWinnerOpt);

    const auctionVerifyingWinerId = auctionVerifyingWinnerStream.toJSON();

    const auctionVerifyingWinnerRes = await Moralis.default.Streams.addAddress({
        id: auctionVerifyingWinerId.id,
        address: eventEmitterAddress,
    })


    // auctionPendingAudit
    const auctionPendingAuditOpt = {
        chains: [EvmChain.GOERLI],
        description: "StateAuctionPendingAudit",
        tag: "StateAuctionPendingAudit",
        abi: auctionAbi.abi,
        includeContractLogs: true,
        topic0: ["AuctionPendingAudit(address,address,uint256,address,address,uint256,uint256)"],
        webhookUrl: webhookUrl
    };

    const auctionPendingAuditStream = await Moralis.default.Streams.add(auctionPendingAuditOpt);

    const auctionPendingAuditId = auctionPendingAuditStream.toJSON();

    const auctionPendingAuditRes = await Moralis.default.Streams.addAddress({
        id: auctionPendingAuditId.id,
        address: eventEmitterAddress,
    })


    // auctionPendingPayment
    const auctionPendingPaymentOpt = {
        chains: [EvmChain.GOERLI],
        description: "StateAuctionPendingPayment",
        tag: "StateAuctionPendingPayment",
        abi: auctionAbi.abi,
        includeContractLogs: true,
        topic0: ["AuctionPendingPayment(address,address,address,uint256,address,uint256,uint256,uint256)"],
        webhookUrl: webhookUrl
    };

    const auctionPendingPaymentStream = await Moralis.default.Streams.add(auctionPendingPaymentOpt);

    const auctionPendingPaymentId = auctionPendingPaymentStream.toJSON();

    const auctionPendingPaymentRes = await Moralis.default.Streams.addAddress({
        id: auctionPendingPaymentId.id,
        address: eventEmitterAddress,
    })


    // auctionAuditResult
    const auctionAuditResultOpt = {
        chains: [EvmChain.GOERLI],
        description: "LogAuctionAuditResult",
        tag: "LogAuctionAuditResult",
        abi: auctionAbi.abi,
        includeContractLogs: true,
        topic0: ["AuctionAuditResult(address,address,address,uint256,address,uint256,uint256,bool)"],
        webhookUrl: webhookUrl
    };

    const auctionAuditResultStream = await Moralis.default.Streams.add(auctionAuditResultOpt);

    const auctionAuditResultId = auctionAuditResultStream.toJSON();

    const auctionAuditResultRes = await Moralis.default.Streams.addAddress({
        id: auctionAuditResultId.id,
        address: eventEmitterAddress,
    })


    // auctionClosed
    const auctionClosedOpt = {
        chains: [EvmChain.GOERLI],
        description: "StateAuctionClosed",
        tag: "StateAuctionClosed",
        abi: auctionAbi.abi,
        includeContractLogs: true,
        topic0: ["AuctionClosed(address,address,address,uint256,uint256,address,uint256,uint8)"],
        webhookUrl: webhookUrl
    };

    const auctionClosedStream = await Moralis.default.Streams.add(auctionClosedOpt);

    const auctionClosedId = auctionClosedStream.toJSON();

    const auctionClosedRes = await Moralis.default.Streams.addAddress({
        id: auctionClosedId.id,
        address: eventEmitterAddress,
    })


    // auctionDepositPlaced
    const auctionDepositPlacedOpt = {
        chains: [EvmChain.GOERLI],
        description: "LogAuctionDepositPlaced",
        tag: "LogAuctionDepositPlaced",
        abi: auctionAbi.abi,
        includeContractLogs: true,
        topic0: ["AuctionDepositPlaced(address,address,uint256,address,uint256,uint256)"],
        webhookUrl: webhookUrl
    };

    const auctionDepositPlacedStream = await Moralis.default.Streams.add(auctionDepositPlacedOpt);

    const auctionDepositPlacedId = auctionDepositPlacedStream.toJSON();

    const auctionDepositPlacedRes = await Moralis.default.Streams.addAddress({
        id: auctionDepositPlacedId.id,
        address: eventEmitterAddress,
    })


    // auctionDepositRetrieved
    const auctionDepositRetrievedOpt = {
        chains: [EvmChain.GOERLI],
        description: "LogAuctionDepositRetrieved",
        tag: "LogAuctionDepositRetrieved",
        abi: auctionAbi.abi,
        includeContractLogs: true,
        topic0: ["AuctionDepositRetrieved(address,address,uint256,address,uint256,uint256)"],
        webhookUrl: webhookUrl
    };

    const auctionDepositRetrievedStream = await Moralis.default.Streams.add(auctionDepositRetrievedOpt);

    const auctionDepositRetrievedId = auctionDepositRetrievedStream.toJSON();

    const auctionDepositRetrievedRes = await Moralis.default.Streams.addAddress({
        id: auctionDepositRetrievedId.id,
        address: eventEmitterAddress,
    })


    // auctionBidPlaced
    const auctionBidPlacedOpt = {
        chains: [EvmChain.GOERLI],
        description: "LogAuctionBidPlaced",
        tag: "LogAuctionBidPlaced",
        abi: auctionAbi.abi,
        includeContractLogs: true,
        topic0: ["AuctionBidPlaced(address,address,uint256,address,uint256,uint256)"],
        webhookUrl: webhookUrl
    };

    const auctionBidPlacedStream = await Moralis.default.Streams.add(auctionBidPlacedOpt);

    const auctionBidPlacedId = auctionBidPlacedStream.toJSON();

    const auctionBidPlacedRes = await Moralis.default.Streams.addAddress({
        id: auctionBidPlacedId.id,
        address: eventEmitterAddress,
    })


    // auctionFullSettlementPaid
    const auctionFullSettlementPaidOpt = {
        chains: [EvmChain.GOERLI],
        description: "LogAuctionFullSettlementPaid",
        tag: "LogAuctionFullSettlementPaid",
        abi: auctionAbi.abi,
        includeContractLogs: true,
        topic0: ["AuctionFullSettlementPaid(address,address,uint256,address,address,uint256,uint256)"],
        webhookUrl: webhookUrl
    };

    const auctionFullSettlementPaidStream = await Moralis.default.Streams.add(auctionFullSettlementPaidOpt);

    const auctionFullSettlementPaidId = auctionFullSettlementPaidStream.toJSON();

    const auctionFullSettlementPaidRes = await Moralis.default.Streams.addAddress({
        id: auctionFullSettlementPaidId.id,
        address: eventEmitterAddress,
    })


    // pendingSellerEarningsRetrieval
    const  pendingSellerEarningRetrievalOpt = {
        chains: [EvmChain.GOERLI],
        description: "ListPendingSellerEarningsRetrieval",
        tag: "ListPendingSellerEarningsRetrieval",
        abi: auctionAbi.abi,
        includeContractLogs: true,
        topic0: ["PendingSellerEarningsRetrieval(address,address,uint256,address,uint256)"],
        webhookUrl: webhookUrl
    };

    const pendingSellerEarningsRetrievalStream = await Moralis.default.Streams.add(pendingSellerEarningRetrievalOpt);

    const pendingSellerEarningsRetrievalId = pendingSellerEarningsRetrievalStream.toJSON();

    const pendingSellerEarningsRetrievalRes = await Moralis.default.Streams.addAddress({
        id: pendingSellerEarningsRetrievalId.id,
        address: eventEmitterAddress,
    })


    // sellerEarningsRetrieved
    const  sellerEarningsRetrievedOpt = {
        chains: [EvmChain.GOERLI],
        description: "LogSellerEarningsRetrieved",
        tag: "LogSellerEarningsRetrieved",
        abi: auctionAbi.abi,
        includeContractLogs: true,
        topic0: ["SellerEarningsRetrieved(address,address,uint256,address,uint256,uint256)"],
        webhookUrl: webhookUrl
    };

    const sellerEarningsRetrievedStream = await Moralis.default.Streams.add(sellerEarningsRetrievedOpt);

    const sellerEarningsRetrievedId = sellerEarningsRetrievedStream.toJSON();

    const sellerEarningsRetrievedRes = await Moralis.default.Streams.addAddress({
        id: sellerEarningsRetrievedId.id,
        address: eventEmitterAddress,
    })


    // pendingWinnerPaymentRefund
    const  pendingWinnerPaymentRefundOpt = {
        chains: [EvmChain.GOERLI],
        description: "ListPendingWinnerPaymentRefund",
        tag: "ListPendingWinnerPaymentRefund",
        abi: auctionAbi.abi,
        includeContractLogs: true,
        topic0: ["PendingWinnerPaymentRefund(address,address,uint256,address,uint256)"],
        webhookUrl: webhookUrl
    };

    const pendingWinnerPaymentRefundStream = await Moralis.default.Streams.add(pendingWinnerPaymentRefundOpt);

    const pendingWinnerPaymentRefundId = pendingWinnerPaymentRefundStream.toJSON();

    const pendingWinnerPaymentRefundRes = await Moralis.default.Streams.addAddress({
        id: pendingWinnerPaymentRefundId.id,
        address: eventEmitterAddress,
    })


    // winnerPaymentRefunded
    const  winnerPaymentRefundedOpt = {
        chains: [EvmChain.GOERLI],
        description: "LogWinnerPaymentRefunded",
        tag: "LogWinnerPaymentRefunded",
        abi: auctionAbi.abi,
        includeContractLogs: true,
        topic0: ["WinnerPaymentRefunded(address,address,uint256,address,uint256,uint256)"],
        webhookUrl: webhookUrl
    };

    const winnerPaymentRefundedStream = await Moralis.default.Streams.add(winnerPaymentRefundedOpt);

    const winnerPaymentRefundedId = winnerPaymentRefundedStream.toJSON();

    const winnerPaymentRefundedRes = await Moralis.default.Streams.addAddress({
        id: winnerPaymentRefundedId.id,
        address: eventEmitterAddress,
    }) 


    // platformEarnings
    const  platformEarningsOpt = {
        chains: [EvmChain.GOERLI],
        description: "LogPlatformEarnings",
        tag: "LogPlatformEarnings",
        abi: auctionAbi.abi,
        includeContractLogs: true,
        topic0: ["PlatformEarnings(address,address,address,uint8,uint256)"],
        webhookUrl: webhookUrl
    };

    const platformEarningsStream = await Moralis.default.Streams.add(platformEarningsOpt);

    const platformEarningsId = platformEarningsStream.toJSON();

    const platformEarningsRes = await Moralis.default.Streams.addAddress({
        id: platformEarningsId.id,
        address: eventEmitterAddress,
    }) 



    /*
    console.log(nftMintRes &&
        nftBurnedRes && 
        nftTransferredRes && 
        auctionRegisteredRes && 
        auctionStartedBiddingRes && 
        auctionVerifyingWinnerRes && 
        auctionPendingAuditRes && 
        auctionPendingPaymentRes && 
        auctionAuditResultRes &&
        auctionClosedRes &&
        auctionDepositPlacedRes &&
        auctionDepositRetrievedRes &&
        auctionBidPlacedRes &&
        auctionFullSettlementPaidRes &&
        pendingSellerEarningsRetrievalRes &&
        sellerEarningsRetrievedRes &&
        pendingWinnerPaymentRefundRes &&
        winnerPaymentRefundedRes &&
        platformEarningsRes
    );
    */
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
