// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.0;

import {IERC20} from "./interfaces/IERC20.sol";
import {IWETH} from "./interfaces/IWETH.sol";
import {IUniswapV2Pair} from "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";

// &&&&&&&&&%%%&%#(((/,,,**,,,**,,,*******/*,,/%%%%%%#.,%%%%%%%%%%%%%%%% ./(#%%%%/. #%%/***,,*,*,,,,**,
// %&&&&&&&&&%%%/((((*,,,,,,,**/.,,,*****/%%#.      ,**,,%%%%%%%%%%%%%%%%%%#.     #%%%%%#*,,,,,,*,,,,,*
// ,.,,*(%&&%%/*/((((,,,,,,,,**((%%,,**,  .#%%/*%%%%%%%,*%%%%%%%%%%%%%%%%#%    ..  #%%%%%,*,*,,**,*,**,
// ..,.,,.,,.,.*((((,,,,,,,****(#%%%%%,*%%%%%. .(%%%%%#,#%%%%%%%%%%%%%%%%,  &@# . * (%%%%***,*,,*,*,,,,
// .,.,,..,.,.,/(((,,,,,*****/#%%%%%%%%%%%%%,         ,%%%%%%%%%%%%%%%%%% .    .  / *#%%#***,*,*,**,,**
// ,,.,,,,.,,.,/((,,,****/#%%%%%%%%%%%%%%,     , ....   #%%%%%%%%&&%%%%%, /  ...  ,(%%%%/****,****,*#%#
// .,,.,.,.,.,,/(##%%%%%%%%%%%%%%%%%%%%% , /, .......    %%%%%%%%&&%%%%%% /*  .  , @%%%%/*******/(##%##
// ,..,,..,.,,%%%%%%%%%%%%%%%%%%%%%%%%%(#@..(/ .....  /, %%%%%%%%&&&%%%%%(.*////  @%%%%%/****(#%%%%%%#/
// ,,,..,.,,,.%%%%%%%%%%%%%%%%%%%%%%%%%%%%@../(*     @ .,%%%%%%%%%%%%%%%%%%%%/ ./(%%%%%/*/(#%%%%%%%#**/
// .,,,,,,,,,,*,#%%%%%%%%%%%%%%%%%%%%%%%%%%&@, ,*/(/,. #%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%#(#%%%%%%%#//*///
// ,,.,,.,,,,,,,,,,#%%%%%%%%%%%%%%%%%%%%%%%%%%(    .#%%%%%%%%%%%%#%&&&%%%%%%%%%%%%%%%*%%%#%%%#(**(**//*
// .,,,,..,*..,.,,,,...*%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%,(%#%%%(*/*///*//#%

contract MatisseRouter {
    address public constant FEE_ADDRESS =
        address(0xafC61DD9Ec784c917C444E4FAC0FB8fAaD1fcA83);

    IWETH public constant WETH =
        IWETH(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);

    uint32 public feeBps = 875;

    receive() external payable {}

    function swapExactETHForTokens(
        address tokenOut,
        address targetPair
    ) external payable {
        uint feeAmount = msg.value - ((msg.value * feeBps) / 1000);
        uint amountIn = msg.value - feeAmount;

        safeTransferETH(FEE_ADDRESS, feeAmount);

        WETH.deposit{value: amountIn}();

        // Optimistically send amountIn of inputToken to targetPair
        WETH.transfer(targetPair, amountIn);

        // Prepare variables for calculating expected amount out
        uint reserveIn;
        uint reserveOut;

        {
            // Avoid stack too deep error
            (uint reserve0, uint reserve1, ) = IUniswapV2Pair(targetPair)
                .getReserves();

            // sort reserves
            if (address(WETH) < tokenOut) {
                // Token0 is equal to inputToken
                // Token1 is equal to outputToken
                reserveIn = reserve0;
                reserveOut = reserve1;
            } else {
                // Token0 is equal to outputToken
                // Token1 is equal to inputToken
                reserveIn = reserve1;
                reserveOut = reserve0;
            }
        }

        uint amountOut = _getAmountOut(amountIn, reserveIn, reserveOut);

        // Prepare swap variables and call pair.swap()
        (uint amount0Out, uint amount1Out) = address(WETH) < tokenOut
            ? (uint(0), amountOut)
            : (amountOut, uint(0));

        IUniswapV2Pair(targetPair).swap(
            amount0Out,
            amount1Out,
            msg.sender,
            new bytes(0)
        );
    }

    function swapExactTokensForETH(
        address tokenIn,
        address targetPair,
        uint amountIn
    ) external {
        // Optimistically send amountIn of inputToken to targetPair
        IERC20(tokenIn).transferFrom(msg.sender, targetPair, amountIn);

        // Prepare variables for calculating expected amount out
        uint reserveIn;
        uint reserveOut;

        {
            // Avoid stack too deep error
            (uint reserve0, uint reserve1, ) = IUniswapV2Pair(targetPair)
                .getReserves();

            // sort reserves
            if (tokenIn < address(WETH)) {
                // Token0 is equal to inputToken
                // Token1 is equal to outputToken
                reserveIn = reserve0;
                reserveOut = reserve1;
            } else {
                // Token0 is equal to outputToken
                // Token1 is equal to inputToken
                reserveIn = reserve1;
                reserveOut = reserve0;
            }
        }

        // Find the actual amountIn sent to pair (accounts for tax if any) and amountOut
        uint actualAmountIn = IERC20(tokenIn).balanceOf(address(targetPair)) -
            reserveIn;
        uint amountOut = _getAmountOut(actualAmountIn, reserveIn, reserveOut);

        // Prepare swap variables and call pair.swap()
        (uint amount0Out, uint amount1Out) = tokenIn < address(WETH)
            ? (uint(0), amountOut)
            : (amountOut, uint(0));

        IUniswapV2Pair(targetPair).swap(
            amount0Out,
            amount1Out,
            address(this),
            new bytes(0)
        );

        WETH.withdraw(amountOut);

        uint feeAmount = amountOut - ((amountOut * feeBps) / 1000);

        safeTransferETH(msg.sender, amountOut - feeAmount);
        safeTransferETH(FEE_ADDRESS, feeAmount);
    }

    function _getAmountOut(
        uint amountIn,
        uint reserveIn,
        uint reserveOut
    ) internal pure returns (uint amountOut) {
        require(amountIn > 0, "UniswapV2Library: INSUFFICIENT_INPUT_AMOUNT");
        require(
            reserveIn > 0 && reserveOut > 0,
            "UniswapV2Library: INSUFFICIENT_LIQUIDITY"
        );
        uint amountInWithFee = amountIn * 997;
        uint numerator = amountInWithFee * reserveOut;
        uint denominator = reserveIn * 1000 + amountInWithFee;
        amountOut = numerator / denominator;
    }

    function setFee(uint32 feeBps_) external {
        require(msg.sender == FEE_ADDRESS, "not-authorized");
        feeBps = feeBps_;
    }

    function safeTransferETH(address to, uint256 amount) internal {
        bool success;

        /// @solidity memory-safe-assembly
        assembly {
            // Transfer the ETH and store if it succeeded or not.
            success := call(gas(), to, amount, 0, 0, 0, 0)
        }

        require(success, "ETH_TRANSFER_FAILED");
    }
}
