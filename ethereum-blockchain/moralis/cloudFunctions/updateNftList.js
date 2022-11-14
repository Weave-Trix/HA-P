Parse.Cloud.afterSave("LogNftMinted", async (request) => {
  const confirmed = request.object.get("confirmed");
  const logger = Parse.Cloud.getLogger();
  logger.info("Looking for confirmed LogNftMinted transaction...");
  if (!confirmed) {
    logger.info("Item fetched!");
    const ListNftRecords = Parse.Object.extend("ListNftRecords");

    const listNftRecords = new ListNftRecords();
    listNftRecords.set("nftAddress", request.object.get("address"));
    listNftRecords.set("tokenId", request.object.get("tokenId"));
    listNftRecords.set("tokenURI", request.object.get("tokenURI"));
    listNftRecords.set("owner", request.object.get("owner"));
    listNftRecords.set("active", true);
    logger.info(
      `Adding nft token id: ${request.object.get(
        "tokenId"
      )}. Owner: ${request.object.get("owner")}`
    );
    logger.info("Saving...");
    await listNftRecords.save();
    logger.info("-------Succesfully saved!-------");
  }
});

Parse.Cloud.afterSave("LogNftBurned", async (request) => {
  const confirmed = request.object.get("confirmed");
  const logger = Parse.Cloud.getLogger();
  logger.info("Looking for confirmed LogNftBurned transaction...");
  if (!confirmed) {
    logger.info("Item fetched!");
    const ListNftRecords = Parse.Object.extend("ListNftRecords");
    const query = new Parse.Query(ListNftRecords);
    query.equalTo("tokenId", request.object.get("tokenId"));
    query.equalTo("owner", request.object.get("owner"));
    const burnedNft = await query.first();
    logger.info(`NftBurned: ${burnedNft}`);
    if (burnedNft) {
      burnedNft.set("active", false);
      logger.info(
        `------Changed Token ${request.object.get(
          "tokenId"
        )} status to inactive.------`
      );
      await burnedNft.save();
    }
  }
});

Parse.Cloud.afterSave("LogNftTransferred", async (request) => {
    const confirmed = request.object.get("confirmed");
    const logger = Parse.Cloud.getLogger();
    logger.info("Looking for confirmed LogNftTransferred transaction...");
    if (!confirmed) {
      logger.info("Item fetched!");
      const ListNftRecords = Parse.Object.extend("ListNftRecords");
      const query = new Parse.Query(ListNftRecords);
      query.equalTo("tokenId", request.object.get("tokenId"));
      query.equalTo("owner", request.object.get("prev_Owner"));
      const transferredNft = await query.first();
      logger.info(`NftBurned: ${query.first()}`);
      if (transferredNft) {
        transferredNft.set("owner", request.object.get("curr_Owner"));
        logger.info(
          `------Changed Owner of ${request.object.get("tokenId")} to ${request.object.get(
            "curr_Owner"
          )}------`
        );
        await transferredNft.save();
      }
    }
  });