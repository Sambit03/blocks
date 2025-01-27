"use client";

import { useState, useEffect } from "react";
import {
  useAccount,
  usePublicClient,
  useWalletClient,
  useBalance,
} from "wagmi";
import { toast } from "sonner";
import {
  checkAllowance,
  approveStEth,
  supplyStEth,
  parseAmount,
  getUserData,
} from "@/utils/aave";
import { CONTRACTS } from "@/config/constants";

export function AaveSupplyContent() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [supplyAPY, setSupplyAPY] = useState(0);
  const [userBalance, setUserBalance] = useState("0");
  const [allowance, setAllowance] = useState(BigInt(0));
  const [isApproving, setIsApproving] = useState(false);

  const fetchData = async () => {
    if (!address || !publicClient) return;
    try {
      const balance = await publicClient.readContract({
        address: CONTRACTS.WSTETH,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [address],
      });
      setUserBalance(formatEther(balance));

      const currentAllowance = await checkAllowance({
        publicClient,
        stEthAddress: CONTRACTS.WSTETH,
        userAddress: address,
      });
      setAllowance(currentAllowance);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Error fetching data");
    }
  };

  const handleApprove = async () => {
    if (!walletClient || !amount || !address || !publicClient) return;
    setIsApproving(true);
    try {
      const hash = await approveStEth({
        walletClient,
        stEthAddress: CONTRACTS.WSTETH,
        amount: parseAmount(amount),
      });
      const promise = publicClient.waitForTransactionReceipt({ hash });
      toast.promise(promise, {
        loading: "Approving...",
        success: "Approved!",
        error: "Approval failed",
      });
      await promise;
      await fetchData();
    } catch (error) {
      console.error("Error approving:", error);
      toast.error("Approval failed");
    } finally {
      setIsApproving(false);
    }
  };

  const handleSupply = async () => {
    if (!walletClient || !amount || !address || !publicClient) return;
    setIsLoading(true);
    try {
      const amountToSupply = parseAmount(amount);
      if (allowance < amountToSupply) {
        await handleApprove();
      }

      const hash = await supplyStEth({
        walletClient,
        stEthAddress: CONTRACTS.WSTETH,
        amount: amountToSupply,
      });

      const promise = publicClient.waitForTransactionReceipt({ hash });
      toast.promise(promise, {
        loading: "Supplying...",
        success: "Supplied!",
        error: "Supply failed",
      });
      await promise;
      await getUserData({ publicClient, userAddress: address });
      setAmount("");
      fetchData();
    } catch (error) {
      console.error("Error supplying:", error);
      toast.error("Supply failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMaxClick = () => {
    setAmount(userBalance);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [address, publicClient]);

  const getButtonConfig = () => {
    if (!isConnected) return { text: "Connect Wallet", disabled: true };
    if (isLoading || isApproving)
      return {
        text: isApproving ? "Approving..." : "Supplying...",
        disabled: true,
      };
    if (!amount) return { text: "Enter Amount", disabled: true };
    if (allowance < parseAmount(amount))
      return { text: "Approve WETH", onClick: handleApprove, disabled: false };
    return { text: "Supply", onClick: handleSupply, disabled: false };
  };

  const buttonConfig = getButtonConfig();

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Supply APY</span>
        <span className="font-medium text-green-600">
          {supplyAPY.toFixed(2)}%
        </span>
      </div>

      <div className="relative">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.0"
          disabled={isLoading || isApproving}
          className="w-full px-3 py-2 border rounded bg-gray-50 pr-16"
        />
        <button
          onClick={handleMaxClick}
          disabled={isLoading || isApproving}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-blue-600 hover:text-blue-700 disabled:text-gray-400"
        >
          MAX
        </button>
      </div>

      <div className="flex text-xs text-gray-500 justify-between">
        <span>Available</span>
        <span>{Number(userBalance).toFixed(4)} WETH</span>
      </div>

      <button
        onClick={buttonConfig.onClick}
        disabled={buttonConfig.disabled}
        className={`w-full px-4 py-2 rounded font-medium ${
          buttonConfig.disabled
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        {buttonConfig.text}
      </button>

      <div className="text-xs text-gray-500">
        <div className="flex justify-between mb-1">
          <span>Gas Fee</span>
          <span>~0.001 ETH</span>
        </div>
        <div className="flex justify-between">
          <span>Supply Cap</span>
          <span>100,000 WETH</span>
        </div>
      </div>
    </div>
  );
}
  