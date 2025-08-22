'use client';

import { useState, useEffect, useTransition, Fragment } from 'react';
import { Dialog, Combobox } from '@headlessui/react';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline';
import { getScores, addScore, updateScore, deleteScore, getAllTags } from './actions';

// 主頁面元件
export default function HomePage() {
  // --- 狀態管理 ---
  const [scores, setScores] = useState([]);
  const [titleKeyword, setTitleKeyword] = useState('');
  const [tagKeyword, setTagKeyword] = useState('');
  const [allTags, setAllTags] = useState([]); // 所有標籤列表
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

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
  const fetchScores = (pageToFetch = 1) => {
    setIsLoading(true);
    startTransition(async () => {
      const result = await getScores({ 
        titleKeyword, 
        tagKeyword, 
        page: pageToFetch 
      });
      if (result.error) {
        alert(result.error);
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

  const fetchAllTags = async () => {
    const tags = await getAllTags();
    setAllTags(tags);
  };

  // 初始載入
  useEffect(() => {
    fetchScores(1);
    fetchAllTags();
  }, []);

  // 搜尋時觸發 (重置到第一頁)
  useEffect(() => {
    const handler = setTimeout(() => {
      setCurrentPage(1); // 任何搜尋都應該回到第一頁
      fetchScores(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [titleKeyword, tagKeyword]);

  // --- 事件處理 ---
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchScores(newPage);
    }
  };

  const handleTagClick = (tag) => {
    setTagKeyword(tag); // 點擊標籤，自動填入並觸發搜尋
  };

  const handleSuccess = () => {
    fetchScores(currentPage); // 操作成功後，重新整理當前頁
    fetchAllTags(); // 並更新標籤列表
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
        {/* ... Header and Search Bar (不變) ... */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-700 dark:text-slate-200">樂團樂譜檢索系統</h1>
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

        {/* --- 樂譜列表 (加入可點擊標籤) --- */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            {/* ... thead (不變) ... */}
            <thead className="bg-slate-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">樂曲名稱</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">存放位置</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">屬性</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {(isLoading || isPending) ? (
                <tr><td colSpan="4" className="text-center py-10 text-slate-500">載入中...</td></tr>
              ) : scores.length > 0 ? (
                scores.map((score) => (
                  <tr key={score._id}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{score.songTitle}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{score.storageLocation}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {score.tags && score.tags.split(/#|\s+/).filter(Boolean).map(tag => (
                          <button 
                            key={tag} 
                            onClick={() => handleTagClick(tag)}
                            className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800 transition-colors"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => openModal('edit', score)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 mr-4"><PencilIcon className="h-5 w-5" /></button>
                      <button onClick={() => openDeleteConfirm(score)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200"><TrashIcon className="h-5 w-5" /></button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="4" className="text-center py-10 text-slate-500">找不到符合條件的樂譜</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- 分頁元件 --- */}
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
      </div>

      {/* --- Modals (傳入 allTags) --- */}
      <ScoreModal isOpen={isModalOpen} closeModal={closeModal} mode={modalMode} score={selectedScore} onSuccess={handleSuccess} allTags={allTags} />
      <DeleteConfirmModal isOpen={isDeleteConfirmOpen} closeModal={closeDeleteConfirm} onConfirm={handleDelete} isPending={isPending} />
    </div>
  );
}

// --- 新增：分頁元件 ---
function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <nav className="flex items-center justify-center mt-6" aria-label="Pagination">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300"
      >
        上一頁
      </button>
      {pageNumbers.map(number => (
        <button
          key={number}
          onClick={() => onPageChange(number)}
          className={`-ml-px relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
            currentPage === number
              ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600 dark:bg-indigo-900'
              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300'
          }`}
        >
          {number}
        </button>
      ))}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="-ml-px relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300"
      >
        下一頁
      </button>
    </nav>
  );
}

// --- 修改 ScoreModal 以支援標籤建議 ---
function ScoreModal({ isOpen, closeModal, mode, score, onSuccess, allTags }) {
  const [isPending, startTransition] = useTransition();
  const [tagQuery, setTagQuery] = useState(''); // 用於 Combobox 的查詢狀態

  const filteredTags =
    tagQuery === ''
      ? allTags
      : allTags.filter((tag) =>
          tag.toLowerCase().includes(tagQuery.toLowerCase())
        );

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    startTransition(async () => {
      const action = mode === 'add' ? addScore(formData) : updateScore(score._id, formData);
      const result = await action;
      if (result?.error) {
        alert(result.error);
      } else {
        onSuccess();
        closeModal();
      }
    });
  };

  return (
    <Dialog open={isOpen} onClose={closeModal} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 text-left align-middle shadow-xl transition-all data-[closed]:opacity-0 data-[closed]:scale-95 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in">
          <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
            {mode === 'add' ? '新增樂譜' : '編輯樂譜'}
          </Dialog.Title>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* ... songTitle and storageLocation fields (不變) ... */}
            <div>
              <label htmlFor="songTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300">樂曲名稱</label>
              <input type="text" name="songTitle" id="songTitle" required maxLength="10" defaultValue={score?.songTitle || ''} className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-slate-700" />
            </div>
            <div>
              <label htmlFor="storageLocation" className="block text-sm font-medium text-gray-700 dark:text-gray-300">存放位置</label>
              <input type="text" name="storageLocation" id="storageLocation" required maxLength="4" defaultValue={score?.storageLocation || ''} className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-slate-700" />
            </div>
            
            {/* --- 使用 Combobox 實現標籤建議 --- */}
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300">屬性標籤</label>
              <Combobox defaultValue={score?.tags || ''}>
                <div className="relative mt-1">
                  <Combobox.Input
                    name="tags"
                    id="tags"
                    maxLength="50"
                    placeholder="例如: #感恩 #讚美 #節慶"
                    className="w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-slate-700"
                    onChange={(event) => setTagQuery(event.target.value.split(/#|\s+/).pop())}
                  />
                  <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </Combobox.Button>
                </div>
                <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-auto overflow-auto rounded-md bg-white dark:bg-slate-700 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                  {filteredTags.length === 0 && tagQuery !== '' ? (
                    <div className="relative cursor-default select-none py-2 px-4 text-gray-700 dark:text-gray-300">
                      找不到標籤
                    </div>
                  ) : (
                    filteredTags.map((tag) => (
                      <Combobox.Option
                        key={tag}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-10 pr-4 ${
                            active ? 'bg-indigo-600 text-white' : 'text-gray-900 dark:text-gray-200'
                          }`
                        }
                        value={tag}
                      >
                        {({ selected, active }) => (
                          <>
                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                              {tag}
                            </span>
                          </>
                        )}
                      </Combobox.Option>
                    ))
                  )}
                </Combobox.Options>
              </Combobox>
            </div>

            <div className="mt-6 flex justify-end gap-4">
              <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-600 rounded-md hover:bg-gray-200 dark:hover:bg-slate-500">取消</button>
              <button type="submit" disabled={isPending} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300">{isPending ? '儲存中...' : '儲存'}</button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

// DeleteConfirmModal 元件保持不變
function DeleteConfirmModal({ isOpen, closeModal, onConfirm, isPending }) {
  // ... 程式碼不變 ...
  return (
    <Dialog open={isOpen} onClose={closeModal} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 text-left align-middle shadow-xl transition-all data-[closed]:opacity-0 data-[closed]:scale-95 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in">
          <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
            確認刪除
          </Dialog.Title>
          <div className="mt-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              您確定要刪除這筆樂譜資料嗎？此操作無法復原。
            </p>
          </div>
          <div className="mt-6 flex justify-end gap-4">
            <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-600 rounded-md hover:bg-gray-200 dark:hover:bg-slate-500">取消</button>
            <button type="button" onClick={onConfirm} disabled={isPending} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-red-300">{isPending ? '刪除中...' : '確認刪除'}</button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
