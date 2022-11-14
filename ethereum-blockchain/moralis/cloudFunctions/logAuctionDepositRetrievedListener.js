// when deposit withdrawn, remove from array depositPlaced
Parse.Cloud.afterSave("LogAuctionDepositRetrieved", async (request) => {
  const confirmed = request.object.get("confirmed");
  const logger = Parse.Cloud.getLogger();
  logger.info(
    "Looking for confirmed LogAuctionDepositRetrieved transaction..."
  );
  if (!confirmed) {
    logger.info("Item fetched!");
    // query ListAuctionRecords, remove from array depositPlaced
    const ListAuctionRecords = Parse.Object.extend("ListAuctionRecords");
    const query = new Parse.Query(ListAuctionRecords);
    query.equalTo("auctionAddress", request.object.get("auction"));
    query.equalTo("nftAddress", request.object.get("nftAddress"));
    query.equalTo("tokenId", request.object.get("tokenId"));
    const col_LBR = await query.first();
    col_LBR.remove("depositPlaced", request.object.get("bidder"));
    logger.info(`------Updated ${col_LBR} listAuctionRecords------`);
    await col_LBR.save();
    logger.info("------Successfully saved!------");
  }
});
