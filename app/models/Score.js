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
  },
  // --- 新增欄位 ---
  presentationDate: {
    type: String, // 儲存為 YYYY-MM-DD 格式的字串
  },
  remarks: {
    type: String,
    trim: true,
    maxlength: [50, '備註不能超過 50 個字']
  },
  coverUrl: { // 儲存圖片的 URL
    type: String,
  },
  coverPublicId: { // 儲存圖片在 Cloudinary 的 Public ID，用於刪除
    type: String,
  },
  videoUrl: {
    type: String,
    trim: true, // 自動移除前後空白
  },
}, {
  timestamps: true
});

export default mongoose.models.Score || mongoose.model('Score', ScoreSchema);
