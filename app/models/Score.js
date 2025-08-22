import mongoose from 'mongoose';

const ScoreSchema = new mongoose.Schema({
  songTitle: {
    type: String,
    required: [true, '樂曲名稱為必填欄位'],
    trim: true,
    maxlength: [10, '樂曲名稱不能超過 10 個字']
  },
  storageLocation: {
    type: String,
    required: [true, '存放位置為必填欄位'],
    trim: true,
    maxlength: [4, '存放位置不能超過 4 個字']
  },
  // --- 新增欄位 ---
  tags: {
    type: String,
    trim: true,
    maxlength: [50, '屬性標籤不能超過 50 個字']
  }
}, {
  timestamps: true
});

export default mongoose.models.Score || mongoose.model('Score', ScoreSchema);
