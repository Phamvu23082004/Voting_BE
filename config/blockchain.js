// const { ethers } = require('ethers');

// // Kết nối tới Ethereum blockchain
// const provider = new ethers.JsonRpcProvider('http://localhost:7545');
// const wallet = new ethers.Wallet('0x7118a87f0dc8449c8018f800c2a779f5c4273c3a459cfb992ff304a10a4428f6', provider);
// const contractAddress = 'YOUR_CONTRACT_ADDRESS';
// const abi = [
//     "function setMerkleRoot(bytes32 root) public",
//     "function submitVote(bytes32 _ciphertext, bytes32 _proof, bytes32 _nullifier) public",
//     "function getElectionResult() public view returns (string)"
// ];
// const contract = new ethers.Contract(contractAddress, abi, wallet);

// exports.publishMerkleRoot = async (merkleRoot) => {
//     const tx = await contract.setMerkleRoot(merkleRoot);
//     await tx.wait();
//     return tx.hash;
// };

// exports.submitVote = async (ciphertext, proof, nullifier) => {
//     const tx = await contract.submitVote(ciphertext, proof, nullifier);
//     await tx.wait();
//     return tx.hash;
// };

// exports.getElectionResult = async () => {
//     const result = await contract.getElectionResult();
//     return result;
// };
