pragma circom 2.1.5;

include "circomlib/circuits/babyjub.circom";

/*
 * Mạch chứng minh tính hợp lệ của quá trình tổng hợp phiếu bầu đồng cấu.
 */
template TallyValidity(nVoters, nCandidates) {
    // ---- INPUTS CÔNG KHAI ----
    signal input C1x[nVoters][nCandidates];
    signal input C1y[nVoters][nCandidates];
    signal input C2x[nVoters][nCandidates];
    signal input C2y[nVoters][nCandidates];

    signal input C1_total_x[nCandidates];
    signal input C1_total_y[nCandidates];
    signal input C2_total_x[nCandidates];
    signal input C2_total_y[nCandidates];

    // ---- SỬA LỖI 1: Khai báo toàn bộ signal và component ở đây (initial scope) ----
    
    // Tín hiệu tích lũy cho mỗi ứng viên
    // Cấu trúc: [candidate_index][voter_step]
    signal accC1x[nCandidates][nVoters + 1];
    signal accC1y[nCandidates][nVoters + 1];
    signal accC2x[nCandidates][nVoters + 1];
    signal accC2y[nCandidates][nVoters + 1];

    // Component cộng điểm cho mỗi cử tri của mỗi ứng viên
    // Cấu trúc: [candidate_index][voter_index]
    component addC1[nCandidates][nVoters];
    component addC2[nCandidates][nVoters];

    // ---- LOGIC TÍNH TOÁN VÀ RÀNG BUỘC ----

    // Vòng lặp ngoài: xử lý từng ứng viên
    for (var i = 0; i < nCandidates; i++) {
        
        // Khởi tạo điểm ban đầu cho ứng viên i là điểm đơn vị (0, 1)
        accC1x[i][0] <== 0;
        accC1y[i][0] <== 1;
        accC2x[i][0] <== 0;
        accC2y[i][0] <== 1;
        
        // Vòng lặp trong: cộng dồn ciphertext của từng cử tri
        for (var j = 0; j < nVoters; j++) {
            // SỬA LỖI 2: Sử dụng chỉ số [i][j] cho component
            addC1[i][j] = BabyAdd();
            // SỬA LỖI 3: Sử dụng chỉ số [i][j] và [i][j+1] cho tín hiệu tích lũy
            addC1[i][j].x1 <== accC1x[i][j];
            addC1[i][j].y1 <== accC1y[i][j];
            addC1[i][j].x2 <== C1x[j][i];
            addC1[i][j].y2 <== C1y[j][i];
            accC1x[i][j+1] <== addC1[i][j].xout;
            accC1y[i][j+1] <== addC1[i][j].yout;

            addC2[i][j] = BabyAdd();
            addC2[i][j].x1 <== accC2x[i][j];
            addC2[i][j].y1 <== accC2y[i][j];
            addC2[i][j].x2 <== C2x[j][i];
            addC2[i][j].y2 <== C2y[j][i];
            accC2x[i][j+1] <== addC2[i][j].xout;
            accC2y[i][j+1] <== addC2[i][j].yout;
        }

        // --- RÀNG BUỘC CUỐI CÙNG ---
        // SỬA LỖI 4: Sử dụng chỉ số [i][nVoters] cho kết quả cuối cùng
        accC1x[i][nVoters] === C1_total_x[i];
        accC1y[i][nVoters] === C1_total_y[i];
        accC2x[i][nVoters] === C2_total_x[i];
        accC2y[i][nVoters] === C2_total_y[i];
    }
}

// Giả sử có 3 cử tri và 10 ứng viên
component main = TallyValidity(3, 10);