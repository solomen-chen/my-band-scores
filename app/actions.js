'use server';

import dbConnect from './lib/dbConnect';
import Score from './models/Score';
import { revalidatePath } from 'next/cache';

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
// --- 修改 addScore 函式 ---
export async function addScore(formData) {
  const songTitle = formData.get('songTitle');
  const storageLocation = formData.get('storageLocation');
  const tags = formData.get('tags');

  if (!songTitle || !storageLocation) {
    return { error: '樂曲名稱和存放位置為必填' };
  }

  try {
    await dbConnect();

    // --- 新增：檢查存放位置是否重複 ---
    const existingScore = await Score.findOne({ storageLocation });
    if (existingScore) {
      return { error: `新增失敗：存放位置 "${storageLocation}" 已被樂曲 "${existingScore.songTitle}" 使用。` };
    }
    // --- 檢查結束 ---

    const newScore = new Score({ songTitle, storageLocation, tags });
    await newScore.save();
    
    revalidatePath('/');
    return { success: true, message: '新增成功' };
  } catch (error) {
    // 處理 Mongoose 的驗證錯誤，使其更友好
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(e => e.message).join('\n');
        return { error: messages };
    }
    console.error('Failed to add score:', error);
    return { error: '新增失敗，發生未知錯誤。' };
  }
}

// --- 修改 updateScore 函式 ---
export async function updateScore(id, formData) {
  const songTitle = formData.get('songTitle');
  const storageLocation = formData.get('storageLocation');
  const tags = formData.get('tags');

  if (!songTitle || !storageLocation) {
    return { error: '樂曲名稱和存放位置為必填' };
  }

  try {
    await dbConnect();

    // --- 新增：檢查存放位置是否與其他樂譜重複 ---
    // 1. 根據 ID 找到正在編輯的樂譜的原始資料
    const currentScore = await Score.findById(id);
    if (!currentScore) {
        return { error: '找不到要更新的樂譜資料。' };
    }

    // 2. 判斷存放位置是否被修改
    if (currentScore.storageLocation !== storageLocation) {
      // 3. 如果被修改了，檢查新的存放位置是否已被其他樂譜使用
      const existingScore = await Score.findOne({ 
        storageLocation: storageLocation,
        _id: { $ne: id } // 關鍵：查詢條件為 storageLocation 是新的，且 _id 不是當前正在編輯的這一筆
      });

      if (existingScore) {
        return { error: `更新失敗：存放位置 "${storageLocation}" 已被樂曲 "${existingScore.songTitle}" 使用。` };
      }
    }
    // --- 檢查結束 ---

    await Score.findByIdAndUpdate(id, { songTitle, storageLocation, tags });
    
    revalidatePath('/');
    return { success: true, message: '更新成功' };
  } catch (error) {
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(e => e.message).join('\n');
        return { error: messages };
    }
    console.error('Failed to update score:', error);
    return { error: '更新失敗，發生未知錯誤。' };
  }
}

// deleteScore 函式保持不變
export async function deleteScore(id) {
  // ... 程式碼不變 ...
  try {
    await dbConnect();
    await Score.findByIdAndDelete(id);
    
    revalidatePath('/');
    return { success: true, message: '刪除成功' };
  } catch (error) {
    console.error('Failed to delete score:', error);
    return { error: '刪除失敗' };
  }
}
