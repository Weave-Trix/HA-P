const { network } = require("hardhat");
const fs = require("fs");

const { contractAddressFile, contractAbiFile } = require("../helper-hardhat-config");

module.exports = async function () {
  await updatecontractAddressFileresses();
  await updateAbi();
  console.log("________________________________________________");

  async function updatecontractAddressFileresses() {
    const eventEmitter = await ethers.getContract("EventEmitter");
    const chainId = network.config.chainId.toString();
    console.log(
      `EventEmitter (%s) : Address ==> %s updated`,
      chainId,
      eventEmitter.address
    );
    const currentAddresses = JSON.parse(
      fs.readFileSync(contractAddressFile, "utf8")
    );
    if (chainId in currentAddresses["EventEmitter"]) {
      if (
        !currentAddresses["EventEmitter"][chainId] == eventEmitter.address
      ) {
        currentAddresses["EventEmitter"][chainId].push(
          eventEmitter.address
        );
      }
    } else {
      currentAddresses["EventEmitter"][chainId] = [eventEmitter.address]
    }
    fs.writeFileSync(contractAddressFile, JSON.stringify(currentAddresses))
  }

  async function updateAbi() {
    const eventEmitter = await ethers.getContract("EventEmitter")
    const currentAbi = JSON.parse(fs.readFileSync(contractAbiFile, "utf8"))
    currentAbi["EventEmitter"] = eventEmitter.interface;
    fs.writeFileSync(contractAbiFile, JSON.stringify(currentAbi))
    console.log(`EventEmitter ABI updated`)
  }

  module.exports.tags = ["all", "frontend"];
};
