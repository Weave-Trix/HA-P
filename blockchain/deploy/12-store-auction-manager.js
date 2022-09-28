const { network } = require("hardhat");
const fs = require("fs");

const { contractAddressFile, contractAbiFile } = require("../helper-hardhat-config");

module.exports = async function () {
  await updatecontractAddressFileresses();
  await updateAbi();
  console.log("________________________________________________");

  async function updatecontractAddressFileresses() {
    const auctionManager = await ethers.getContract("AuctionManager");
    const chainId = network.config.chainId.toString();
    console.log(
      `AuctionManager (%s) : Address ==> %s updated`,
      chainId,
      auctionManager.address
    );
    const currentAddresses = JSON.parse(
      fs.readFileSync(contractAddressFile, "utf8")
    );
    if (chainId in currentAddresses["AuctionManager"]) {
      if (
        !currentAddresses["AuctionManager"][chainId] == auctionManager.address
      ) {
        currentAddresses["AuctionManager"][chainId].push(
          auctionManager.address
        );
      }
    } else {
      currentAddresses["AuctionManager"][chainId] = [auctionManager.address]
    }
    fs.writeFileSync(contractAddressFile, JSON.stringify(currentAddresses))
  }

  async function updateAbi() {
    const auctionManager = await ethers.getContract("AuctionManager")
    const currentAbi = JSON.parse(fs.readFileSync(contractAbiFile, "utf8"))
    currentAbi["AuctionManager"] = auctionManager.interface;
    fs.writeFileSync(contractAbiFile, JSON.stringify(currentAbi))
    console.log(`AuctionManager ABI updated`)
  }

  module.exports.tags = ["all", "frontend"];
};
