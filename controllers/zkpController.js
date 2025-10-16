const ZKPService = require('../services/zkpService');

const verifyValidVote = async (req, res) => {
    try {
        const { proof, publicSignals,voteData } = req.body;
        const result = await ZKPService.verifyValidVote(proof, publicSignals, voteData);
        return result.EC === 0 
            ? res.success(null, result.EM)
            : res.error(result.EC, result.EM);  
    } catch (error) {
        console.error("Error in verifyValidVote controller:", error);
        return res.InternalError();  
    }
}

const verifyValidCipherAll = async (req, res) => {
    try {
        const result = await ZKPService.verifyValidCipherAll();
        return result.EC === 0 
            ? res.success(null, result.EM)
            : res.error(result.EC, result.EM);  
    } catch (error) {
        console.error("Error in verifyValidCipherAll controller:", error);
        return res.InternalError();  
    }       
}

module.exports = {
    verifyValidVote,
    verifyValidCipherAll
}   