// =======================================================
// ✅ TallyValidityWithCommit.circom (Circom 2.1.5)
// Kiểm tra:
//   1️⃣ Tổng hợp ciphertext (C1, C2) hợp lệ
//   2️⃣ Hash chain Poseidon đúng và trùng với hashOnChain
// =======================================================

pragma circom 2.1.5;

include "circomlib/circuits/babyjub.circom";
include "circomlib/circuits/poseidon.circom";

/*
 * Template chính:
 *  - nVoters: số cử tri
 *  - nCandidates: số ứng viên
 */
template TallyValidityWithCommit(nVoters, nCandidates) {
    // --- INPUT ---
    signal input C1x[nVoters][nCandidates];
    signal input C1y[nVoters][nCandidates];
    signal input C2x[nVoters][nCandidates];
    signal input C2y[nVoters][nCandidates];
    signal input C1_total_x[nCandidates];
    signal input C1_total_y[nCandidates];
    signal input C2_total_x[nCandidates];
    signal input C2_total_y[nCandidates];
    signal input hashOnChain;   // Giá trị commit on-chain

    // --- OUTPUT ---
    signal output hashCipherAll; // Hash tính lại trong proof

    // =======================================================
    // 1️⃣ Kiểm tra tổng hợp ciphertext (C1, C2)
    // =======================================================
    signal accC1x[nCandidates][nVoters + 1];
    signal accC1y[nCandidates][nVoters + 1];
    signal accC2x[nCandidates][nVoters + 1];
    signal accC2y[nCandidates][nVoters + 1];

    component addC1[nCandidates][nVoters];
    component addC2[nCandidates][nVoters];

    for (var i = 0; i < nCandidates; i++) {
        // Điểm khởi tạo (0, 1)
        accC1x[i][0] <== 0;
        accC1y[i][0] <== 1;
        accC2x[i][0] <== 0;
        accC2y[i][0] <== 1;

        // Cộng tuần tự các C1, C2 của từng voter
        for (var j = 0; j < nVoters; j++) {
            addC1[i][j] = BabyAdd();
            addC1[i][j].x1 <== accC1x[i][j];
            addC1[i][j].y1 <== accC1y[i][j];
            addC1[i][j].x2 <== C1x[j][i];
            addC1[i][j].y2 <== C1y[j][i];
            accC1x[i][j + 1] <== addC1[i][j].xout;
            accC1y[i][j + 1] <== addC1[i][j].yout;

            addC2[i][j] = BabyAdd();
            addC2[i][j].x1 <== accC2x[i][j];
            addC2[i][j].y1 <== accC2y[i][j];
            addC2[i][j].x2 <== C2x[j][i];
            addC2[i][j].y2 <== C2y[j][i];
            accC2x[i][j + 1] <== addC2[i][j].xout;
            accC2y[i][j + 1] <== addC2[i][j].yout;
        }

        // So sánh với tổng cuối cùng đã công khai
        accC1x[i][nVoters] === C1_total_x[i];
        accC1y[i][nVoters] === C1_total_y[i];
        accC2x[i][nVoters] === C2_total_x[i];
        accC2y[i][nVoters] === C2_total_y[i];
    }

    // =======================================================
    // 2️⃣ Tính lại hashCipherAll bằng Poseidon chain
    // =======================================================
    var FZERO = 0;

    // acc[j][i] lưu trạng thái hash chain của từng voter
    signal acc[nVoters][nCandidates + 1];

    // Khởi tạo acc[j][0] = 0
    for (var j = 0; j < nVoters; j++) {
        acc[j][0] <== FZERO;
    }

    // Khai báo component Poseidon
    component pose[nVoters][nCandidates];
    component chain[nVoters][nCandidates];

    // Hash từng ciphertext và chain theo thứ tự (voter, candidate)
    for (var j = 0; j < nVoters; j++) {
        for (var i = 0; i < nCandidates; i++) {
            pose[j][i] = Poseidon(4);
            pose[j][i].inputs[0] <== C1x[j][i];
            pose[j][i].inputs[1] <== C1y[j][i];
            pose[j][i].inputs[2] <== C2x[j][i];
            pose[j][i].inputs[3] <== C2y[j][i];

            chain[j][i] = Poseidon(2);
            chain[j][i].inputs[0] <== acc[j][i];
            chain[j][i].inputs[1] <== pose[j][i].out;

            acc[j][i + 1] <== chain[j][i].out;
        }
    }

// =======================================================
// 3️⃣ Gộp hash của tất cả voter lại
// =======================================================

signal accGlobalStep[nVoters + 1];
accGlobalStep[0] <== FZERO;

component chainFinal[nVoters];

for (var j = 0; j < nVoters; j++) {
    chainFinal[j] = Poseidon(2);
    chainFinal[j].inputs[0] <== accGlobalStep[j];
    chainFinal[j].inputs[1] <== acc[j][nCandidates];
    accGlobalStep[j + 1] <== chainFinal[j].out;
}

// Kết quả cuối cùng
signal accGlobal;
accGlobal <== accGlobalStep[nVoters];

hashCipherAll <== accGlobal;
hashCipherAll === hashOnChain;

}

// -----------------------------------------------------------
// Main instance
// -----------------------------------------------------------
component main = TallyValidityWithCommit(5000, 5);
