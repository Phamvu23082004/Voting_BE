const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');

/**
 * Hash public key (buffer output)
 */
function hashPublicKey(publicKey) {
  return keccak256(publicKey);
}

/**
 * Build Merkle Tree từ danh sách hashed_key
 */
function buildMerkleTree(hashedKeys) {
  const leaves = hashedKeys.map(k => Buffer.from(k, 'hex'));
  return new MerkleTree(leaves, keccak256, { sortPairs: true });
}

/**
 * Lấy Merkle Root từ tree
 */
function getMerkleRoot(tree) {
  return tree.getHexRoot();
}

/**
 * Lấy proof cho 1 leaf
 */
function getProof(tree, hashedKey) {
  const leaf = Buffer.from(hashedKey, 'hex');
  return tree.getHexProof(leaf);
}

/**
 * Verify proof
 */
function verifyProof(proof, root, hashedKey) {
  const leaf = Buffer.from(hashedKey, 'hex');
  return MerkleTree.verify(proof, leaf, root, keccak256, { sortPairs: true });
}

module.exports = {
  hashPublicKey,
  buildMerkleTree,
  getMerkleRoot,
  getProof,
  verifyProof
};
