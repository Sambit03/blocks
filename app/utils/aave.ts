import { AaveV3Sepolia } from "@bgd-labs/aave-address-book";
import {
  type PublicClient,
  type WalletClient,
  type Address,
  formatUnits,
  parseUnits,
  createPublicClient,
  http,
} from "viem";
import { sepolia } from "viem/chains";
import POOL_ABI from "@/abi/POOL_ABI.json";

// Contract addresses
export const POOL_ADDRESS = AaveV3Sepolia.POOL;
export const POOL_ADDRESS_PROVIDER = AaveV3Sepolia.POOL_ADDRESSES_PROVIDER;

// Create a default public client
const defaultPublicClient = createPublicClient({
  chain: sepolia,
  transport: http(),
});

// ERC20 ABI for approvals
export const ERC20_ABI = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

interface UserAccountData {
  totalCollateralBase: bigint;
  totalDebtBase: bigint;
  availableBorrowsBase: bigint;
  currentLiquidationThreshold: bigint;
  ltv: bigint;
  healthFactor: bigint;
}

export async function checkAllowance({
  publicClient = defaultPublicClient,
  stEthAddress,
  userAddress,
}: {
  publicClient?: PublicClient;
  stEthAddress: Address;
  userAddress: Address;
}) {
  const allowance = await publicClient.readContract({
    address: stEthAddress,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [userAddress, POOL_ADDRESS],
  });

  return allowance;
}

export async function approveStEth({
  walletClient,
  stEthAddress,
  amount,
}: {
  walletClient: WalletClient;
  stEthAddress: Address;
  amount: bigint;
}) {
  const [address] = await walletClient.getAddresses();

  const hash = await walletClient.writeContract({
    address: stEthAddress,
    abi: ERC20_ABI,
    functionName: "approve",
    args: [POOL_ADDRESS, amount],
    account: address,
    chain: sepolia,
  });

  return hash;
}

export async function supplyStEth({
  walletClient,
  stEthAddress,
  amount,
}: {
  walletClient: WalletClient;
  stEthAddress: Address;
  amount: bigint;
}) {
  const [address] = await walletClient.getAddresses();

  const hash = await walletClient.writeContract({
    address: POOL_ADDRESS,
    abi: POOL_ABI,
    functionName: "supply",
    args: [stEthAddress, amount, address, 0],
    account: address,
    chain: sepolia,
  });

  return hash;
}

export async function getUserData({
  publicClient = defaultPublicClient,
  userAddress,
}: {
  publicClient?: PublicClient;
  userAddress: Address;
}): Promise<UserAccountData> {
  const data = (await publicClient.readContract({
    address: POOL_ADDRESS,
    abi: POOL_ABI,
    functionName: "getUserAccountData",
    args: [userAddress],
  })) as [bigint, bigint, bigint, bigint, bigint, bigint];

  return {
    totalCollateralBase: data[0],
    totalDebtBase: data[1],
    availableBorrowsBase: data[2],
    currentLiquidationThreshold: data[3],
    ltv: data[4],
    healthFactor: data[5],
  };
}

// Helper to format amounts
export function formatAmount(amount: bigint): string {
  return formatUnits(amount, 18); // assuming 18 decimals for stETH
}

// Helper to parse amounts
export function parseAmount(amount: string): bigint {
  return parseUnits(amount, 18);
}
