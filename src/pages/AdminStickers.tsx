import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Eye, EyeOff, Image as ImageIcon, Loader2, ArrowLeft, Lock } from 'lucide-react';
import { useStickerStore } from '../store/stickerStore';
import { fileService } from '../services/fileService';
import { useNavigate } from 'react-router-dom';
import type { StickerPack } from '../types/sticker';

export default function AdminStickers() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('sticker_admin_auth') === 'true');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  const { adminPacks, isLoading, fetchAllPacks, createPack, togglePack, toggleSticker, deleteSticker, addStickers } = useStickerStore();
  const [selectedPack, setSelectedPack] = useState<StickerPack | null>(null);
  const [newPackName, setNewPackName] = useState('');
  const [isUploadingPack, setIsUploadingPack] = useState(false);
  const [isUploadingStickers, setIsUploadingStickers] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const stickersInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllPacks();
    }
  }, [fetchAllPacks, isAuthenticated]);

  const currentPack = selectedPack ? adminPacks.find(p => p.id === selectedPack.id) : null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Mật khẩu cứng tạm thời. Trong thực tế nên gọi API để kiểm tra Role của User
    if (passwordInput === 'admin123') {
      sessionStorage.setItem('sticker_admin_auth', 'true');
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Mật khẩu không chính xác!');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-discord-dark rounded-2xl shadow-xl overflow-hidden p-8">
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Login</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-center text-sm">
              Trang quản lý Sticker yêu cầu quyền truy cập đặc biệt
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="Nhập mật khẩu (admin123)..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                autoFocus
              />
            </div>
            {authError && <p className="text-red-500 text-sm font-medium">{authError}</p>}
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-4 py-3 transition"
            >
              Mở Khóa Trang Quản Trị
            </button>
            <button
              type="button"
              onClick={() => navigate('/chat')}
              className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl px-4 py-3 transition"
            >
              Quay lại Chat
            </button>
          </form>
        </div>
      </div>
    );
  }


  const handleCreatePack = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !newPackName.trim()) return;

    try {
      setIsUploadingPack(true);
      const res = await fileService.uploadFile(file);
      await createPack(newPackName.trim(), res.data.url);
      setNewPackName('');
    } catch (error) {
      console.error('Failed to create pack', error);
      alert('Tạo bộ sticker thất bại');
    } finally {
      setIsUploadingPack(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handleAddStickers = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedPack || !e.target.files?.length) return;

    try {
      setIsUploadingStickers(true);
      const files = Array.from(e.target.files);
      const resArray = await Promise.all(files.map(f => fileService.uploadFile(f)));
      const urls = resArray.map(r => r.data.url);
      await addStickers(selectedPack.id, urls);
    } catch (error) {
      console.error('Failed to add stickers', error);
      alert('Thêm sticker thất bại');
    } finally {
      setIsUploadingStickers(false);
      if (stickersInputRef.current) stickersInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 p-6 flex flex-col items-center">
      <div className="w-full max-w-5xl bg-white dark:bg-discord-dark rounded-2xl shadow-xl overflow-hidden flex flex-col h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/chat')} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition">
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Quản lý Stickers</h1>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Sidebar - Pack List */}
          <div className="w-80 border-r border-gray-200 dark:border-zinc-800 flex flex-col bg-gray-50/50 dark:bg-zinc-900/50">
            <div className="p-4 border-b border-gray-200 dark:border-zinc-800">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Thêm bộ mới</h2>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Tên bộ sticker..."
                  value={newPackName}
                  onChange={(e) => setNewPackName(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={() => coverInputRef.current?.click()}
                  disabled={!newPackName.trim() || isUploadingPack}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg px-3 py-2 text-sm font-medium transition"
                >
                  {isUploadingPack ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Tạo Bộ Mới (Chọn Ảnh Bìa)
                </button>
                <input type="file" ref={coverInputRef} onChange={handleCreatePack} className="hidden" accept="image/*" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {isLoading && adminPacks.length === 0 ? (
                <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
              ) : (
                adminPacks.map(pack => (
                  <div
                    key={pack.id}
                    onClick={() => setSelectedPack(pack)}
                    className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition ${
                      selectedPack?.id === pack.id ? 'bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30' : 'hover:bg-gray-100 dark:hover:bg-zinc-800 border border-transparent'
                    } ${!pack.isActive ? 'opacity-60' : ''}`}
                  >
                    <img src={pack.coverUrl} alt={pack.name} className="w-12 h-12 rounded-lg object-cover bg-white" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">{pack.name}</p>
                      <p className="text-xs text-gray-500">{pack.stickers.length} stickers</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); togglePack(pack.id, !pack.isActive); }}
                      className={`p-1.5 rounded-lg transition ${pack.isActive ? 'text-green-600 hover:bg-green-100 dark:hover:bg-green-500/20' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700'}`}
                      title={pack.isActive ? 'Đang hiện' : 'Đang ẩn'}
                    >
                      {pack.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Main Content - Sticker Grid */}
          <div className="flex-1 flex flex-col bg-white dark:bg-discord-dark">
            {currentPack ? (
              <>
                <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between bg-gray-50 dark:bg-zinc-900">
                  <div className="flex items-center gap-3">
                    <img src={currentPack.coverUrl} alt={currentPack.name} className="w-10 h-10 rounded-lg object-cover bg-white" />
                    <div>
                      <h2 className="font-bold text-lg text-gray-900 dark:text-white">{currentPack.name}</h2>
                      <p className="text-sm text-gray-500">{currentPack.stickers.length} stickers</p>
                    </div>
                  </div>
                  <button
                    onClick={() => stickersInputRef.current?.click()}
                    disabled={isUploadingStickers}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition"
                  >
                    {isUploadingStickers ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                    Thêm Stickers
                  </button>
                  <input type="file" ref={stickersInputRef} onChange={handleAddStickers} multiple className="hidden" accept="image/*" />
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  {currentPack.stickers.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                      <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
                      <p>Chưa có sticker nào trong bộ này</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-4">
                      {currentPack.stickers.map(sticker => (
                        <div key={sticker.id} className={`group relative aspect-square rounded-xl border-2 ${sticker.isActive ? 'border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900' : 'border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 opacity-75'}`}>
                          <img src={sticker.stickerUrl} alt="Sticker" className="w-full h-full object-contain p-2 drop-shadow-sm" />
                          
                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
                            <button
                              onClick={() => toggleSticker(currentPack.id, sticker.id, !sticker.isActive)}
                              className={`p-2 rounded-full ${sticker.isActive ? 'bg-gray-200 hover:bg-white text-gray-900' : 'bg-green-500 hover:bg-green-400 text-white'}`}
                              title={sticker.isActive ? 'Ẩn sticker' : 'Hiện sticker'}
                            >
                              {sticker.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Bạn có chắc chắn muốn xoá sticker này?')) {
                                  deleteSticker(currentPack.id, sticker.id);
                                }
                              }}
                              className="p-2 rounded-full bg-red-500 hover:bg-red-400 text-white"
                              title="Xoá vĩnh viễn"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
                <p>Chọn một bộ sticker bên trái để xem chi tiết</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
