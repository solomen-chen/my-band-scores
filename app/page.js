// app/page.js

'use client';

import { useState, useEffect, useTransition, Fragment } from 'react';
import { Dialog, Combobox, ComboboxOptions, ComboboxOption } from '@headlessui/react';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, ChevronUpDownIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import { PhotoIcon } from '@heroicons/react/24/solid';
import { getScores, addScore, updateScore, deleteScore, getAllTags } from './actions';
import { XMarkIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast'; // 2. 導入 toast

// 主頁面元件
export default function HomePage() {
  // --- 狀態管理 ---
  const [scores, setScores] = useState([]);
  const [titleKeyword, setTitleKeyword] = useState('');
  const [tagKeyword, setTagKeyword] = useState('');
  const [allTags, setAllTags] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [lightboxImage, setLightboxImage] = useState(null);
  const [sortBy, setSortBy] = useState('title'); // 預設：樂曲名稱排序

  // 分頁狀態
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // Modal 狀態
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedScore, setSelectedScore] = useState(null);
  
  // 刪除確認 Modal 狀態
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [scoreToDelete, setScoreToDelete] = useState(null);

  // --- 資料獲取 ---
  const fetchScores = (pageToFetch = 1, sortField = sortBy) => {
    setIsLoading(true);
    startTransition(async () => {
      const result = await getScores({
        titleKeyword,
        tagKeyword,
        sortBy: sortField,
        page: pageToFetch
      });
      if (result.error) {
        toast.error(`讀取資料失敗: ${result.error}`);
        setScores([]);
        setTotalPages(0);
      } else {
        setScores(result.scores);
        setTotalPages(result.totalPages);
        setCurrentPage(result.currentPage);
      }
      setIsLoading(false);
    });
  };

  const handleSortChange = (field) => {
    if (field === sortBy) return; // 已經是目前排序，不用重抓
    setSortBy(field);
    setCurrentPage(1);
    fetchScores(1, field);
  };

  const fetchAllTags = async () => {
    const tags = await getAllTags();
    setAllTags(tags);
  };

  // 初始載入
  useEffect(() => {
    fetchScores(1, sortBy);
    fetchAllTags();
  }, []);

  // 搜尋時觸發 (重置到第一頁)
  useEffect(() => {
    const handler = setTimeout(() => {
      setCurrentPage(1);
      fetchScores(1, sortBy);
    }, 300);
    return () => clearTimeout(handler);
  }, [titleKeyword, tagKeyword]);

  // --- 事件處理 ---
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchScores(newPage, sortBy);
    }
  };

  const handleTagClick = (tag) => {
    setTagKeyword(tag);
  };

  const handleSuccess = () => {
    fetchScores(currentPage, sortBy);
    fetchAllTags();
  };

  // --- Modal 控制 ---
  const openModal = (mode, score = null) => {
    setModalMode(mode);
    setSelectedScore(score);
    setIsModalOpen(true);
  };
  const closeModal = () => setIsModalOpen(false);
  const openDeleteConfirm = (score) => {
    setScoreToDelete(score);
    setIsDeleteConfirmOpen(true);
  };
  const closeDeleteConfirm = () => setIsDeleteConfirmOpen(false);
  const handleDelete = async () => {
    if (!scoreToDelete) return;
    startTransition(async () => {
      await deleteScore(scoreToDelete._id);
      closeDeleteConfirm();
      handleSuccess();
    });
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-700 dark:text-slate-200">
              斗南長老教會樂譜檢索系統
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              斗南教會聖歌隊詩歌樂譜檢索查詢工具，快速找到樂譜存放位置與獻詩紀錄。
            </p>
          </div>
          <button onClick={() => openModal('add')} className="flex items-center gap-2 bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-indigo-700 transition-colors w-full sm:w-auto">
            <PlusIcon className="h-5 w-5" />
            新增樂譜
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 absolute top-1/2 left-3 -translate-y-1/2" />
            <input type="text" placeholder="依樂曲名稱搜尋..." value={titleKeyword} onChange={(e) => setTitleKeyword(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700" />
          </div>
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 absolute top-1/2 left-3 -translate-y-1/2" />
            <input type="text" placeholder="依屬性標籤搜尋 (如: 喪禮)..." value={tagKeyword} onChange={(e) => setTagKeyword(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-slate-700" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-700">
              <tr>
                <SortableHeader label="樂曲名稱" field="title" sortBy={sortBy} onClick={handleSortChange} />
                <SortableHeader label="存放位置" field="location" sortBy={sortBy} onClick={handleSortChange} />
                <SortableHeader label="最近獻詩日" field="date" sortBy={sortBy} onClick={handleSortChange} />
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">備註</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">屬性</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {(isLoading || isPending) ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-slate-500">
                    資料排序 / 載入中，請稍候...
                  </td>
                </tr>
              ) : scores.length > 0 ? (
                scores.map((score) => (
                  <tr key={score._id}>
                    {/* --- 修改 "樂曲名稱" 欄位 --- */}
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      {score.coverUrl ? (
                        // 如果有封面，則渲染為可點擊的按鈕
                        <button
                          onClick={() => setLightboxImage(score.coverUrl)}
                          className="text-left hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus:outline-none"
                        >
                          {score.songTitle}
                        </button>
                      ) : (
                        // 如果沒有封面，則只顯示文字
                        <span>{score.songTitle}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{score.storageLocation}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{score.presentationDate}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 max-w-xs truncate" title={score.remarks}>
                      {score.remarks}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {score.tags && score.tags.split(/#|\s+/).filter(Boolean).map(tag => (
                          <button key={tag} onClick={() => handleTagClick(tag)} className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800 transition-colors">
                            {tag}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {score.videoUrl && (
                        <a href={score.videoUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 mr-4">
                          <VideoCameraIcon className="h-5 w-5" />
                        </a>
                      )}
                      <button onClick={() => openModal('edit', score)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 mr-4"><PencilIcon className="h-5 w-5" /></button>
                      <button onClick={() => openDeleteConfirm(score)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200"><TrashIcon className="h-5 w-5" /></button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" className="text-center py-10 text-slate-500">找不到符合條件的樂譜</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
      </div>

      <ScoreModal isOpen={isModalOpen} closeModal={closeModal} mode={modalMode} score={selectedScore} onSuccess={handleSuccess} allTags={allTags} />
      <Lightbox src={lightboxImage} onClose={() => setLightboxImage(null)} />
      <DeleteConfirmModal isOpen={isDeleteConfirmOpen} closeModal={closeDeleteConfirm} onConfirm={handleDelete} isPending={isPending} />
    </div>
  );
}
function SortableHeader({ label, field, sortBy, onClick }) {
  const isActive = sortBy === field;
  return (
    <th
      onClick={() => onClick(field)}
      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer select-none transition-colors
        ${isActive
          ? 'text-indigo-600 dark:text-indigo-400 font-bold'
          : 'text-slate-500 dark:text-slate-300 hover:text-indigo-500'}`}
      title={`點擊依${label}排序`}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive && <span>▾</span>}
      </span>
    </th>
  );
}

function Lightbox({ src, onClose }) {
  if (!src) return null;

  return (
    // 使用 Dialog 來處理焦點管理和背景遮罩
    <Dialog open={!!src} onClose={onClose} className="relative z-50">
      {/* 背景遮罩 */}
      <div className="fixed inset-0 bg-black/60" aria-hidden="true" />

      {/* 圖片容器 */}
      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <Dialog.Panel className="relative">
          <img src={src} alt="Enlarged score cover" className="max-h-[90vh] max-w-[90vw] object-contain" />
          {/* 關閉按鈕 */}
          <button
            onClick={onClose}
            className="absolute -top-4 -right-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/40 focus:outline-none"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav className="flex items-center justify-center mt-6" aria-label="Pagination">
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300">
        上一頁
      </button>
      {pageNumbers.map(number => (
        <button key={number} onClick={() => onPageChange(number)} className={`-ml-px relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === number ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600 dark:bg-indigo-900' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300'}`}>
          {number}
        </button>
      ))}
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="-ml-px relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300">
        下一頁
      </button>
    </nav>
  );
}

function ScoreModal({ isOpen, closeModal, mode, score, onSuccess, allTags }) {
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  
  // --- 使用 State 管理所有表單欄位 ---
  const [songTitle, setSongTitle] = useState('');
  const [storageLocation, setStorageLocation] = useState('');
  const [tags, setTags] = useState('');
  const [presentationDate, setPresentationDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [coverPublicId, setCoverPublicId] = useState('');
  const [videoUrl, setVideoUrl] = useState(''); // 包含影片連結的 state
  // --- State 用於儲存 "原始" 資料，以便還原 ---
  const [originalScore, setOriginalScore] = useState(null);
  const [tagQuery, setTagQuery] = useState('');

  useEffect(() => {
    // 當 Modal 開啟時，設定 "當前" 狀態和 "原始" 狀態
    if (isOpen) {
      const initialScore = mode === 'edit' ? score : {};
      
      setSongTitle(initialScore?.songTitle || '');
      setStorageLocation(initialScore?.storageLocation || '');
      setTags(initialScore?.tags || '');
      setPresentationDate(initialScore?.presentationDate || '');
      setRemarks(initialScore?.remarks || '');
      setCoverUrl(initialScore?.coverUrl || '');
      setCoverPublicId(initialScore?.coverPublicId || '');
      setVideoUrl(initialScore?.videoUrl || '');
      
      // 如果是編輯模式，就將原始資料存起來
      setOriginalScore(mode === 'edit' ? initialScore : null);

      setTagQuery('');
    }
  }, [isOpen, score, mode]);

  const filteredTags = tagQuery === '' ? allTags : allTags.filter((tag) => tag.toLowerCase().includes(tagQuery.toLowerCase()));

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);
    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: formData } );
      const data = await response.json();
      if (data.secure_url) {
        setCoverUrl(data.secure_url);
        setCoverPublicId(data.public_id);
      } else { throw new Error('Upload failed'); }
    } catch (error) {
      toast.error('圖片上傳失敗，請稍後再試。');
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    // 將所有 state 的值加入 FormData
    formData.append('songTitle', songTitle);
    formData.append('storageLocation', storageLocation);
    formData.append('tags', tags);
    formData.append('presentationDate', presentationDate);
    formData.append('remarks', remarks);
    formData.append('coverUrl', coverUrl);
    formData.append('coverPublicId', coverPublicId);
    formData.append('videoUrl', videoUrl); // 加入影片連結

    startTransition(async () => {
      const action = mode === 'add' ? addScore(formData) : updateScore(score._id, formData);
      const result = await action;
      if (result?.error) {
        // --- 關鍵：精準還原的邏輯 ---
        toast.error(result.error); // 這裡直接顯示後端傳來的錯誤訊息

        // 2. 檢查後端是否傳來了是哪個 "field" 出錯
        if (result.field) {
          // 3. 使用 switch 結構，方便未來擴充其他欄位的驗證
          switch (result.field) {
            case 'storageLocation':
              // 4. 只還原 storageLocation 這一個欄位
              if (mode === 'edit' && originalScore) {
                // 在編輯模式下，還原為進入編輯前的原始值
                setStorageLocation(originalScore.storageLocation);
              } else {
                // 在新增模式下，直接清空錯誤的值
                setStorageLocation('');
              }
              break;
            
            // case 'anotherField':
            //   // 未來若有其他欄位的唯一性驗證，可在此擴充
            //   // setAnotherField(originalScore.anotherField);
            //   break;

            default:
              // 如果是未知的欄位錯誤，不做任何操作，以保留使用者輸入
              break;
          }
        }
        // 如果後端沒有提供 field 標記 (例如通用錯誤或網路錯誤)，
        // 我們也不做任何還原操作，以避免意外丟失使用者輸入。
        
      } else {
        // --- 新增：操作成功時也給予提示 ---
        toast.success(result.message || (mode === 'add' ? '新增成功！' : '更新成功！'));
        // 更新成功
        onSuccess();
        closeModal();
      }
    });
  };

  return (
    <Dialog open={isOpen} onClose={closeModal} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <div className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 text-left align-middle shadow-xl transition-all data-[closed]:opacity-0 data-[closed]:scale-95 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in">
          <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
            {mode === 'add' ? '新增樂譜' : '編輯樂譜'}
          </h3>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* --- 這裡包含了所有被遺漏的欄位 --- */}
            <div>
              <label htmlFor="songTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300">樂曲名稱</label>
              <input type="text" id="songTitle" required maxLength="10" value={songTitle} onChange={(e) => setSongTitle(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-slate-700" />
            </div>
            <div>
              <label htmlFor="storageLocation" className="block text-sm font-medium text-gray-700 dark:text-gray-300">存放位置</label>
              <input type="text" id="storageLocation" required maxLength="4" value={storageLocation} onChange={(e) => setStorageLocation(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-slate-700" />
            </div>
            <div>
              <label htmlFor="tags-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300">屬性標籤</label>
              <Combobox value={tags} onChange={setTags} onClose={() => setTagQuery('')}>
                <div className="relative mt-1">
                  <input id="tags-input" maxLength="50" placeholder="例如: #感恩 #讚美 #節慶" className="w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-slate-700 pr-10" onChange={(event) => { setTags(event.target.value); setTagQuery(event.target.value.split(/#|\s+/).pop()); }} value={tags} />
                  <button type="button" className="absolute inset-y-0 right-0 flex items-center pr-2"><ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" /></button>
                </div>
                <ComboboxOptions anchor="bottom" className="absolute z-20 mt-1 max-h-60 w-[var(--input-width)] overflow-auto rounded-md bg-white dark:bg-slate-700 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                  {filteredTags.length === 0 && tagQuery !== '' ? (<div className="relative cursor-default select-none py-2 px-4 text-gray-700 dark:text-gray-300">可直接輸入新標籤</div>) : (filteredTags.map((tag) => (<ComboboxOption key={tag} className="group relative cursor-default select-none py-2 pl-10 pr-4 data-[focus]:bg-indigo-600 data-[focus]:text-white text-gray-900 dark:text-gray-200" value={tag}><span className="block truncate group-data-[selected]:font-medium">{tag}</span></ComboboxOption>)))}
                </ComboboxOptions>
              </Combobox>
            </div>
            <div>
              <label htmlFor="presentationDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">獻詩日</label>
              <input type="date" id="presentationDate" value={presentationDate} onChange={(e) => setPresentationDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-slate-700" />
            </div>
            <div>
              <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 dark:text-gray-300">備註</label>
              <textarea id="remarks" rows="2" maxLength="50" value={remarks} onChange={(e) => setRemarks(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-slate-700"></textarea>
            </div>
            
            {/* --- 新增的影片連結輸入框 --- */}
            <div>
              <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">影片連結 (YouTube)</label>
              <input type="url" id="videoUrl" placeholder="https://www.youtube.com/watch?v=..." value={videoUrl} onChange={(e ) => setVideoUrl(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-slate-700" />
            </div>

            {/* --- 封面欄位 --- */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">封面</label>
              <div className="mt-2 flex items-center gap-x-3">
                {coverUrl ? (<img src={coverUrl} alt="Cover preview" className="h-16 w-16 object-cover rounded-md" />) : (<div className="h-16 w-16 bg-slate-200 dark:bg-slate-700 rounded-md flex items-center justify-center"><PhotoIcon className="h-8 w-8 text-slate-400" /></div>)}
                <label htmlFor="file-upload" className="cursor-pointer rounded-md bg-white dark:bg-slate-600 px-2.5 py-1.5 text-sm font-semibold text-gray-900 dark:text-gray-200 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-slate-500 hover:bg-gray-50 dark:hover:bg-slate-500">
                  {isUploading ? '上傳中...' : '更換圖片'}
                </label>
                <input id="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" disabled={isUploading} />
              </div>
            </div>

            {/* --- 按鈕 --- */}
            <div className="mt-6 flex justify-end gap-4">
              <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-600 rounded-md hover:bg-gray-200 dark:hover:bg-slate-500">取消</button>
              <button type="submit" disabled={isPending || isUploading} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed">
                {isPending ? '儲存中...' : '儲存'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Dialog>
  );
}
function DeleteConfirmModal({ isOpen, closeModal, onConfirm, isPending }) {
  return (
    <Dialog open={isOpen} onClose={closeModal} className="relative z-50">
      {/* 背景遮罩 */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* 對話框容器 */}
      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        {/* 移除 Dialog.Panel，改用 div */}
        <div className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 text-left align-middle shadow-xl transition-all data-[closed]:opacity-0 data-[closed]:scale-95 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in">
          {/* 移除 Dialog.Title，改用 h3 */}
          <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
            確認刪除
          </h3>
          <div className="mt-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              您確定要刪除這筆樂譜資料嗎？此操作無法復原。
            </p>
          </div>
          <div className="mt-6 flex justify-end gap-4">
            <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-600 rounded-md hover:bg-gray-200 dark:hover:bg-slate-500">取消</button>
            <button type="button" onClick={onConfirm} disabled={isPending} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-red-300">
              {isPending ? '刪除中...' : '確認刪除'}
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
