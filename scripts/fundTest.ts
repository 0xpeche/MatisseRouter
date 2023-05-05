import { ethers } from "hardhat";

async function main() {
    const [owner, otherAccount] = await ethers.getSigners();

    const tx = {
        to: "0x9febf4eddc13e0e4d2afae6eb28fb8076ee0dcee",
        value: ethers.utils.parseEther('50')
    }

    const response = await owner.sendTransaction(tx)

    console.log(response.blockNumber)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
