const mongoose = require('mongoose');

// Schema cho cuộc bầu cử
const electionSchema = new mongoose.Schema({
    election_id: { 
        type: String, 
        required: true, 
        unique: true,  // Đảm bảo election_id là duy nhất
    },
    name: { 
        type: String, 
        required: true,  // Tên cuộc bầu cử
    },
    start_date: { 
        type: Date, 
        required: true,  // Thời gian bắt đầu
    },
    end_date: { 
        type: Date, 
        required: true,  // Thời gian kết thúc
    },
    status: { 
        type: String, 
        enum: ['active', 'ended'],  // Trạng thái cuộc bầu cử
        default: 'active',
    },
    merkle_root: { 
        type: String, 
        default: null  // Root Merkle Tree sau khi finalize
    }
}, {
    timestamps: true,
});

electionSchema.index({ election_id: 1 }, { unique: true });

const Election = mongoose.model('Election', electionSchema);
module.exports = Election;
