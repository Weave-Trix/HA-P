const { network } = require("hardhat");
const fs = require("fs");

const { contractAddressFile, contractAbiFile } = require("../helper-hardhat-config");

module.exports = async function () {
  await updatecontractAddressFileresses();
  await updateAbi();
  console.log("________________________________________________");

  async function updatecontractAddressFileresses() {
    const vehicleNft = await ethers.getContract("VehicleNft");
    const chainId = network.config.chainId.toString();
    console.log(
      `VehicleNft (%s) : Address ==> %s updated`,
      chainId,
      vehicleNft.address
    );
    const currentAddresses = JSON.parse(
      fs.readFileSync(contractAddressFile, "utf8")
    );
    if (chainId in currentAddresses["VehicleNft"]) {
      if (
        !currentAddresses["VehicleNft"][chainId].includes(vehicleNft.address)
      ) {
        currentAddresses["VehicleNft"][chainId].push(
          vehicleNft.address
        );
      }
    } else {
      currentAddresses["VehicleNft"][chainId] = [vehicleNft.address]
    }
    fs.writeFileSync(contractAddressFile, JSON.stringify(currentAddresses))
  }

  async function updateAbi() {
    const vehicleNft = await ethers.getContract("VehicleNft")
    const currentAbi = JSON.parse(fs.readFileSync(contractAbiFile, "utf8"))
    currentAbi["VehicleNft"] = vehicleNft.interface;
    fs.writeFileSync(contractAbiFile, JSON.stringify(currentAbi))
    console.log(`VehicleNft ABI updated`)
  }

  module.exports.tags = ["all", "frontend"];
};
