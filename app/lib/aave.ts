import { Pool } from "@aave/contract-helpers";

const poolAddress = "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2"; // Mainnet AAVE V3
const wethGatewayAddress = "0xD322A49006FC828F9B5B37Ab215F99B4E5caB19C"; // WETH Gateway

export const getAavePool = (provider: unknown) => {
  return new Pool(provider, {
    POOL: poolAddress,
    WETH_GATEWAY: wethGatewayAddress,
  });
};
