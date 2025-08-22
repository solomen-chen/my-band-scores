// 為了實現即時互動功能 (如彈出視窗、輸入狀態)，我們需要將此頁面設為客戶端元件
'use client';

import { useState, useEffect, useTransition } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { getScores, addScore, updateScore, deleteScore } from './actions';

// 主頁面元件
export default function HomePage() {
  const [scores, setScores] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // 彈出視窗狀態
  const [isOpen, setIsOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedScore, setSelectedScore] = useState(null);
  
  // 刪除確認對話框狀態
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [scoreToDelete, setScoreToDelete] = useState(null);

  // 載入資料
  const fetchScores = (currentKeyword) => {
    setIsLoading(true);
    startTransition(async () => {
      const result = await getScores(currentKeyword);
      if (result.error) {
        alert(result.error);
        setScores([]);
      } else {
        setScores(result);
      }
      setIsLoading(false);
    });
  };

  // 初始載入及搜尋時觸發
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchScores(keyword);
    }, 300); // Debounce: 延遲 300ms 執行搜尋，避免頻繁請求

    return () => {
      clearTimeout(handler);
    };
  }, [keyword]);

  // 開啟 Modal
  const openModal = (mode, score = null) => {
    setModalMode(mode);
    setSelectedScore(score);
    setIsOpen(true);
  };

  // 關閉 Modal
  const closeModal = () => {
    setIsOpen(false);
    setSelectedScore(null);
  };
  
  // 開啟刪除確認
  const openDeleteConfirm = (score) => {
    setScoreToDelete(score);
    setIsDeleteConfirmOpen(true);
  };

  // 關閉刪除確認
  const closeDeleteConfirm = () => {
    setIsDeleteConfirmOpen(false);
    setScoreToDelete(null);
  };

  // 執行刪除
  const handleDelete = async () => {
    if (!scoreToDelete) return;
    startTransition(async () => {
      await deleteScore(scoreToDelete._id);
      closeDeleteConfirm();
      fetchScores(keyword); // 重新載入資料
    });
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-700 dark:text-slate-200">樂團樂譜檢索系統</h1>
          <button
            onClick={() => openModal('add')}
            className="flex items-center gap-2 bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-indigo-700 transition-colors w-full sm:w-auto"
          >
            <PlusIcon className="h-5 w-5" />
            新增樂譜
          </button>
        </div>

        {/* 搜尋框 */}
        <div className="relative mb-6">
          <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 absolute top-1/2 left-3 -translate-y-1/2" />
          <input
            type="text"
            placeholder="輸入樂曲名稱關鍵字進行即時搜尋..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700"
          />
        </div>

        {/* 樂譜列表 */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">樂曲名稱</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">存放位置</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {(isLoading || isPending) ? (
                <tr>
                  <td colSpan="3" className="text-center py-10 text-slate-500">載入中...</td>
                </tr>
              ) : scores.length > 0 ? (
                scores.map((score) => (
                  <tr key={score._id}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{score.songTitle}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{score.storageLocation}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => openModal('edit', score)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 mr-4">
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button onClick={() => openDeleteConfirm(score)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200">
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="text-center py-10 text-slate-500">找不到符合條件的樂譜</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 新增/編輯 Modal */}
      <ScoreModal 
        isOpen={isOpen} 
        closeModal={closeModal} 
        mode={modalMode} 
        score={selectedScore}
        onSuccess={() => fetchScores(keyword)}
      />

      {/* 刪除確認 Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteConfirmOpen}
        closeModal={closeDeleteConfirm}
        onConfirm={handleDelete}
        isPending={isPending}
      />
    </div>
  );
}

// 新增/編輯表單 Modal 元件
function ScoreModal({ isOpen, closeModal, mode, score, onSuccess }) {
  const [isPending, startTransition] = useTransition();

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
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={closeModal}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
                  {mode === 'add' ? '新增樂譜' : '編輯樂譜'}
                </Dialog.Title>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <div>
                    <label htmlFor="songTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300">樂曲名稱</label>
                    <input
                      type="text"
                      name="songTitle"
                      id="songTitle"
                      required
                      maxLength="10"
                      defaultValue={score?.songTitle || ''}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-slate-700"
                    />
                  </div>
                  <div>
                    <label htmlFor="storageLocation" className="block text-sm font-medium text-gray-700 dark:text-gray-300">存放位置</label>
                    <input
                      type="text"
                      name="storageLocation"
                      id="storageLocation"
                      required
                      maxLength="4"
                      defaultValue={score?.storageLocation || ''}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-slate-700"
                    />
                  </div>
                  <div className="mt-6 flex justify-end gap-4">
                    <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-600 rounded-md hover:bg-gray-200 dark:hover:bg-slate-500">
                      取消
                    </button>
                    <button type="submit" disabled={isPending} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300">
                      {isPending ? '儲存中...' : '儲存'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

// 刪除確認 Modal 元件
function DeleteConfirmModal({ isOpen, closeModal, onConfirm, isPending }) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={closeModal}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
                  確認刪除
                </Dialog.Title>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    您確定要刪除這筆樂譜資料嗎？此操作無法復原。
                  </p>
                </div>
                <div className="mt-6 flex justify-end gap-4">
                  <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-600 rounded-md hover:bg-gray-200 dark:hover:bg-slate-500">
                    取消
                  </button>
                  <button type="button" onClick={onConfirm} disabled={isPending} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-red-300">
                    {isPending ? '刪除中...' : '確認刪除'}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
