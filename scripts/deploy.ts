import { ethers } from "hardhat";

async function main() {
  const MatisseRouter = await ethers.getContractFactory("MatisseRouter");
  const matisseRouter = await MatisseRouter.deploy();

  await matisseRouter.deployed();

  console.log(
    `${matisseRouter.address}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
