require("dotenv").config()
const { Moralis } = require("moralis-v1/node");
const contractAddress = require("../ethereum-blockchain/constants/contractAddresses.json")


const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL
const appId = process.env.NEXT_PUBLIC_APPLICATION_ID
const masterKey = process.env.MASTER_KEY
let chainId = process.env.CHAIN_ID;
const eventEmitterAddress =
  contractAddress["EventEmitter"][chainId][
    contractAddress["EventEmitter"][chainId].length - 1
  ] // get address of latest deployed EventEmitter contract
console.log(eventEmitterAddress);

async function main() {
    await Moralis.start({ serverUrl, appId, masterKey })
    console.log(`Moralis connected to EventEmitter => ${contractAddress}`)
    let itemListedOptions = {
        
    }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  });
