import { ethers } from "hardhat";
import { loadFixture } from "ethereum-waffle";

describe("Router", function () {
    async function deployRouterFixture() {
        // Contracts are deployed using the first signer/account by default
        const [owner, otherAccount] = await ethers.getSigners();

        const Router = await ethers.getContractFactory("MatisseRouter02");
        const router = await Router.deploy();

        const usdc = await ethers.getContractAt("IERC20", "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48")
        const weth = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

        const feeAddress = "0xafC61DD9Ec784c917C444E4FAC0FB8fAaD1fcA83"

        return { router, owner, otherAccount, usdc, feeAddress, weth };
    }

    describe("Swaps", function () {
        it("Should swap ETH for USDC and back", async function () {
            const { router, otherAccount, usdc, feeAddress, weth, owner } = await loadFixture(deployRouterFixture)

            const data = ethers.utils.solidityPack(["address", "address", "address"], [weth, usdc.address, "0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc"])

            const tx = {
                to: router.address,
                data: data,
                value: ethers.utils.parseEther("1")
            }

            await otherAccount.sendTransaction(tx)

            const balUSDC = await usdc.balanceOf(otherAccount.address)
            console.log(ethers.utils.formatUnits(balUSDC, 6), " bal Token")

            const ethBalFeeFirst = await ethers.provider.getBalance(router.address)
            console.log(ethers.utils.formatEther(ethBalFeeFirst), " ether balance Contract")

            await usdc.connect(otherAccount).approve(router.address, ethers.constants.MaxUint256)

            const ethBalAccBefore = await ethers.provider.getBalance(otherAccount.address)

            const data2 = ethers.utils.solidityPack(["address", "address", "address", "uint128"], [usdc.address, weth, "0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc", balUSDC])

            const tx2 = {
                to: router.address,
                data: data2
            }

            await otherAccount.sendTransaction(tx2)

            const ethBalFee = await ethers.provider.getBalance(router.address)
            console.log(ethers.utils.formatEther(ethBalFee), " ether balance Contract")
            const ethBalAcc = await ethers.provider.getBalance(otherAccount.address)
            console.log(ethers.utils.formatEther(ethBalAcc.sub(ethBalAccBefore)), " + ether balance User")

            const ethBalOwnerBef = await ethers.provider.getBalance(owner.address)
            await router.connect(owner).recover("0x0000000000000000000000000000000000000000")
            const ethBalOwnerAf = await ethers.provider.getBalance(owner.address)

            console.log(ethers.utils.formatEther(ethBalOwnerAf.sub(ethBalOwnerBef)), " + ether balance Owner")
        });
    });
});
