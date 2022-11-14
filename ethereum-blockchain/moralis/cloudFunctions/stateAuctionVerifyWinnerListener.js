Parse.Cloud.afterSave("StateAuctionVerifyingWinner", async (request) => {
  const confirmed = request.object.get("confirmed");
  const logger = Parse.Cloud.getLogger();
  logger.info(
    "Looking for confirmed StateAuctionVerifyingWinner transaction..."
  );
  if (!confirmed) {
    // when auction verifying winner, update auction state to 2
    logger.info("Item fetched!");
    // query ListAuctionRecords, set currState to 1
    const ListAuctionRecords = Parse.Object.extend("ListAuctionRecords");
    const query = new Parse.Query(ListAuctionRecords);
    query.equalTo("auctionAddress", request.object.get("auction"));
    query.equalTo("nftAddress", request.object.get("nftAddress"));
    query.equalTo("tokenId", request.object.get("tokenId"));
    const col_LAR = await query.first();
    logger.info(`Auction Verifying Winner: ${col_LAR}`);
    col_LAR.set("currState", 2);
    logger.info(`------Updated ${col_LAR} listAuctionRecords------`);
    logger.info("Saving...");
    await col_LAR.save();
    logger.info("------Successfully saved!------");
  }
});
