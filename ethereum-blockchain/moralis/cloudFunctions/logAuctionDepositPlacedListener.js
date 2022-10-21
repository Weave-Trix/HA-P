// when deposit placed, append array depositPlaced
Moralis.Cloud.afterSave("LogAuctionDepositPlaced", async (request) => {
  const confirmed = request.object.get("confirmed");
  const logger = Moralis.Cloud.getLogger();
  logger.info("Looking for confirmed LogAuctionDepositPlaced transaction...");
  if (!confirmed) {
    logger.info("Item fetched!");
    // query ListAuctionRecords, append array depositPlaced
    const ListAuctionRecords = Moralis.Object.extend("ListAuctionRecords");
    const query = new Moralis.Query(ListAuctionRecords);
    query.equalTo("auctionAddress", request.object.get("auction"));
    query.equalTo("nftAddress", request.object.get("nftAddress"));
    query.equalTo("tokenId", request.object.get("tokenId"));
    const col_LBR = await query.first();
    col_LBR.add("depositPlaced", request.object.get("bidder"));
    logger.info(`------Updated ${col_LBR} listAuctionRecords------`);
    await col_LBR.save();
    logger.info("------Successfully saved!------");
  }
});
