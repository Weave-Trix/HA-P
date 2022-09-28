const { network } = require("hardhat");
const fs = require("fs");

const { contractAddressFile, contractAbiFile } = require("../helper-hardhat-config");

module.exports = async function () {
  await updatecontractAddressFileresses();
  await updateAbi();
  console.log("________________________________________________");

  async function updatecontractAddressFileresses() {
    const auctionKeeper = await ethers.getContract("AuctionKeeper");
    const chainId = network.config.chainId.toString();
    console.log(
      `AuctionKeeper (%s) : Address ==> %s updated`,
      chainId,
      auctionKeeper.address
    );
    const currentAddresses = JSON.parse(
      fs.readFileSync(contractAddressFile, "utf8")
    );
    if (chainId in currentAddresses["AuctionKeeper"]) {
      if (
        !currentAddresses["AuctionKeeper"][chainId] == auctionKeeper.address
      ) {
        currentAddresses["AuctionKeeper"][chainId].push(
          auctionKeeper.address
        );
      }
    } else {
      currentAddresses["AuctionKeeper"][chainId] = [auctionKeeper.address]
    }
    fs.writeFileSync(contractAddressFile, JSON.stringify(currentAddresses))
  }

  async function updateAbi() {
    const auctionKeeper = await ethers.getContract("AuctionKeeper")
    const currentAbi = JSON.parse(fs.readFileSync(contractAbiFile, "utf8"))
    currentAbi["AuctionKeeper"] = auctionKeeper.interface;
    fs.writeFileSync(contractAbiFile, JSON.stringify(currentAbi))
    console.log(`AuctionKeeper ABI updated`)
  }

  module.exports.tags = ["all", "frontend"];
};
