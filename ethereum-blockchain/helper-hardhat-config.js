const path = require("path");

const networkConfig = {
    5: {
        name: "goerli",
        aggregatorV3Interface: "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e"
    }
}

const developmentChains = ["hardhat", "localhost"]

const contractAddressFile = path.join(__dirname, "./constants") + "/contractAddresses.json"

const contractAbiFile = path.join(__dirname, "./constants") + "/contractAbi.json";

const VERIFICATION_BLOCK_CONFIRMATIONS = 6

module.exports = {
    networkConfig,
    developmentChains,
    contractAddressFile,
    contractAbiFile,
    VERIFICATION_BLOCK_CONFIRMATIONS
}