"use client";

import { useState, useEffect } from "react";
import {
  useAccount,
  usePublicClient,
  useWalletClient,
  useBalance,
} from "wagmi";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CONTRACTS } from "./config/constants";
import {
  approveStEth,
  checkAllowance,
  getUserData,
  parseAmount,
  supplyStEth,
} from "@/app/utils/aave";

export function AaveSupplyBlock() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const [amount, setAmount] = useState("");
  const [isSupplying, setIsSupplying] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [needsApproval, setNeedsApproval] = useState(true);

  // Get wstETH balance
  const { data: balance } = useBalance({
    address,
    token: CONTRACTS.WSTETH,
  });

  // Check allowance when component mounts or address/amount changes
  useEffect(() => {
    async function checkTokenAllowance() {
      if (!isConnected || !address || !amount || !publicClient) return;

      try {
        const allowance = await checkAllowance({
          publicClient,
          stEthAddress: CONTRACTS.WSTETH,
          userAddress: address,
        });

        const parsedAmount = parseAmount(amount);
        setNeedsApproval(allowance < parsedAmount);
      } catch (error) {
        console.error("Error checking allowance:", error);
        toast.error("Error checking token allowance");
      }
    }

    checkTokenAllowance();
  }, [isConnected, address, amount, publicClient]);

  const handleApprove = async () => {
    if (!walletClient || !amount || !address || !publicClient) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      setIsApproving(true);
      const parsedAmount = parseAmount(amount);

      const hash = await approveStEth({
        walletClient,
        stEthAddress: CONTRACTS.WSTETH,
        amount: parsedAmount,
      });

      const promise = publicClient.waitForTransactionReceipt({ hash });

      toast.promise(promise, {
        loading: "Approving wstETH...",
        success: "Successfully approved wstETH!",
        error: "Error approving wstETH",
      });

      await promise;
      setNeedsApproval(false);
    } catch (error) {
      console.error("Approval error:", error);
      toast.error("Failed to approve wstETH");
    } finally {
      setIsApproving(false);
    }
  };

  const handleSupply = async () => {
    if (!walletClient || !amount || !address || !publicClient) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      setIsSupplying(true);
      const parsedAmount = parseAmount(amount);

      const hash = await supplyStEth({
        walletClient,
        stEthAddress: CONTRACTS.WSTETH,
        amount: parsedAmount,
      });

      const promise = publicClient.waitForTransactionReceipt({ hash });

      toast.promise(promise, {
        loading: "Supplying wstETH to Aave...",
        success: "Successfully supplied wstETH!",
        error: "Error supplying wstETH",
      });

      await promise;

      // Get updated user data
      const userData = await getUserData({
        publicClient,
        userAddress: address,
      });

      console.log("Updated user data:", userData);
      setAmount("");
    } catch (error) {
      console.error("Supply error:", error);
      toast.error("Failed to supply wstETH");
    } finally {
      setIsSupplying(false);
    }
  };

  const handleSetMax = () => {
    if (balance) {
      setAmount(balance.formatted);
    }
  };

  if (!isConnected) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>AAVE Supply</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-sm text-muted-foreground">
            Please connect your wallet to supply assets
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>AAVE Supply</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Asset</label>
            <Select defaultValue="wsteth" disabled>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wsteth">wstETH</SelectItem>
              </SelectContent>
            </Select>
            <div className="mt-1 text-sm text-muted-foreground">
              Balance: {balance ? `${balance.formatted} wstETH` : "0 wstETH"}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Amount</label>
            <div className="relative">
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                min="0"
                step="0.01"
                disabled={isSupplying || isApproving}
              />
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-blue-500 hover:text-blue-700"
                onClick={handleSetMax}
                type="button"
              >
                MAX
              </button>
            </div>
          </div>

          {needsApproval ? (
            <Button
              className="w-full"
              onClick={handleApprove}
              disabled={isApproving || !amount || parseFloat(amount) <= 0}
            >
              {isApproving ? "Approving..." : "Approve wstETH"}
            </Button>
          ) : (
            <Button
              className="w-full"
              onClick={handleSupply}
              disabled={isSupplying || !amount || parseFloat(amount) <= 0}
            >
              {isSupplying ? "Supplying..." : "Supply"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
