'use server';

import dbConnect from './lib/dbConnect';
import Score from './models/Score';
import { revalidatePath } from 'next/cache';
import { v2 as cloudinary } from 'cloudinary';
// 設定 Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


// --- 修改 getScores 函式以支援分頁 ---
export async function getScores(options = {}) {
  const {
    titleKeyword = '',
    tagKeyword = '',
    page = 1,
    limit = 10 // 每頁預設顯示 10 筆
  } = options;

  try {
    await dbConnect();
    
    const query = {};
    if (titleKeyword) {
      query.songTitle = { $regex: titleKeyword, $options: 'i' };
    }
    if (tagKeyword) {
      query.tags = { $regex: tagKeyword.replace(/#/g, ''), $options: 'i' };
    }

    // 計算總筆數
    const totalScores = await Score.countDocuments(query);
    
    // 根據分頁參數查詢資料
    let scoresQuery = Score.find(query)
      .limit(limit)
      .skip((page - 1) * limit);

    // 只有在沒有標籤搜尋時才按創建時間排序，標籤搜尋時維持 MongoDB 的預設排序
    if (!tagKeyword) {
      scoresQuery = scoresQuery.sort({ createdAt: -1 });
    }

    const scores = await scoresQuery.lean();

    // 標籤搜尋的排序邏輯移到前端處理，以簡化後端分頁邏輯
    
    return {
      scores: JSON.parse(JSON.stringify(scores)),
      totalPages: Math.ceil(totalScores / limit),
      currentPage: page,
    };
  } catch (error) {
    console.error('Failed to get scores:', error);
    return { error: '讀取資料失敗', scores: [], totalPages: 0, currentPage: 1 };
  }
}
// --- 新增：獲取所有標籤的函式 ---
export async function getAllTags() {
  try {
    await dbConnect();
    // distinct 會找出所有不重複的 tags 值
    const allScores = await Score.find({ tags: { $ne: null, $ne: '' } }).select('tags').lean();
    const tagSet = new Set();
    allScores.forEach(score => {
      // 分割每個樂譜的標籤字串並加入 Set
      const tags = score.tags.split(/#|\s+/).filter(Boolean); // 用 # 或空白分割
      tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet);
  } catch (error) {
    console.error('Failed to get all tags:', error);
    return [];
  }
}
// --- 修改 addScore ---
export async function addScore(formData) {
  const scoreData = {
    songTitle: formData.get('songTitle'),
    storageLocation: formData.get('storageLocation'),
    tags: formData.get('tags'),
    presentationDate: formData.get('presentationDate'),
    remarks: formData.get('remarks'),
    coverUrl: formData.get('coverUrl'),
    coverPublicId: formData.get('coverPublicId'),
    videoUrl: formData.get('videoUrl'),
  };

  if (!scoreData.songTitle || !scoreData.storageLocation) {
    return { error: '樂曲名稱和存放位置為必填' };
  }

  try {
    await dbConnect();

    // --- 存放位置 (storageLocation) 重複性檢查 ---
    const existingScore = await Score.findOne({ storageLocation: scoreData.storageLocation });

    // 如果 "storageLocation" 已存在，則直接回傳錯誤，不做任何其他操作。
    if (existingScore) {
      return { 
        error: `新增失敗：存放位置 "${scoreData.storageLocation}" 已被樂曲 "${existingScore.songTitle}" 使用。`,
        field: 'storageLocation' 
      };
    }
    // --- 檢查結束 ---

    // 只有在所有檢查都通過後，才儲存新紀錄
    const newScore = new Score(scoreData);
    await newScore.save();
    
    revalidatePath('/');
    return { success: true, message: '新增成功' };
  } catch (error) {
    // 這裡的錯誤處理是針對 .save() 階段可能發生的其他錯誤 (如資料庫斷線)
    // 在這種罕見情況下，清理圖片是合理的，因為使用者無法輕易重試。
    if (formData.get('coverPublicId')) {
        await cloudinary.uploader.destroy(formData.get('coverPublicId'));
    }
    console.error('Failed to add score:', error);
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(e => e.message).join('\n');
        return { error: messages };
    }
    return { error: '新增失敗，發生未知錯誤。' };
  }
}

// --- 修改 updateScore ---
export async function updateScore(id, formData) {
  const scoreData = {
    songTitle: formData.get('songTitle'),
    storageLocation: formData.get('storageLocation'),
    tags: formData.get('tags'),
    presentationDate: formData.get('presentationDate'),
    remarks: formData.get('remarks'),
    coverUrl: formData.get('coverUrl'),
    coverPublicId: formData.get('coverPublicId'),
    videoUrl: formData.get('videoUrl'),
  };

  if (!scoreData.songTitle || !scoreData.storageLocation) {
    return { error: '樂曲名稱和存放位置為必填' };
  }

  try {
    await dbConnect();

    // --- 存放位置 (storageLocation) 重複性檢查 ---
    const conflictingScore = await Score.findOne({
      storageLocation: scoreData.storageLocation,
      _id: { $ne: id }
    });

    // 如果找到衝突的文件，直接回傳錯誤，不做任何其他操作。
    if (conflictingScore) {
      return { 
        error: `更新失敗：存放位置 "${scoreData.storageLocation}" 已被樂曲 "${conflictingScore.songTitle}" 使用。`,
        field: 'storageLocation'
      };
    }
    // --- 檢查結束 ---

    // --- 圖片資源管理 (只有在業務規則驗證通過後才執行) ---
    const currentScore = await Score.findById(id);
    if (!currentScore) {
      return { error: '找不到要更新的樂譜資料。' };
    }

    const isNewImageUploaded = scoreData.coverPublicId && scoreData.coverPublicId !== currentScore.coverPublicId;
    if (isNewImageUploaded && currentScore.coverPublicId) {
      // 成功更新時，如果上傳了新圖片，則刪除舊圖片
      await cloudinary.uploader.destroy(currentScore.coverPublicId);
    }
    // --- 圖片資源管理結束 ---

    // --- 執行資料庫更新 ---
    await Score.findByIdAndUpdate(id, scoreData);
    
    revalidatePath('/');
    return { success: true, message: '更新成功' };

  } catch (error) {
    console.error('Failed to update score:', error);
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(e => e.message).join('\n');
        return { error: messages };
    }
    return { error: '更新失敗，發生未知錯誤。' };
  }
}

// --- 修改 deleteScore ---
export async function deleteScore(id) {
  try {
    await dbConnect();
    const scoreToDelete = await Score.findById(id);
    if (!scoreToDelete) {
      return { error: '找不到要刪除的樂譜' };
    }

    // 如果有關聯的圖片，先從 Cloudinary 刪除
    if (scoreToDelete.coverPublicId) {
      await cloudinary.uploader.destroy(scoreToDelete.coverPublicId);
    }

    await Score.findByIdAndDelete(id);
    
    revalidatePath('/');
    return { success: true, message: '刪除成功' };
  } catch (error) {
    // ... 錯誤處理不變 ...
  }
}
