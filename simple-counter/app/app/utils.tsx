import axios from "axios";
const SUI_RPC_URL = `https://fullnode.testnet.sui.io:443`;

export async function getObject(objectId : string) {
  console.log(`Fetching object: ${objectId}`);
  try {
    const requestData = {
      jsonrpc: "2.0",
      id: 1,
      method: "sui_getObject",
      params: [
        objectId,
        {
          showType: true,
          showOwner: true,
          showPreviousTransaction: true,
          showDisplay: false,
          showContent: true,
          showBcs: false,
          showStorageRebate: true,
        },
      ],
    };
    const response = await axios.post(SUI_RPC_URL, requestData);

    // console.log("Response data:", response.data);
    if (response.data.result && response.data.result.data) {
      const res = response.data.result.data.content.fields.value;
      return res;
    } else {
      console.log("⚠️ Object not found or error:", response.data);
      return 0;
    }
  } catch (error) {
    console.error("❌ Error fetching dynamic field object:", error);
    return 0;
  }
}
