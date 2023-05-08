import { ethers } from "hardhat";
import { loadFixture } from "ethereum-waffle";

describe("Router", function () {
    async function deployRouterFixture() {
        // Contracts are deployed using the first signer/account by default
        const [owner, otherAccount] = await ethers.getSigners();

        const Router = await ethers.getContractFactory("MatisseRouter02");
        const router = await Router.deploy();

        const usdc = await ethers.getContractAt("IERC20", "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48")
        const dai = await ethers.getContractAt("IERC20", "0x6B175474E89094C44Da98b954EedeAC495271d0F")
        const weth = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

        const feeAddress = "0xafC61DD9Ec784c917C444E4FAC0FB8fAaD1fcA83"

        return { router, owner, otherAccount, usdc, feeAddress, weth, dai };
    }

    describe("Swaps", function () {
        it("Should swap ETH for USDC and back", async function () {
            const { router, otherAccount, usdc, weth, dai } = await loadFixture(deployRouterFixture)

            // Swap ETH For USDC

            const data = ethers.utils.solidityPack(["address", "address", "address"], [weth, usdc.address, "0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc"])

            const tx = {
                to: router.address,
                data: data,
                value: ethers.utils.parseEther("1"),
                gasLimit: 200000
            }

            await otherAccount.sendTransaction(tx)

            const balTokenOut = await usdc.balanceOf(otherAccount.address)
            console.log(ethers.utils.formatUnits(balTokenOut, 6), " balTokenOut")

            const etherBalanceFeeAddr = await ethers.provider.getBalance(router.address)
            console.log(ethers.utils.formatEther(etherBalanceFeeAddr), " etherBalanceFeeAddr")

            // Swap USDC For ETH

            await usdc.connect(otherAccount).approve(router.address, ethers.constants.MaxUint256)

            const etherBalanceAccountBeforeSwap = await ethers.provider.getBalance(otherAccount.address)

            const data2 = ethers.utils.solidityPack(["address", "address", "address", "uint128"], [usdc.address, weth, "0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc", balTokenOut])

            const tx2 = {
                to: router.address,
                data: data2,
                gasLimit: 200000
            }

            await otherAccount.sendTransaction(tx2)

            const etherBalanceFeeAddr2 = await ethers.provider.getBalance(router.address)
            console.log(ethers.utils.formatEther(etherBalanceFeeAddr2), " etherBalanceFeeAddr")

            const etherBalanceAccountAfterSwap = await ethers.provider.getBalance(otherAccount.address)
            console.log(ethers.utils.formatEther(etherBalanceAccountAfterSwap.sub(etherBalanceAccountBeforeSwap)), " + ether balance User")

            // Swap ETH For USDC

            const data3 = ethers.utils.solidityPack(["address", "address", "address"], [weth, usdc.address, "0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc"])

            const tx3 = {
                to: router.address,
                data: data3,
                value: ethers.utils.parseEther("1"),
                gasLimit: 200000
            }

            await otherAccount.sendTransaction(tx3)

            const balTokenOut2 = await usdc.balanceOf(otherAccount.address)
            console.log(ethers.utils.formatUnits(balTokenOut2, 6), " balTokenOut")

            const etherBalanceFeeAddr3 = await ethers.provider.getBalance(router.address)
            console.log(ethers.utils.formatEther(etherBalanceFeeAddr3), " etherBalanceFeeAddr")

            // Swap USDC For DAI

            const data4 = ethers.utils.solidityPack(["address", "address", "address", "uint128"], [usdc.address, dai.address, "0xae461ca67b15dc8dc81ce7615e0320da1a9ab8d5", balTokenOut2])

            const tx4 = {
                to: router.address,
                data: data4,
                gasLimit: 200000
            }

            await otherAccount.sendTransaction(tx4)

            const etherBalanceFeeAddr4 = await ethers.provider.getBalance(router.address)
            console.log(ethers.utils.formatEther(etherBalanceFeeAddr4), " etherBalanceFeeAddr")

            const balTokenOut3 = await dai.balanceOf(otherAccount.address)
            console.log(ethers.utils.formatUnits(balTokenOut3, 18), " balTokenOut")

        });
    });
});
