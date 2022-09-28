const { network } = require("hardhat");
const fs = require("fs");

const { contractAddressFile, contractAbiFile } = require("../helper-hardhat-config");

module.exports = async function () {
  await updatecontractAddressFileresses();
  await updateAbi();
  console.log("________________________________________________");

  async function updatecontractAddressFileresses() {
    const auctionRegistry = await ethers.getContract("AuctionRegistry");
    const chainId = network.config.chainId.toString();
    console.log(
      `AuctionRegistry (%s) : Address ==> %s updated`,
      chainId,
      auctionRegistry.address
    );
    const currentAddresses = JSON.parse(
      fs.readFileSync(contractAddressFile, "utf8")
    );
    if (chainId in currentAddresses["AuctionRegistry"]) {
      if (
        !currentAddresses["AuctionRegistry"][chainId] == auctionRegistry.address
      ) {
        currentAddresses["AuctionRegistry"][chainId].push(
          auctionRegistry.address
        );
      }
    } else {
      currentAddresses["AuctionRegistry"][chainId] = [auctionRegistry.address]
    }
    fs.writeFileSync(contractAddressFile, JSON.stringify(currentAddresses))
  }

  async function updateAbi() {
    const auctionRegistry = await ethers.getContract("AuctionRegistry")
    const currentAbi = JSON.parse(fs.readFileSync(contractAbiFile, "utf8"))
    currentAbi["AuctionRegistry"] = auctionRegistry.interface;
    fs.writeFileSync(contractAbiFile, JSON.stringify(currentAbi))
    console.log(`AuctionRegistry ABI updated`)
  }

  module.exports.tags = ["all", "frontend"];
};
