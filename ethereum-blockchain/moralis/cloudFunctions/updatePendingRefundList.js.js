Moralis.Cloud.afterSave("LogWinnerPaymentRefunded", async (request) => {
    const confirmed = request.object.get("confirmed");
    const logger = Moralis.Cloud.getLogger();
    logger.info("Looking for confirmed LogWinnerPaymentRefunded transaction...");
    if (!confirmed) {
      logger.info("Item fetched!");
      const ListPendingWinnerPaymentRefund = Moralis.Object.extend("ListPendingWinnerPaymentRefund");
      const query = new Moralis.Query(ListPendingWinnerPaymentRefund);
      query.equalTo("tokenId", request.object.get("tokenId"));
      query.equalTo("auction", request.object.get("auction"));
      const refundedWinnerAucs = await query.first();
      logger.info(`Refunded Auction: ${refundedWinnerAucs}`);
      if (refundedWinnerAucs) {
        refundedWinnerAucs.destroy().then(() => {
            logger.info(`Refunded! Removed pending refund from ListPendingWinnerPaymentRefund`);
        }, (error) => {
            console.log(error);
        });
    
        await refundedWinnerAucs.save();
      }
    }
  });