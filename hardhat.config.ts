import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ethers";
import "hardhat-gas-reporter"
import "@typechain/hardhat";
import * as dotenv from 'dotenv'
dotenv.config()

const RPC_URL = process.env.RPC_URL;
if (!RPC_URL) {
  throw new Error("Missing env variable `RPC_URL`");
}

const CMC = process.env.CMC;
if (!CMC) {
  throw new Error("Missing env variable `CMC`");
}

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      forking: {
        url: RPC_URL,
      },
      chainId: 1
    }
  },
  solidity: {
    compilers: [
      {
        version: "0.8.19",
        settings: {
          viaIR: true,
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.6.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ]
  },
  gasReporter: {
    coinmarketcap: CMC,
    currency: "ETH"
  }
};

export default config;
