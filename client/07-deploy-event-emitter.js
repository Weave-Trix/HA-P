const { network } = require("hardhat");
const fs = require("fs");
const {
  developmentChains,
  VERIFICATION_BLOCK_CONFIRMATIONS,
  contractAddressFile,
} = require("../blockchain/helper-hardhat-config");
const { verify } = require("../blockchain/utils/verify");

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
    JSON.stringify(
      currentAddresses["EventEmitter"][currentAddresses.length - 1]
    ),
  ];
  const eventEmitter = await deploy("EventEmitter", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmation: waitBlockConfirmations,
  });

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    log("Verifying...");
    await verify(eventEmitter.address, args);
  }
};
