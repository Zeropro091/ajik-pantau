import React, { useState, useRef } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Camera, Send, CheckCircle2, Loader2, Phone, User, FileText, Film, UploadCloud } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ReportForm({ onAdminTrigger }: { onAdminTrigger?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [formData, setFormData] = useState({
    reporterName: '',
    reporterPhone: '',
    description: '',
    mediaUrl: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isVideoUrl = (url: string) => {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    return lowerUrl.includes('.mp4') || lowerUrl.includes('.webm') || lowerUrl.includes('.ogg') || lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be') || lowerUrl.includes('vimeo.com');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, reporterName: value });
    if (value.toLowerCase() === 'admin' && onAdminTrigger) {
      onAdminTrigger();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Batasan ukuran file (Contoh: Max 5MB)
    const MAX_MB = 5;
    if (file.size > MAX_MB * 1024 * 1024) {
      alert(`Ukuran file terlalu besar! Maksimal ${MAX_MB}MB.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Hanya format gambar yang didukung untuk diunggah langsung.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploadLoading(true);

    try {
      // Kompresi gambar menggunakan Canvas agar muat di batas dokumen Firebase Firestore (1MB)
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Resize jika terlalu besar (Max lebar 1080px)
          const MAX_WIDTH = 1080;
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Render output JPEG berkualitas menengah-rendah
          const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
          
          setFormData((prev) => ({ ...prev, mediaUrl: dataUrl }));
          setUploadLoading(false);
        };
      };
      
      reader.onerror = () => {
        alert('Gagal membaca file.');
        setUploadLoading(false);
      };
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat memproses gambar.');
      setUploadLoading(false);
    }
  };

  const getDeviceFingerprint = () => {
    let fp = localStorage.getItem('ajik_pantau_fp');
    if (!fp) {
      fp = Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('ajik_pantau_fp', fp);
    }
    return fp;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let aiData = {
        categories: ["Lainnya"],
        priority: "Sedang",
        aiCategory: "Lainnya",
        aiSubCategory: "Lainnya",
        aiSentiment: "Pertanyaan",
        tags: ["lainnya"],
        aiSummary: formData.description.substring(0, 50) + "..."
      };
      
      try {
        const response = await fetch('/api/categorize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: formData.description })
        });
        if (response.ok) {
          const data = await response.json();
          aiData = { ...aiData, ...data };
        }
      } catch (catError) {
        console.error("Categorization error:", catError);
      }

      const docRef = await addDoc(collection(db, 'reports'), {
        ...formData,
        categories: aiData.categories,
        priority: aiData.priority,
        aiCategory: aiData.aiCategory,
        aiSubCategory: aiData.aiSubCategory,
        aiSentiment: aiData.aiSentiment,
        tags: aiData.tags,
        aiSummary: aiData.aiSummary,
        mediaType: formData.mediaUrl ? (isVideoUrl(formData.mediaUrl) ? 'video' : 'image') : 'none',
        status: 'pending',
        isPublic: true,
        trackingInfo: {
          fingerprint: getDeviceFingerprint(),
          userAgent: navigator.userAgent
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Save to localStorage for tracking
      const savedIds = JSON.parse(localStorage.getItem('my_reports') || '[]');
      savedIds.push(docRef.id);
      localStorage.setItem('my_reports', JSON.stringify(savedIds));

      setSuccess(true);
      setFormData({ reporterName: '', reporterPhone: '', description: '', mediaUrl: '' });
      setTimeout(() => setSuccess(false), 5000);
    } catch (error: any) {
      console.error('Error submitting report:', error);
      const isPermissionDenied = error.code === 'permission-denied';
      alert(isPermissionDenied ? 'Gagal mengirim laporan. Pastikan semua data yang dimasukkan valid (Nama min. 3 huruf, Telepon min. 5 angka, Deskripsi min. 5 huruf).' : 'Gagal mengirim laporan. Terjadi kesalahan pada server. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <AnimatePresence mode="wait">
        {success ? (
          <motion.div
            key="success-message"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ type: "spring", bounce: 0.5, duration: 0.6 }}
            className="py-16 px-8 border border-border-subtle bg-white text-center shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] relative overflow-hidden"
          >
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-primary via-emerald-500 to-brand-primary opacity-80"></div>
            
            <motion.div 
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", duration: 0.7, bounce: 0.5 }}
              className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            </motion.div>
            
            <motion.h3 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="font-serif text-3xl font-bold text-slate-900 mb-3"
            >
              Laporan Berhasil Terkirim!
            </motion.h3>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-slate-500 mb-8 max-w-sm mx-auto leading-relaxed"
            >
              Terima kasih atas kepedulian Anda. Laporan akan segera ditinjau oleh tim <strong className="text-brand-primary">Ajik Pantau</strong> untuk penanganan.
            </motion.p>
            
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              onClick={() => setSuccess(false)}
              className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold uppercase text-xs tracking-widest transition-all rounded-sm"
            >
              Kirim Laporan Lain
            </motion.button>
          </motion.div>
        ) : (
          <motion.form 
            key="report-form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit} 
            className="space-y-8"
          >
            <div className="space-y-6">
              <div className="field">
                <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-brand-primary mb-2">
                  Nama Lengkap
                </label>
                <input
                  required
                  type="text"
                  placeholder="Contoh: Budi Santoso"
                  className="w-full px-4 py-3 border border-border-subtle focus:border-brand-primary outline-none transition-all placeholder:text-slate-300"
                  value={formData.reporterName}
                  onChange={handleNameChange}
                />
              </div>

              <div className="field">
                <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-brand-primary mb-2">
                  Nomor Telepon (WhatsApp)
                </label>
                <input
                  required
                  type="tel"
                  placeholder="0812-xxxx-xxxx"
                  className="w-full px-4 py-3 border border-border-subtle focus:border-brand-primary outline-none transition-all placeholder:text-slate-300"
                  value={formData.reporterPhone}
                  onChange={(e) => setFormData({ ...formData, reporterPhone: e.target.value })}
                />
              </div>

              <div className="field">
                <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-brand-primary mb-2">
                  Deskripsi Laporan
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Ceritakan secara detail lokasi dan masalahnya..."
                  className="w-full px-4 py-3 border border-border-subtle focus:border-brand-primary outline-none transition-all resize-none placeholder:text-slate-300"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="field">
                <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-brand-primary mb-2">
                  Bukti Lampiran Laporan (Maks. 5 MB)
                </label>
                <div className="border border-dashed border-border-subtle p-6 bg-slate-50/50 text-center flex flex-col items-center">
                  
                  {/* Pilihan Unggah atau Link */}
                  <div className="flex flex-col sm:flex-row w-full gap-2 mb-4">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadLoading}
                      className="flex-1 px-4 py-2 bg-brand-primary text-white text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all disabled:opacity-50"
                    >
                      {uploadLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                      Unggah Gambar
                    </button>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    
                    <div className="flex items-center justify-center text-xs font-bold text-slate-300 uppercase px-2">ATAU</div>

                    <input
                      type="url"
                      placeholder="Masukkan link gambar/video..."
                      className="flex-1 px-4 py-2 border border-border-subtle bg-white focus:border-brand-primary outline-none transition-all placeholder:text-slate-300 text-sm"
                      value={formData.mediaUrl.startsWith('data:image') ? '' : formData.mediaUrl}
                      title={formData.mediaUrl.startsWith('data:image') ? 'Gambar telah diunggah' : undefined}
                      onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
                    />
                  </div>
                  
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                    {formData.mediaUrl.startsWith('data:image') 
                      ? "Gambar berhasil diunggah." 
                      : "Gunakan tombol unggah foto, ATAU berikan URL link media."}
                  </p>

                  {formData.mediaUrl && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 border border-border-subtle bg-white p-2 w-full max-w-sm mx-auto overflow-hidden shadow-sm"
                    >
                      {isVideoUrl(formData.mediaUrl) ? (
                        <div className="aspect-video bg-slate-100 flex items-center justify-center flex-col gap-2 text-slate-400">
                          <Film className="w-8 h-8" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Video Terdeteksi</span>
                        </div>
                      ) : (
                        <div className="aspect-video bg-slate-100 flex items-center justify-center overflow-hidden relative group/preview">
                          <img 
                            src={formData.mediaUrl} 
                            alt="Media Preview" 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/placeholder/400/300';
                            }}
                          />
                          {formData.mediaUrl.startsWith('data:image') && (
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, mediaUrl: '' }))}
                              className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white opacity-0 group-hover/preview:opacity-100 transition-opacity font-bold uppercase tracking-widest text-xs"
                            >
                              <UploadCloud className="w-6 h-6 mb-2" />
                              Hapus Gambar
                            </button>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="group w-full py-4 bg-brand-primary hover:bg-black text-white font-black uppercase tracking-[0.2em] text-sm transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5 relative -ml-2 -mt-0.5 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
              )}
              <span className="pl-2">{loading ? 'Mengirim...' : 'Kirim Laporan Sekarang'}</span>
            </button>
            <p className="text-center text-[10px] text-slate-400 italic">"Semua laporan akan ditindaklanjuti dalam waktu maksimal 2x24 jam."</p>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
