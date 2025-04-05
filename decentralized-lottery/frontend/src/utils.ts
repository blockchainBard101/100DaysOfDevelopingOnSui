import { SuiClient, getFullnodeUrl } from "@mysten/sui/client"
export const PACKAGE_ID = '0x893b3176866d975a0a6054ce0326b9ce28ea0a5f473f7908ff6c66d7252b185d';
export const OWNER_OBJECT_ID = '0xb8b7015adb1d6cab851f45e3f1fb31dd6c13703e9033273a0805860a1e4f0acd';
// export const UPGRADE_CAP = "0x733470a18ecbabdc265fe7f960caff7e08e65b6a5371c6e126d2fffdb6e9ba63"
export const PUBLISHER = "0xb77a1dab9e48a3a9ea5747889eb25c2ca2460d62b6110ce0270c231516d50316";

export const suiClient = new SuiClient({ url: getFullnodeUrl("testnet") });

export const apiUrl = "https://decentralized-lottery-backend.onrender.com/lotteries";