// app/layout.js

import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast'; // 1. 導入 Toaster

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: '樂譜檢索', // 這是您之前設定的標題
  description: '斗南長老教會聖歌隊樂譜檢索系統',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* 2. 將 Toaster 元件放在這裡 */}
        {/* 它可以接收一些全域設定，例如位置、樣式等 */}
        <Toaster 
          position="top-center" // 顯示在頂部中間
          reverseOrder={false}
          toastOptions={{
            // 定義通用的樣式
            style: {
              background: '#333',
              color: '#fff',
            },
            // 定義成功和錯誤的預設樣式
            success: {
              duration: 3000,
              theme: {
                primary: 'green',
                secondary: 'black',
              },
            },
            error: {
              duration: 5000, // 錯誤訊息顯示久一點
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}