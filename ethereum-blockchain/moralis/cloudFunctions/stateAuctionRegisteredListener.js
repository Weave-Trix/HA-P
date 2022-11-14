// auction state 0:registered, 1:bidding, 2:verifyingWinner, 3: pendingPayment, 4: pendingAudit, 5: auctionClosed

// when auction registered, update auction state to 0
Parse.Cloud.afterSave("StateAuctionRegistered", async (request) => {
  const confirmed = request.object.get("confirmed");
  const logger = Parse.Cloud.getLogger();
  logger.info("Looking for confirmed StateAuctionRegistered transaction...");
  if (!confirmed) {
    logger.info("Item fetched!");
    // create ListAuctionRecords, set currState to 0
    const ListAuctionRecords = Parse.Object.extend("ListAuctionRecords");
    const listAuctionRecords = new ListAuctionRecords();
    listAuctionRecords.set("auctionAddress", request.object.get("auction"));
    listAuctionRecords.set("nftAddress", request.object.get("nftAddress"));
    listAuctionRecords.set("tokenId", request.object.get("tokenId"));
    listAuctionRecords.set("currState", 0);
    listAuctionRecords.set("depositPlaced", []);
    listAuctionRecords.set("seller", request.object.get("seller"));
    logger.info(
      `------Added ${request.object.get("auction")} listAuctionRecords------`
    );
    logger.info("Saving...");
    await listAuctionRecords.save();
    logger.info("------Successfully saved!------");
  }
});