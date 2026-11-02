/**
 * Local hash publisher. Swap `publishRecord` for a web3/Hyperledger client later
 * without changing donation or expense routes.
 */
async function publishRecord({ type, recordId, hash, payload, txRef }) {
  return {
    published: false,
    network: process.env.CHAIN_NETWORK || "local-sha256",
    type,
    recordId,
    hash,
    txRef,
    payload,
  };
}

module.exports = { publishRecord };
