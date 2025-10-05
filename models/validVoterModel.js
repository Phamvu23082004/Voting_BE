const mongoose = require('mongoose');

// Schema cho cử tri hợp lệ
const validVoterSchema = new mongoose.Schema({
    cccd: { 
        type: String, 
        required: true, 
        unique: true,  // Đảm bảo CCCD là duy nhất 57632457823546 
    },
    election_id: { 
        type: String, 
        required: true,  // Mã cuộc bầu cử elc1 elc2
    },
    is_valid: { 
        type: Boolean, 
        default: true,  // Trạng thái hợp lệ của cử tri
    },
}, {
    timestamps: true,  // Tự động thêm trường createdAt và updatedAt
});

// // Tạo index cho cccd và election_id để tối ưu truy vấn
// validVoterSchema.index({ cccd: 1, election_id: 1 }, { unique: true });

const ValidVoter = mongoose.model('ValidVoter', validVoterSchema);
    
module.exports = ValidVoter;
