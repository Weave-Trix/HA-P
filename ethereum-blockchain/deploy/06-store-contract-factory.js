const { network } = require("hardhat");
const fs = require("fs");

const { contractAddressFile, contractAbiFile } = require("../helper-hardhat-config");

module.exports = async function () {
  await updatecontractAddressFileresses();
  await updateAbi();
  console.log("________________________________________________");

  async function updatecontractAddressFileresses() {
    const contractFactory = await ethers.getContract("ContractFactory");
    const chainId = network.config.chainId.toString();
    console.log(
      `ContractFactory (%s) : Address ==> %s updated`,
      chainId,
      contractFactory.address
    );
    const currentAddresses = JSON.parse(
      fs.readFileSync(contractAddressFile, "utf8")
    );
    if (chainId in currentAddresses["ContractFactory"]) {
      if (
        !currentAddresses["ContractFactory"][chainId].includes(contractFactory.address)
      ) {
        currentAddresses["ContractFactory"][chainId].push(
          contractFactory.address
        );
      }
    } else {
      currentAddresses["ContractFactory"][chainId] = [contractFactory.address]
    }
    fs.writeFileSync(contractAddressFile, JSON.stringify(currentAddresses))
  }

  async function updateAbi() {
    const contractFactory = await ethers.getContract("ContractFactory")
    const currentAbi = JSON.parse(fs.readFileSync(contractAbiFile, "utf8"))
    currentAbi["ContractFactory"] = contractFactory.interface;
    fs.writeFileSync(contractAbiFile, JSON.stringify(currentAbi))
    console.log(`ContractFactory ABI updated`)
  }

  module.exports.tags = ["all", "frontend"];
};
