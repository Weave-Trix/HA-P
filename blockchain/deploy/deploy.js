const { ethers } = require("hardhat")

async function main() {
  const VehicleNFT = await ethers.getContractFactory("VehicleNFT");
  const vehicleNFT = await VehicleNFT.deploy("VehicleNFT", "VOC");

  try {
    await vehicleNFT.deployed();
    console.log(`Contract successfully deployed to ${vehicleNFT.address}`);
  } catch(err) {
    console.log(`Error: ${err.message}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
