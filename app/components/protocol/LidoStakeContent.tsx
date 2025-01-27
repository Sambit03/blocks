"use client";
import { useState, useEffect } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { parseEther, formatEther } from "viem";
import { CONTRACTS } from "@/app/config/contract";

const LIDO_ABI = [
  "function submit(address _referral) external payable returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function approve(address spender, uint256 value) external returns (bool)",
  "function getStETHByWstETH(uint256 _wstETHAmount) external view returns (uint256)",
  "function getWstETHByStETH(uint256 _stETHAmount) external view returns (uint256)",
  "function getTotalPooledEther() external view returns (uint256)",
  "function getPooledEthByShares(uint256 _sharesAmount) external view returns (uint256)",
] as const;

const WSTETH_ABI = [
  "function wrap(uint256 _stETHAmount) external returns (uint256)",
  "function unwrap(uint256 _wstETHAmount) external returns (uint256)",
  "function stEthPerToken() external view returns (uint256)",
  "function tokensPerStEth() external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
] as const;

interface StakingStats {
  stethBalance: string;
  wstethBalance: string;
  stethRate: string;
  apr: number;
}

const LidoStakeContent = () => {
  const { isConnected, address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const [amount, setAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [shouldWrap, setShouldWrap] = useState(false);
  const [ethBalance, setEthBalance] = useState<string>("0");
  const [stats, setStats] = useState<StakingStats>({
    stethBalance: "0",
    wstethBalance: "0",
    stethRate: "1",
    apr: 4.8, // Default APR, in production this should be fetched from an API
  });

  const fetchData = async () => {
    if (!address || !publicClient) return;

    try {
      // Fetch ETH balance
      const balance = await publicClient.getBalance({ address });
      setEthBalance(formatEther(balance));

      // Fetch stETH balance
      const stethBalance = (await publicClient.readContract({
        address: CONTRACTS.LIDO.STETH as `0x${string}`,
        abi: LIDO_ABI,
        functionName: "balanceOf",
        args: [address],
      })) as bigint;

      // Fetch wstETH balance
      const wstethBalance = (await publicClient.readContract({
        address: CONTRACTS.LIDO.WSTETH as `0x${string}`,
        abi: WSTETH_ABI,
        functionName: "balanceOf",
        args: [address],
      })) as bigint;

      // Fetch stETH/wstETH rate
      const rate = (await publicClient.readContract({
        address: CONTRACTS.LIDO.WSTETH as `0x${string}`,
        abi: WSTETH_ABI,
        functionName: "stEthPerToken",
      })) as bigint;

      setStats({
        stethBalance: formatEther(stethBalance),
        wstethBalance: formatEther(wstethBalance),
        stethRate: formatEther(rate),
        apr: 4.8, // In production, fetch from API
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleStake = async () => {
    if (!walletClient || !amount || !address) return;

    setIsLoading(true);
    try {
      // First stake ETH for stETH
      const stakeHash = await walletClient.writeContract({
        address: CONTRACTS.LIDO.STETH,
        abi: LIDO_ABI,
        functionName: "submit",
        args: [address], // using user address as referral
        value: parseEther(amount),
      });

      await publicClient.waitForTransactionReceipt({ hash: stakeHash });

      if (shouldWrap) {
        // Approve wstETH contract to spend stETH
        const approveHash = await walletClient.writeContract({
          address: CONTRACTS.LIDO.STETH,
          abi: LIDO_ABI,
          functionName: "approve",
          args: [CONTRACTS.LIDO.WSTETH, parseEther(amount)],
        });

        await publicClient.waitForTransactionReceipt({ hash: approveHash });

        // Wrap stETH to wstETH
        const wrapHash = await walletClient.writeContract({
          address: CONTRACTS.LIDO.WSTETH,
          abi: WSTETH_ABI,
          functionName: "wrap",
          args: [parseEther(amount)],
        });

        await publicClient.waitForTransactionReceipt({ hash: wrapHash });
      }

      await fetchData();
      setAmount("");
    } catch (error) {
      console.error("Error staking:", error);
      alert("Error staking with Lido. Check console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  const getEstimatedWsteth = () => {
    if (!amount || !stats.stethRate || Number(stats.stethRate) === 0)
      return "0";
    return (Number(amount) / Number(stats.stethRate)).toFixed(6);
  };

  const handleMaxClick = () => {
    setAmount(ethBalance);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [address, publicClient]);

  const buttonConfig = () => {
    if (!isConnected) return { text: "Connect Wallet", disabled: true };
    if (isLoading) return { text: "Processing...", disabled: true };
    if (!amount) return { text: "Enter Amount", disabled: true };
    if (Number(amount) > Number(ethBalance))
      return { text: "Insufficient ETH", disabled: true };
    return { text: `Stake${shouldWrap ? " & Wrap" : ""}`, disabled: false };
  };

  const config = buttonConfig();

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Staking APR</span>
        <span className="font-medium text-green-600">{stats.apr}%</span>
      </div>

      <div className="relative">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.0"
          disabled={isLoading}
          className="w-full px-3 py-2 border rounded bg-gray-50 pr-16"
        />
        <button
          onClick={handleMaxClick}
          disabled={isLoading}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-blue-600 hover:text-blue-700 disabled:text-gray-400"
        >
          MAX
        </button>
      </div>

      <div className="flex text-xs text-gray-800 justify-between">
        <span>Available</span>
        <span>{Number(ethBalance).toFixed(4)} ETH</span>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          id="wrap"
          checked={shouldWrap}
          onChange={(e) => setShouldWrap(e.target.checked)}
          disabled={isLoading}
          className="rounded border-gray-300"
        />
        <label htmlFor="wrap" className="text-gray-700">
          Wrap to wstETH
        </label>
      </div>

      {shouldWrap && amount && (
        <div className="text-xs text-gray-800 space-y-1">
          <div className="flex justify-between">
            <span>You will receive:</span>
            <span>{getEstimatedWsteth()} wstETH</span>
          </div>
          <div className="flex justify-between">
            <span>Exchange rate:</span>
            <span>1 wstETH = {Number(stats.stethRate).toFixed(4)} stETH</span>
          </div>
        </div>
      )}

      <div className="space-y-1">
        <div className="flex text-xs text-gray-500 justify-between">
          <span>Your stETH balance:</span>
          <span>{Number(stats.stethBalance).toFixed(4)} stETH</span>
        </div>
        <div className="flex text-xs text-gray-800 justify-between">
          <span>Your wstETH balance:</span>
          <span>{Number(stats.wstethBalance).toFixed(4)} wstETH</span>
        </div>
      </div>

      <button
        onClick={handleStake}
        disabled={config.disabled || isLoading}
        className={`w-full px-4 py-2 rounded font-medium ${
          config.disabled || isLoading
            ? "bg-gray-300 text-gray-800 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        {config.text}
      </button>

      <div className="text-xs text-gray-500">
        <div className="flex justify-between mb-1">
          <span>Gas Fee</span>
          <span>{shouldWrap ? "~0.003" : "~0.001"} ETH</span>
        </div>
        <div className="flex justify-between">
          <span>Min Stake</span>
          <span>0.001 ETH</span>
        </div>
      </div>
    </div>
  );
};

export default LidoStakeContent;
