'use server'; // 標記此檔案中的所有函式為 Server Actions

import dbConnect from './lib/dbConnect';
import Score from './models/Score';
import { revalidatePath } from 'next/cache';

// 查詢樂譜 (包含關鍵字搜尋)
export async function getScores(keyword = '') {
  try {
    await dbConnect();
    
    const query = keyword 
      ? { songTitle: { $regex: keyword, $options: 'i' } } // 'i' 表示不分大小寫
      : {};

    const scores = await Score.find(query).sort({ createdAt: -1 });
    
    // 將 Mongoose 文件轉換為普通 JS 物件
    return JSON.parse(JSON.stringify(scores));
  } catch (error) {
    console.error('Failed to get scores:', error);
    return { error: '讀取資料失敗' };
  }
}

// 新增樂譜
export async function addScore(formData) {
  const songTitle = formData.get('songTitle');
  const storageLocation = formData.get('storageLocation');

  if (!songTitle || !storageLocation) {
    return { error: '所有欄位皆為必填' };
  }

  try {
    await dbConnect();
    const newScore = new Score({ songTitle, storageLocation });
    await newScore.save();
    
    revalidatePath('/'); // 清除快取，讓頁面重新拉取最新資料
    return { success: true, message: '新增成功' };
  } catch (error) {
    console.error('Failed to add score:', error);
    return { error: '新增失敗' };
  }
}

// 更新樂譜
export async function updateScore(id, formData) {
  const songTitle = formData.get('songTitle');
  const storageLocation = formData.get('storageLocation');

  if (!songTitle || !storageLocation) {
    return { error: '所有欄位皆為必填' };
  }

  try {
    await dbConnect();
    await Score.findByIdAndUpdate(id, { songTitle, storageLocation });
    
    revalidatePath('/');
    return { success: true, message: '更新成功' };
  } catch (error) {
    console.error('Failed to update score:', error);
    return { error: '更新失敗' };
  }
}

// 刪除樂譜
export async function deleteScore(id) {
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
