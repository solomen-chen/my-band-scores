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
  }
}, {
  timestamps: true // 自動新增 createdAt 和 updatedAt 時間戳
});

// 為了防止在 Next.js 的熱重載環境中重複編譯模型，我們需要做此判斷
export default mongoose.models.Score || mongoose.model('Score', ScoreSchema);

