import { AaveV3Sepolia } from "@bgd-labs/aave-address-book";

export const CONTRACTS = {
  POOL: AaveV3Sepolia.POOL,
  POOL_ADDRESS_PROVIDER: AaveV3Sepolia.POOL_ADDRESSES_PROVIDER,
  WSTETH: "0x8d09a4502Cc8Cf1547aD300E066060D043f6982D",
} as const;
