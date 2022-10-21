require("dotenv").config();
const { Moralis } = require("moralis-v1/node");
const contractAddress = require("../constants/contractAddresses.json");

const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
const appId = process.env.NEXT_PUBLIC_APPLICATION_ID;
const masterKey = process.env.MASTER_KEY;
let chainId = process.env.CHAIN_ID;
const eventEmitterAddress =
  contractAddress["EventEmitter"][chainId][
    contractAddress["EventEmitter"][chainId].length - 1
  ];
const vehicleNftAddress =
  contractAddress["VehicleNft"][chainId][
    contractAddress["VehicleNft"][chainId].length - 1
  ];

async function main() {
  await Moralis.start({ serverUrl, appId, masterKey });
  console.log(`Moralis connected to EventEmitter => ${contractAddress}`);

  let nftMintedOpt = {
    address: vehicleNftAddress,
    chainId: chainId,
    sync_historical: true,
    topic: "NftMinted(address,string,uint256)",
    abi: {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "owner",
          type: "address",
        },
        {
          indexed: false,
          internalType: "string",
          name: "tokenURI",
          type: "string",
        },
        {
          indexed: true,
          internalType: "uint256",
          name: "tokenId",
          type: "uint256",
        },
      ],
      name: "NftMinted",
      type: "event",
    },
    tableName: "LogNftMinted",
  };

  let nftBurnedOpt = {
    address: vehicleNftAddress,
    chainId: chainId,
    sync_historical: true,
    topic: "NftBurned(address,uint256)",
    abi: {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "owner",
          type: "address",
        },
        {
          indexed: true,
          internalType: "uint256",
          name: "tokenId",
          type: "uint256",
        },
      ],
      name: "NftBurned",
      type: "event",
    },
    tableName: "LogNftBurned",
  };

  let nftTransferredOpt = {
    address: vehicleNftAddress,
    chainId: chainId,
    sync_historical: true,
    topic: "NftTransferred(address,address,uint256)",
    abi: {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "prev_Owner",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "curr_Owner",
          type: "address",
        },
        {
          indexed: true,
          internalType: "uint256",
          name: "tokenId",
          type: "uint256",
        },
      ],
      name: "NftTransferred",
      type: "event",
    },
    tableName: "LogNftTransferred",
  };

  let auctionRegisteredOpt = {
    address: eventEmitterAddress,
    chainId: chainId,
    sync_historical: true,
    topic: "AuctionRegistered(address,address,address,uint256,uint256)",
    abi: {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "auction",
          type: "address",
        },
        {
          indexed: false,
          internalType: "address",
          name: "seller",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "nftAddress",
          type: "address",
        },
        {
          indexed: true,
          internalType: "uint256",
          name: "tokenId",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "registerTime",
          type: "uint256",
        },
      ],
      name: "AuctionRegistered",
      type: "event",
    },
    tableName: "StateAuctionRegistered",
  };

  let auctionStartedBiddingOpt = {
    address: eventEmitterAddress,
    chainId: chainId,
    sync_historical: true,
    topic:
      "AuctionStartedBidding(address,address,address,uint256,uint256,uint256,uint256,uint256)",
    abi: {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "auction",
          type: "address",
        },
        {
          indexed: false,
          internalType: "address",
          name: "seller",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "nftAddress",
          type: "address",
        },
        {
          indexed: true,
          internalType: "uint256",
          name: "tokenId",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "depositWei",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "bidStartTime",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "bidEndTime",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "startingBid",
          type: "uint256",
        },
      ],
      name: "AuctionStartedBidding",
      type: "event",
    },
    tableName: "StateAuctionStartedBidding",
  };

  let auctionVerifyingWinnerOpt = {
    address: eventEmitterAddress,
    chainId: chainId,
    sync_historical: true,
    topic:
      "AuctionVerifyingWinner(address,address,address,uint256,address,uint256,uint256,uint256,uint256)",
    abi: {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "auction",
          type: "address",
        },
        {
          indexed: false,
          internalType: "address",
          name: "seller",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "nftAddress",
          type: "address",
        },
        {
          indexed: true,
          internalType: "uint256",
          name: "tokenId",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "address",
          name: "winner",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "winningBid",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "platformCharge",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "startTime",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "endTime",
          type: "uint256",
        },
      ],
      name: "AuctionVerifyingWinner",
      type: "event",
    },
    tableName: "StateAuctionVerifyingWinner",
  };

  let auctionPendingAuditOpt = {
    address: eventEmitterAddress,
    chainId: chainId,
    sync_historical: true,
    topic:
      "AuctionPendingAudit(address,address,uint256,address,address,uint256,uint256)",
    abi: {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "auction",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "nftAddress",
          type: "address",
        },
        {
          indexed: true,
          internalType: "uint256",
          name: "tokenId",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "address",
          name: "winner",
          type: "address",
        },
        {
          indexed: false,
          internalType: "address",
          name: "seller",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "paidAmount",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "paidTime",
          type: "uint256",
        },
      ],
      name: "AuctionPendingAudit",
      type: "event",
    },
    tableName: "StateAuctionPendingAudit",
  };

  let auctionPendingPaymentOpt = {
    address: eventEmitterAddress,
    chainId: chainId,
    sync_historical: true,
    topic:
      "AuctionPendingPayment(address,address,address,uint256,address,uint256,uint256,uint256)",
    abi: {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "auction",
          type: "address",
        },
        {
          indexed: false,
          internalType: "address",
          name: "seller",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "nftAddress",
          type: "address",
        },
        {
          indexed: true,
          internalType: "uint256",
          name: "tokenId",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "address",
          name: "winner",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "winningBid",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "startTime",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "endTime",
          type: "uint256",
        },
      ],
      name: "AuctionPendingPayment",
      type: "event",
    },
    tableName: "StateAuctionPendingPayment",
  };

  let auctionAuditResultOpt = {
    address: eventEmitterAddress,
    chainId: chainId,
    sync_historical: true,
    topic:
      "AuctionAuditResult(address,address,address,uint256,address,uint256,uint256,bool)",
    abi: {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "auction",
          type: "address",
        },
        {
          indexed: false,
          internalType: "address",
          name: "seller",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "nftAddress",
          type: "address",
        },
        {
          indexed: true,
          internalType: "uint256",
          name: "tokenId",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "address",
          name: "winner",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "winningBid",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "time",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "bool",
          name: "pass",
          type: "bool",
        },
      ],
      name: "AuctionAuditResult",
      type: "event",
    },
    tableName: "LogAuctionAuditResult",
  };

  let auctionClosedOpt = {
    address: eventEmitterAddress,
    chainId: chainId,
    sync_historical: true,
    topic:
      "AuctionClosed(address,address,address,uint256,uint256,address,uint256,uint8)",
    abi: {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "auction",
          type: "address",
        },
        {
          indexed: false,
          internalType: "address",
          name: "seller",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "nftAddress",
          type: "address",
        },
        {
          indexed: true,
          internalType: "uint256",
          name: "tokenId",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "closeTime",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "address",
          name: "winner",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "winningBid",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "enum Constants.AuctionEndState",
          name: "endState",
          type: "uint8",
        },
      ],
      name: "AuctionClosed",
      type: "event",
    },
    tableName: "StateAuctionClosed",
  };

  let auctionDepositPlacedOpt = {
    address: eventEmitterAddress,
    chainId: chainId,
    sync_historical: true,
    topic:
      "AuctionDepositPlaced(address,address,uint256,address,uint256,uint256)",
    abi: {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "auction",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "nftAddress",
          type: "address",
        },
        {
          indexed: true,
          internalType: "uint256",
          name: "tokenId",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "address",
          name: "bidder",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "depositAmount",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "depositTime",
          type: "uint256",
        },
      ],
      name: "AuctionDepositPlaced",
      type: "event",
    },
    tableName: "LogAuctionDepositPlaced",
  };

  let auctionDepositRetrievedOpt = {
    address: eventEmitterAddress,
    chainId: chainId,
    sync_historical: true,
    topic:
      "AuctionDepositRetrieved(address,address,uint256,address,uint256,uint256)",
    abi: {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "auction",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "nftAddress",
          type: "address",
        },
        {
          indexed: true,
          internalType: "uint256",
          name: "tokenId",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "address",
          name: "bidder",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "retrieveAmount",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "retrievalTime",
          type: "uint256",
        },
      ],
      name: "AuctionDepositRetrieved",
      type: "event",
    },
    tableName: "LogAuctionDepositRetrieved",
  };

  let auctionBidPlacedOpt = {
    address: eventEmitterAddress,
    chainId: chainId,
    sync_historical: true,
    topic: "AuctionBidPlaced(address,address,uint256,address,uint256,uint256)",
    abi: {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "auction",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "nftAddress",
          type: "address",
        },
        {
          indexed: true,
          internalType: "uint256",
          name: "tokenId",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "address",
          name: "bidder",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "bidAmount",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "bidTime",
          type: "uint256",
        },
      ],
      name: "AuctionBidPlaced",
      type: "event",
    },
    tableName: "LogAuctionBidPlaced",
  };

  let auctionFullSettlementPaidOpt = {
    address: eventEmitterAddress,
    chainId: chainId,
    sync_historical: true,
    topic:
      "AuctionFullSettlementPaid(address,address,uint256,address,address,uint256,uint256)",
    abi: {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "auction",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "nftAddress",
          type: "address",
        },
        {
          indexed: true,
          internalType: "uint256",
          name: "tokenId",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "address",
          name: "winner",
          type: "address",
        },
        {
          indexed: false,
          internalType: "address",
          name: "seller",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "paidAmount",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "paidTime",
          type: "uint256",
        },
      ],
      name: "AuctionFullSettlementPaid",
      type: "event",
    },
    tableName: "LogAuctionFullSettlementPaid",
  };

  let pendingSellerEarningsRetrievalOpt = {
    address: eventEmitterAddress,
    chainId: chainId,
    sync_historical: true,
    topic:
      "PendingSellerEarningsRetrieval(address,address,uint256,address,uint256)",
    abi: {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "auction",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "nftAddress",
          type: "address",
        },
        {
          indexed: true,
          internalType: "uint256",
          name: "tokenId",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "address",
          name: "seller",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "highestBid",
          type: "uint256",
        },
      ],
      name: "PendingSellerEarningsRetrieval",
      type: "event",
    },
    tableName: "ListPendingSellerEarningsRetrieval",
  };

  let sellerEarningsRetrievedOpt = {
    address: eventEmitterAddress,
    chainId: chainId,
    sync_historical: true,
    topic:
      "SellerEarningsRetrieved(address,address,uint256,address,uint256,uint256)",
    abi: {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "auction",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "nftAddress",
          type: "address",
        },
        {
          indexed: true,
          internalType: "uint256",
          name: "tokenId",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "address",
          name: "seller",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "retrieveAmount",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "retrievalTime",
          type: "uint256",
        },
      ],
      name: "SellerEarningsRetrieved",
      type: "event",
    },
    tableName: "LogSellerEarningsRetrieved",
  };

  let pendingWinnerPaymentRefundOpt = {
    address: eventEmitterAddress,
    chainId: chainId,
    sync_historical: true,
    topic:
      "PendingWinnerPaymentRefund(address,address,uint256,address,uint256)",
    abi: {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "auction",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "nftAddress",
          type: "address",
        },
        {
          indexed: true,
          internalType: "uint256",
          name: "tokenId",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "address",
          name: "winner",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "fullSettlement",
          type: "uint256",
        },
      ],
      name: "PendingWinnerPaymentRefund",
      type: "event",
    },
    tableName: "ListPendingWinnerPaymentRefund",
  };

  let winnerPaymentRefundedOpt = {
    address: eventEmitterAddress,
    chainId: chainId,
    sync_historical: true,
    topic:
      "WinnerPaymentRefunded(address,address,uint256,address,uint256,uint256)",
    abi: {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "auction",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "nftAddress",
          type: "address",
        },
        {
          indexed: true,
          internalType: "uint256",
          name: "tokenId",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "address",
          name: "winner",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "refundAmount",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "retrievalTime",
          type: "uint256",
        },
      ],
      name: "WinnerPaymentRefunded",
      type: "event",
    },
    tableName: "LogWinnerPaymentRefunded",
  };

  let platformEarningsOpt = {
    address: eventEmitterAddress,
    chainId: chainId,
    sync_historical: true,
    topic: "PlatformEarnings(address,address,address,uint8,uint256)",
    abi: {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "address",
          name: "platformOwner",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "payer",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "auction",
          type: "address",
        },
        {
          indexed: true,
          internalType: "enum Constants.PlatformEarnings",
          name: "earningType",
          type: "uint8",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "time",
          type: "uint256",
        },
      ],
      name: "PlatformEarnings",
      type: "event",
    },
    tableName: "LogPlatformEarnings",
  };

  const nftMintedRes = await Moralis.Cloud.run(
    "watchContractEvent",
    nftMintedOpt,
    { useMasterKey: true }
  );

  const nftBurnedRes = await Moralis.Cloud.run(
    "watchContractEvent",
    nftBurnedOpt,
    { useMasterKey: true }
  );

  const nftTransferredRes = await Moralis.Cloud.run(
    "watchContractEvent",
    nftTransferredOpt,
    { useMasterKey: true }
  );

  const auctionRegisteredRes = await Moralis.Cloud.run(
    "watchContractEvent",
    auctionRegisteredOpt,
    { useMasterKey: true }
  );

  const auctionStartedBiddingRes = await Moralis.Cloud.run(
    "watchContractEvent",
    auctionStartedBiddingOpt,
    { useMasterKey: true }
  );

  const auctionVerifyingWinnerRes = await Moralis.Cloud.run(
    "watchContractEvent",
    auctionVerifyingWinnerOpt,
    { useMasterKey: true }
  );

  const auctionPendingPaymentRes = await Moralis.Cloud.run(
    "watchContractEvent",
    auctionPendingPaymentOpt,
    { useMasterKey: true }
  );

  const auctionAuditResultRes = await Moralis.Cloud.run(
    "watchContractEvent",
    auctionAuditResultOpt,
    { useMasterKey: true }
  );

  const auctionClosedRes = await Moralis.Cloud.run(
    "watchContractEvent",
    auctionClosedOpt,
    { useMasterKey: true }
  );

  const auctionDepositPlacedRes = await Moralis.Cloud.run(
    "watchContractEvent",
    auctionDepositPlacedOpt,
    { useMasterKey: true }
  );

  const auctionDepositRetrievedRes = await Moralis.Cloud.run(
    "watchContractEvent",
    auctionDepositRetrievedOpt,
    { useMasterKey: true }
  );

  const auctionBidPlacedRes = await Moralis.Cloud.run(
    "watchContractEvent",
    auctionBidPlacedOpt,
    { useMasterKey: true }
  );

  const auctionFullSettlementPaidRes = await Moralis.Cloud.run(
    "watchContractEvent",
    auctionFullSettlementPaidOpt,
    { useMasterKey: true }
  );

  const sellerEarningsRetrievedRes = await Moralis.Cloud.run(
    "watchContractEvent",
    sellerEarningsRetrievedOpt,
    { useMasterKey: true }
  );

  const winnerPaymentRefundedRes = await Moralis.Cloud.run(
    "watchContractEvent",
    winnerPaymentRefundedOpt,
    { useMasterKey: true }
  );

  const platformEarningsRes = await Moralis.Cloud.run(
    "watchContractEvent",
    platformEarningsOpt,
    { useMasterKey: true }
  );

  const auctionPendingAuditRes = await Moralis.Cloud.run(
    "watchContractEvent",
    auctionPendingAuditOpt,
    { useMasterKey: true }
  );

  const pendingSellerEarningsRetrievalRes = await Moralis.Cloud.run(
    "watchContractEvent",
    pendingSellerEarningsRetrievalOpt,
    { useMasterKey: true }
  );

  const pendingWinnerPaymentRefundRes = await Moralis.Cloud.run(
    "watchContractEvent",
    pendingWinnerPaymentRefundOpt,
    { useMasterKey: true }
  );

  if (
    nftMintedRes.success &&
    nftBurnedRes.success &&
    nftTransferredRes.success &&
    auctionRegisteredRes.success &&
    auctionStartedBiddingRes.success &&
    auctionVerifyingWinnerRes.success &&
    auctionPendingPaymentRes.sucess &&
    auctionAuditResultRes.success &&
    auctionClosedRes.success &&
    auctionDepositPlacedRes.success &&
    auctionDepositRetrievedRes.success &&
    auctionBidPlacedRes.success &&
    auctionFullSettlementPaidRes.success &&
    sellerEarningsRetrievedRes.success &&
    winnerPaymentRefundedRes.success &&
    platformEarningsRes.success &&
    auctionPendingAuditRes.success &&
    pendingSellerEarningsRetrievalRes.success &&
    pendingWinnerPaymentRefundRes.success
  ) {
    console.log(
      "Success -> Moralis Db listener successfully connected to events!"
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
