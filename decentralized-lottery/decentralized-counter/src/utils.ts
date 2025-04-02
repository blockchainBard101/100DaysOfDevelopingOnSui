import { SuiClient, getFullnodeUrl } from "@mysten/sui/client"
export const PACKAGE_ID = '0xd4734b1f5a22d0fdcd86b556453a5d25c6f8af589b5ca3e4b84016b56f46d650';
export const OWNER_OBJECT_ID = '0xd6ea0aeb4ba27e5adb676ef2c15e84d254839f6cc6b3910902313c21ed360d8f';
// export const UPGRADE_CAP = "0xb70a362db9f3ab48b8d22bf2f7a49fc8cccea4fa165136f517ebed93b07e712d"


export const suiClient = new SuiClient({ url: getFullnodeUrl("testnet") });