const mongoose = require('mongoose');

const voterPathSchema = new mongoose.Schema({
    public_key: { type: String, required: true },
    voter: { 
        type: mongoose.Schema.Types.ObjectId, // Reference tới ID của bảng elections
        required: true,
        ref: 'Voter' // Tham chiếu tới model Election
    },
    is_valid: { type: Boolean, default: false }
});

const Voter = mongoose.model('VoterPath', voterPathSchema);

module.exports = Voter;
