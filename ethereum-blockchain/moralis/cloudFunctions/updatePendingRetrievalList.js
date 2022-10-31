Moralis.Cloud.afterSave("LogSellerEarningsRetrieved", async (request) => {
    const confirmed = request.object.get("confirmed");
    const logger = Moralis.Cloud.getLogger();
    logger.info("Looking for confirmed LogSellerEarningsRetrieved transaction...");
    if (!confirmed) {
      logger.info("Item fetched!");
      const ListPendingSellerEarningsRetrieval = Moralis.Object.extend("ListPendingSellerEarningsRetrieval");
      const query = new Moralis.Query(ListPendingSellerEarningsRetrieval);
      query.equalTo("tokenId", request.object.get("tokenId"));
      query.equalTo("auction", request.object.get("auction"));
      const retrievedEarningsAucs = await query.first();
      logger.info(`Retrieved Earnings Auction: ${retrievedEarningsAucs}`);
      if (retrievedEarningsAucs) {
        retrievedEarningsAucs.destroy().then(() => {
            logger.info(`Refunded! Removed pending refund from ListPendingWinnerPaymentRefund`);
        }, (error) => {
            console.log(error);
        });
    
        await retrievedEarningsAucs.save();
      }
    }
  });