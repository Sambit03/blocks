import { http, createConfig } from "wagmi";
import { holesky } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

// Your WalletConnect project ID (get one from cloud.walletconnect.com)
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

export const config = createConfig({
  chains: [holesky],
  transports: {
    [holesky.id]: http(),
  },
  connectors: [injected(), walletConnect({ projectId })],
});
