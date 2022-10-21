// when auction pending audit, update auction state to 4
Moralis.Cloud.afterSave("StateAuctionPendingAudit", async (request) => {
    const confirmed = request.object.get("confirmed");
    const logger = Moralis.Cloud.getLogger();
    logger.info("Looking for confirmed StateAuctionPendingAudit transaction...");
    if (!confirmed) {
      logger.info("Item fetched!");
      // query ListAuctionRecords, set currState to 1
      const ListAuctionRecords = Moralis.Object.extend("ListAuctionRecords");
      const query = new Moralis.Query(ListAuctionRecords);
      query.equalTo("auctionAddress", request.object.get("auction"));
      query.equalTo("nftAddress", request.object.get("nftAddress"));
      query.equalTo("tokenId", request.object.get("tokenId"));
      const col_LAR = await query.first();
      logger.info(`Auction Pending Audit: ${col_LAR}`);
      col_LAR.set("currState", 4);
      logger.info(`------Updated ${col_LAR} listAuctionRecords------`);
      logger.info("Saving...");
      await col_LAR.save();
      logger.info("------Successfully saved!------");
    }
  });