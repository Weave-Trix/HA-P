/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-var-requires */
declare const Parse: any;
import './generated/evmApi';
import './generated/solApi';
import { requestMessage } from '../auth/authService';

Parse.Cloud.define('requestMessage', async ({ params }: any) => {
  const { address, chain, networkType } = params;

  const message = await requestMessage({
    address,
    chain,
    networkType,
  });

  return { message };
});

Parse.Cloud.define('getPluginSpecs', () => {
  // Not implemented, only excists to remove client-side errors when using the moralis-v1 package
  return [];
});

Parse.Cloud.define('getServerTime', () => {
  // Not implemented, only excists to remove client-side errors when using the moralis-v1 package
  return null;
});

// when deposit placed, append array depositPlaced
Parse.Cloud.afterSave("LogauctiondepositplacedLogs", async (request : any) => {
  const confirmed = request.object.get("confirmed");
  //const logger = Parse.Cloud.getLogger();
  //logger.info("Looking for confirmed LogAuctionDepositPlaced transaction...");
  if (!confirmed) {
    //logger.info("Item fetched!");
    // query ListAuctionRecords, append array depositPlaced
    const ListAuctionRecords = Parse.Object.extend("ListAuctionRecords");
    const query = new Parse.Query(ListAuctionRecords);
    query.equalTo("auctionAddress", request.object.get("auction"));
    query.equalTo("nftAddress", request.object.get("nftAddress"));
    query.equalTo("tokenId", request.object.get("tokenId"));
    const col_LBR = await query.first();
    col_LBR.add("depositPlaced", request.object.get("bidder"));
    //logger.info(`------Updated ${col_LBR} listAuctionRecords------`);
    await col_LBR.save();
    //logger.info("------Successfully saved!------");
  }
});


// when deposit withdrawn, remove from array depositPlaced
Parse.Cloud.afterSave("LogauctiondepositretrievedLogs", async (request : any) => {
  const confirmed = request.object.get("confirmed");
  //const logger = Parse.Cloud.getLogger();
  //logger.info(
   // "Looking for confirmed LogAuctionDepositRetrieved transaction..."
  //);
  if (!confirmed) {
    //logger.info("Item fetched!");
    // query ListAuctionRecords, remove from array depositPlaced
    const ListAuctionRecords = Parse.Object.extend("ListAuctionRecords");
    const query = new Parse.Query(ListAuctionRecords);
    query.equalTo("auctionAddress", request.object.get("auction"));
    query.equalTo("nftAddress", request.object.get("nftAddress"));
    query.equalTo("tokenId", request.object.get("tokenId"));
    const col_LBR = await query.first();
    col_LBR.remove("depositPlaced", request.object.get("bidder"));
    //logger.info(`------Updated ${col_LBR} listAuctionRecords------`);
    await col_LBR.save();
    //logger.info("------Successfully saved!------");
  }
});


// when auction closed, update auction state to 5
Parse.Cloud.afterSave("StateauctionclosedLogs", async (request : any) => {
  const confirmed = request.object.get("confirmed");
  //const logger = Parse.Cloud.getLogger();
  //logger.info("Looking for confirmed StateAuctionClosed transaction...");
  if (!confirmed) {
    //logger.info("Item fetched!");
    // query ListAuctionRecords, set currState to 1
    const ListAuctionRecords = Parse.Object.extend("ListAuctionRecords");
    const query = new Parse.Query(ListAuctionRecords);
    query.equalTo("auctionAddress", request.object.get("auction"));
    query.equalTo("nftAddress", request.object.get("nftAddress"));
    query.equalTo("tokenId", request.object.get("tokenId"));
    const col_LAR = await query.first();
    //logger.info(`Auction Closed: ${col_LAR}`);
    col_LAR.set("currState", 5);
    //logger.info(`------Updated ${col_LAR} listAuctionRecords------`);
    //logger.info("Saving...");
    await col_LAR.save();
    //logger.info("------Successfully saved!------");
  }
});


// when auction pending audit, update auction state to 4
Parse.Cloud.afterSave("StateauctionpendingauditLogs", async (request : any) => {
  const confirmed = request.object.get("confirmed");
  //const logger = Parse.Cloud.getLogger();
  //logger.info("Looking for confirmed StateAuctionPendingAudit transaction...");
  if (!confirmed) {
    //logger.info("Item fetched!");
    // query ListAuctionRecords, set currState to 1
    const ListAuctionRecords = Parse.Object.extend("ListAuctionRecords");
    const query = new Parse.Query(ListAuctionRecords);
    query.equalTo("auctionAddress", request.object.get("auction"));
    query.equalTo("nftAddress", request.object.get("nftAddress"));
    query.equalTo("tokenId", request.object.get("tokenId"));
    const col_LAR = await query.first();
    //logger.info(`Auction Pending Audit: ${col_LAR}`);
    col_LAR.set("currState", 4);
    //logger.info(`------Updated ${col_LAR} listAuctionRecords------`);
    //logger.info("Saving...");
    await col_LAR.save();
    //logger.info("------Successfully saved!------");
  }
});


// when auction pending payment, update auction state to 3
Parse.Cloud.afterSave("StateauctionpendingpaymentLogs", async (request : any) => {
  const confirmed = request.object.get("confirmed");
  //const logger = Parse.Cloud.getLogger();
  //logger.info(
   // "Looking for confirmed StateAuctionPendingPayment transaction..."
  //);
  if (!confirmed) {
    //logger.info("Item fetched!");
    // query ListAuctionRecords, set currState to 1
    const ListAuctionRecords = Parse.Object.extend("ListAuctionRecords");
    const query = new Parse.Query(ListAuctionRecords);
    query.equalTo("auctionAddress", request.object.get("auction"));
    query.equalTo("nftAddress", request.object.get("nftAddress"));
    query.equalTo("tokenId", request.object.get("tokenId"));
    const col_LAR = await query.first();
    //logger.info(`Auction Pending Payment: ${col_LAR}`);
    col_LAR.set("currState", 3);
    //logger.info(`------Updated ${col_LAR} listAuctionRecords------`);
    //logger.info("Saving...");
    await col_LAR.save();
    //logger.info("------Successfully saved!------");
  }
});


// auction state 0:registered, 1:bidding, 2:verifyingWinner, 3: pendingPayment, 4: pendingAudit, 5: auctionClosed

// when auction registered, update auction state to 0
Parse.Cloud.afterSave("StateauctionregisteredLogs", async (request : any) => {
  const confirmed = request.object.get("confirmed");
  //const logger = Parse.Cloud.getLogger();
  //logger.info("Looking for confirmed StateAuctionRegistered transaction...");
  if (!confirmed) {
    //logger.info("Item fetched!");
    // create ListAuctionRecords, set currState to 0
    const ListAuctionRecords = Parse.Object.extend("ListAuctionRecords");
    const listAuctionRecords = new ListAuctionRecords();
    listAuctionRecords.set("auctionAddress", request.object.get("auction"));
    listAuctionRecords.set("nftAddress", request.object.get("nftAddress"));
    listAuctionRecords.set("tokenId", request.object.get("tokenId"));
    listAuctionRecords.set("currState", 0);
    listAuctionRecords.set("depositPlaced", []);
    listAuctionRecords.set("seller", request.object.get("seller"));
    //logger.info(
     // `------Added ${request.object.get("auction")} listAuctionRecords------`
    //);
    //logger.info("Saving...");
    await listAuctionRecords.save();
    //logger.info("------Successfully saved!------");
  }
});


Parse.Cloud.afterSave("StateauctionstartedbiddingLogs", async (request : any) => {
  const confirmed = request.object.get("confirmed");
  //const logger = Parse.Cloud.getLogger();
  //logger.info(
   // "ListAuctionRecords looking for confirmed StateAuctionStartedBidding transaction..."
  //);
  if (!confirmed) {
    // when auction started bidding, update auction state to 1
    //logger.info("Item fetched!");
    // query ListAuctionRecords, set currState to 1
    const ListAuctionRecords = Parse.Object.extend("ListAuctionRecords");
    const query = new Parse.Query(ListAuctionRecords);
    query.equalTo("auctionAddress", request.object.get("auction"));
    query.equalTo("nftAddress", request.object.get("nftAddress"));
    query.equalTo("tokenId", request.object.get("tokenId"));
    const col_LAR = await query.first();
    //logger.info(`Auction Started Bidding: ${col_LAR}`);
    if (col_LAR) {
      col_LAR.set("currState", 1);
      //logger.info(`------Updated ${col_LAR} listAuctionRecords------`);
      //logger.info("Saving...");
      await col_LAR.save();
      //logger.info("------Successfully saved!------");
    }
  }
});


Parse.Cloud.afterSave("StateauctionverifyingwinnerLogs", async (request : any) => {
  const confirmed = request.object.get("confirmed");
  //const logger = Parse.Cloud.getLogger();
  //logger.info(
  //  "Looking for confirmed StateAuctionVerifyingWinner transaction..."
  //);
  if (!confirmed) {
    // when auction verifying winner, update auction state to 2
    //logger.info("Item fetched!");
    // query ListAuctionRecords, set currState to 1
    const ListAuctionRecords = Parse.Object.extend("ListAuctionRecords");
    const query = new Parse.Query(ListAuctionRecords);
    query.equalTo("auctionAddress", request.object.get("auction"));
    query.equalTo("nftAddress", request.object.get("nftAddress"));
    query.equalTo("tokenId", request.object.get("tokenId"));
    const col_LAR = await query.first();
    //logger.info(`Auction Verifying Winner: ${col_LAR}`);
    col_LAR.set("currState", 2);
    //logger.info(`------Updated ${col_LAR} listAuctionRecords------`);
    //logger.info("Saving...");
    await col_LAR.save();
    //logger.info("------Successfully saved!------");
  }
});


Parse.Cloud.afterSave("LognftmintedLogs", async (request : any) => {
  const confirmed = request.object.get("confirmed");
  //const logger = Parse.Cloud.getLogger();
  //logger.info("Looking for confirmed LogNftMinted transaction...");
  if (!confirmed) {
    //logger.info("Item fetched!");
    const ListNftRecords = Parse.Object.extend("ListNftRecords");

    const listNftRecords = new ListNftRecords();
    listNftRecords.set("nftAddress", request.object.get("address"));
    listNftRecords.set("tokenId", request.object.get("tokenId"));
    listNftRecords.set("tokenURI", request.object.get("tokenURI"));
    listNftRecords.set("owner", request.object.get("owner"));
    listNftRecords.set("active", true);
    //logger.info(
     // `Adding nft token id: ${request.object.get(
     //   "tokenId"
      //)}. Owner: ${request.object.get("owner")}`
    //);
    //logger.info("Saving...");
    await listNftRecords.save();
    //logger.info("-------Succesfully saved!-------");
  }
});

Parse.Cloud.afterSave("LognftburnedLogs", async (request : any) => {
  const confirmed = request.object.get("confirmed");
  //const logger = Parse.Cloud.getLogger();
  //logger.info("Looking for confirmed LogNftBurned transaction...");
  if (!confirmed) {
    //logger.info("Item fetched!");
    const ListNftRecords = Parse.Object.extend("ListNftRecords");
    const query = new Parse.Query(ListNftRecords);
    query.equalTo("tokenId", request.object.get("tokenId"));
    query.equalTo("owner", request.object.get("owner"));
    const burnedNft = await query.first();
   // logger.info(`NftBurned: ${burnedNft}`);
    if (burnedNft) {
      burnedNft.set("active", false);
      //logger.info(
       // `------Changed Token ${request.object.get(
       //   "tokenId"
       // )} status to inactive.------`
     // );
      await burnedNft.save();
    }
  }
});

Parse.Cloud.afterSave("LognfttransferredLogs", async (request : any) => {
    const confirmed = request.object.get("confirmed");
    //const logger = Parse.Cloud.getLogger();
    //logger.info("Looking for confirmed LogNftTransferred transaction...");
    if (!confirmed) {
     // logger.info("Item fetched!");
      const ListNftRecords = Parse.Object.extend("ListNftRecords");
      const query = new Parse.Query(ListNftRecords);
      query.equalTo("tokenId", request.object.get("tokenId"));
      query.equalTo("owner", request.object.get("prev_Owner"));
      const transferredNft = await query.first();
      //logger.info(`NftBurned: ${query.first()}`);
      if (transferredNft) {
        transferredNft.set("owner", request.object.get("curr_Owner"));
        //logger.info(
        //  `------Changed Owner of ${request.object.get("tokenId")} to ${request.object.get(
         //   "curr_Owner"
         // )}------`
        //);
        await transferredNft.save();
      }
    }
  });


  Parse.Cloud.afterSave("LogwinnerpaymentrefundedLogs", async (request : any) => {
    const confirmed = request.object.get("confirmed");
    //const logger = Parse.Cloud.getLogger();
    //logger.info("Looking for confirmed LogWinnerPaymentRefunded transaction...");
    if (!confirmed) {
      //logger.info("Item fetched!");
      const ListPendingWinnerPaymentRefund = Parse.Object.extend("ListpendingwinnerpaymentrefundLogs");
      const query = new Parse.Query(ListPendingWinnerPaymentRefund);
      query.equalTo("tokenId", request.object.get("tokenId"));
      query.equalTo("auction", request.object.get("auction"));
      const refundedWinnerAucs = await query.first();
      //logger.info(`Refunded Auction: ${refundedWinnerAucs}`);
      if (refundedWinnerAucs) {
        refundedWinnerAucs.destroy().then(() => {
            //logger.info(`Refunded! Removed pending refund from ListPendingWinnerPaymentRefund`);
        }, (error : any) => {
            console.log(error);
        });
    
        await refundedWinnerAucs.save();
      }
    }
  });


  Parse.Cloud.afterSave("LogsellerearningsretrievalLogs", async (request : any) => {
    const confirmed = request.object.get("confirmed");
    //const logger = Parse.Cloud.getLogger();
    //logger.info("Looking for confirmed LogSellerEarningsRetrieved transaction...");
    if (!confirmed) {
     // logger.info("Item fetched!");
      const ListPendingSellerEarningsRetrieval = Parse.Object.extend("ListpendingsellerearningsretrievalLogs");
      const query = new Parse.Query(ListPendingSellerEarningsRetrieval);
      query.equalTo("tokenId", request.object.get("tokenId"));
      query.equalTo("auction", request.object.get("auction"));
      const retrievedEarningsAucs = await query.first();
     // logger.info(`Retrieved Earnings Auction: ${retrievedEarningsAucs}`);
      if (retrievedEarningsAucs) {
        retrievedEarningsAucs.destroy().then(() => {
           // logger.info(`Refunded! Removed pending refund from ListPendingWinnerPaymentRefund`);
        }, (error : any) => {
            console.log(error);
        });
    
        await retrievedEarningsAucs.save();
      }
    }
  });