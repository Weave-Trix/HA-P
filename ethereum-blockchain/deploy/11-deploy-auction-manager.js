const { network } = require("hardhat");
const fs = require("fs");
const {
  developmentChains,
  VERIFICATION_BLOCK_CONFIRMATIONS,
  contractAddressFile,
} = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  const waitBlockConfirmations = developmentChains.includes(network.name)
    ? 1
    : VERIFICATION_BLOCK_CONFIRMATIONS;
  const currentAddresses = JSON.parse(
    fs.readFileSync(contractAddressFile, "utf8")
  );

  const args = [
    currentAddresses["AuctionRegistry"][chainId][
      currentAddresses["AuctionRegistry"][chainId].length - 1
    ],
    currentAddresses["EventEmitter"][chainId][
      currentAddresses["EventEmitter"][chainId].length - 1
    ],
    currentAddresses["AuctionKeeper"][chainId][
      currentAddresses["AuctionKeeper"][chainId].length - 1
    ],
    currentAddresses["ContractFactory"][chainId][
      currentAddresses["ContractFactory"][chainId].length - 1
    ],
  ]
  const auctionManager = await deploy("AuctionManager", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmation: waitBlockConfirmations,
  })

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    log("Verifying...");
    await verify(auctionManager.address, args);
  }
}
