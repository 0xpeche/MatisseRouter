import { ethers } from "hardhat";
import { loadFixture } from "ethereum-waffle";

describe("Router", function () {
    async function deployRouterFixture() {
        // Contracts are deployed using the first signer/account by default
        const [owner, otherAccount] = await ethers.getSigners();

        const Router = await ethers.getContractFactory("MatisseRouter");
        const router = await Router.deploy();

        const usdc = await ethers.getContractAt("IERC20", "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48")

        const feeAddress = "0xafC61DD9Ec784c917C444E4FAC0FB8fAaD1fcA83"

        return { router, owner, otherAccount, usdc, feeAddress };
    }

    describe("Swaps", function () {
        it("Should swap ETH for USDC and back", async function () {
            const { router, otherAccount, usdc, feeAddress } = await loadFixture(deployRouterFixture)
            await router.connect(otherAccount).swapExactETHForTokens(usdc.address, "0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc", { value: ethers.utils.parseEther("1") })
            const balUSDC = await usdc.balanceOf(otherAccount.address)
            console.log(ethers.utils.formatUnits(balUSDC, 6), " balUSDC")

            const ethBalFeeFirst = await ethers.provider.getBalance(feeAddress)
            console.log(ethers.utils.formatEther(ethBalFeeFirst), " ether balance feeAddr")

            await usdc.connect(otherAccount).approve(router.address, ethers.constants.MaxUint256)

            const ethBalAccBefore = await ethers.provider.getBalance(otherAccount.address)

            await router.connect(otherAccount).swapExactTokensForETH(usdc.address, "0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc", balUSDC)

            const ethBalFee = await ethers.provider.getBalance(feeAddress)
            console.log(ethers.utils.formatEther(ethBalFee), " ether balance feeAddr")
            const ethBalAcc = await ethers.provider.getBalance(otherAccount.address)
            console.log(ethers.utils.formatEther(ethBalAcc.sub(ethBalAccBefore)), " + ether balance User")
        });
    });
});
