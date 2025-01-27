"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function LidoStakeBlock() {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"stake" | "wrap">("stake");

  const handleAction = async () => {
    try {
      setLoading(true);

      if (mode === "stake") {
        // TODO: Implement staking logic with Lido contract
        console.log("Staking", amount, "ETH");
      } else {
        // TODO: Implement wrapping logic
        console.log("Wrapping", amount, "stETH");
      }

      // Simulate transaction delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`${mode} error:`, error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Lido {mode === "stake" ? "Stake" : "Wrap"}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Tabs
            defaultValue="stake"
            onValueChange={(value) => setMode(value as "stake" | "wrap")}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="stake">Stake</TabsTrigger>
              <TabsTrigger value="wrap">Wrap</TabsTrigger>
            </TabsList>
            <TabsContent value="stake">
              <p className="text-sm text-muted-foreground mb-4">
                Stake your ETH to receive stETH
              </p>
            </TabsContent>
            <TabsContent value="wrap">
              <p className="text-sm text-muted-foreground mb-4">
                Wrap your stETH to receive wstETH
              </p>
            </TabsContent>
          </Tabs>

          <div>
            <label className="block text-sm font-medium mb-1">
              Amount ({mode === "stake" ? "ETH" : "stETH"})
            </label>
            <div className="relative">
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                min="0"
                step="0.01"
                disabled={loading}
              />
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-blue-500 hover:text-blue-700"
                onClick={() => setAmount("0.0")} // TODO: Set to max balance
              >
                MAX
              </button>
            </div>
          </div>

          <Button
            className="w-full"
            onClick={handleAction}
            disabled={loading || !amount || parseFloat(amount) <= 0}
          >
            {loading
              ? mode === "stake"
                ? "Staking..."
                : "Wrapping..."
              : mode === "stake"
              ? "Stake ETH"
              : "Wrap stETH"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
