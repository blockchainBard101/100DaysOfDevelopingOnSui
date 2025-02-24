// app/providers.tsx (Client Component)
"use client";

import { WalletProvider, Chain, SuiTestnetChain } from "@suiet/wallet-kit";
import "@suiet/wallet-kit/style.css";

const customChain: Chain = {
  id: "",
  name: "",
  rpcUrl: "",
};

const SupportedChains: Chain[] = [
  SuiTestnetChain,
  // NOTE: you can add custom chain (network),
  // but make sure the connected wallet does support it
  // customChain,
];

export default function Providers({ children }: { children: React.ReactNode }) {
  return <WalletProvider chains={SupportedChains}>{children}</WalletProvider>;
}
