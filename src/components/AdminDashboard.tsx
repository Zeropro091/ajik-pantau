import React, { useEffect, useState } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp, deleteDoc, getDocs, writeBatch, addDoc } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import { Report } from '../types';
import { 
  BarChart3, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  LogOut, 
  LogIn,
  MoreVertical,
  ExternalLink,
  Search,
  Calendar,
  User,
  Eye,
  X,
  Phone,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const isVideoUrl = (url: string) => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes('.mp4') || lowerUrl.includes('.webm') || lowerUrl.includes('.ogg') || lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be') || lowerUrl.includes('vimeo.com');
};

const safeUrl = (url: string) => {
  if (!url) return '#';
  if (url.startsWith('data:image/')) return url;
  try {
    const parsed = new URL(url);
    if (['http:', 'https:'].includes(parsed.protocol)) return url;
  } catch (e) {
    // ignore
  }
  return '#';
};

export default function AdminDashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const [reportToDelete, setReportToDelete] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Bootstrap admin email check
        const isBootstrapAdmin = ['putuari0911@gmail.com', 'sucayaputra8@gmail.com'].includes(u.email || '');
        
        try {
          const { getDoc } = await import('firebase/firestore');
          const adminDoc = await getDoc(doc(db, 'admins', u.uid));
          setIsAdmin(isBootstrapAdmin || adminDoc.exists());
        } catch (e) {
          setIsAdmin(isBootstrapAdmin);
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !isAdmin) return;

    const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Report[];
      setReports(data);
    });

    return () => unsubscribe();
  }, [user, isAdmin]);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const reportRef = doc(db, 'reports', id);
      await updateDoc(reportRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const confirmDelete = async () => {
    if (!reportToDelete) return;
    
    try {
      await deleteDoc(doc(db, 'reports', reportToDelete));
      if (selectedReport?.id === reportToDelete) {
        setSelectedReport(null);
      }
      setReportToDelete(null);
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('Gagal menghapus laporan. Pastikan Anda memiliki hak akses.');
      setReportToDelete(null);
    }
  };

  const handleDelete = (id: string) => {
    setReportToDelete(id);
  };

  const seedData = async () => {
    if (!window.confirm('PERINGATAN: Ini akan menghapus semua laporan saat ini dan menggantinya dengan data dummy. Lanjutkan?')) return;
    
    try {
      // 1. Delete existing reports
      const querySnapshot = await getDocs(collection(db, 'reports'));
      const batch = writeBatch(db);
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      // 2. Add dummy data
      const dummyReports = [
        {
          reporterName: 'Budi Santoso',
          reporterPhone: '081234567890',
          description: 'Terdapat tumpukan sampah liar di perempatan jalan Mawar. Baunya sangat menyengat dan mengganggu pengguna jalan. Harap segera ditindaklanjuti. Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
          status: 'pending',
          mediaType: 'none',
          mediaUrl: '',
        },
        {
          reporterName: 'Siti Aminah',
          reporterPhone: '081987654321',
          description: 'Lampu jalan di depan SDN 1 Cempaka mati sejak 2 minggu yang lalu. Kondisi jalan sangat gelap pada malam hari dan rawan kecelakaan. Sed tempor incididunt ut labore et dolore magna aliqua.',
          status: 'processing',
          mediaType: 'none',
          mediaUrl: '',
        },
        {
          reporterName: 'Agus Pratama',
          reporterPhone: '085678901234',
          description: 'Fasilitas mainan anak di taman kota banyak yang rusak dan berkarat. Sangat berbahaya bagi balita yang bermain. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore.',
          status: 'completed',
          mediaType: 'none',
          mediaUrl: '',
        },
        {
          reporterName: 'Linda Wijaya',
          reporterPhone: '081223344556',
          description: 'Pohon angsana tua di pinggir jalan Sudirman cabangnya sudah sangat menjorok ke aspal dan rawan tumbang menimpa kabel listrik. Excepteur sint occaecat cupidatat non proident.',
          status: 'pending',
          mediaType: 'none',
          mediaUrl: '',
        }
      ];

      for (const report of dummyReports) {
        await addDoc(collection(db, 'reports'), {
          ...report,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      alert('Berhasil mereset data!');
    } catch (error) {
      console.error('Error seeding data:', error);
      alert('Gagal mereset data. Pastikan Anda memiliki akses admin.');
    }
  };

  const login = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code === 'auth/popup-blocked') {
        alert('Browser Anda memblokir popup login. Harap izinkan popup untuk situs ini, atau buka aplikasi di tab baru.');
      } else if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        // User closed the popup before finishing, or a prior request was cancelled.
        // We can just ignore or show a small hint.
        console.warn('Login dibatalkan pengguna.');
      } else {
        alert('Terjadi kesalahan saat login: ' + error.message);
      }
    }
  };

  const logout = () => signOut(auth);

  if (loading) return (
    <div className="flex items-center justify-center p-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
    </div>
  );

  if (!user || !isAdmin) {
    return (
      <div className="max-w-md mx-auto p-12 bg-white rounded-2xl shadow-sm border border-slate-100 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          {!user ? 'Akses Terbatas' : 'Akses Ditolak'}
        </h2>
        <p className="text-slate-500 mb-8">
          {!user 
            ? 'Dashboard ini hanya dapat diakses oleh Admin atau Tim Ajik.' 
            : 'Akun Anda (' + user.email + ') tidak memiliki hak akses admin.'}
        </p>
        {!user ? (
          <button
            onClick={login}
            className="w-full py-3 px-6 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
          >
            <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
            Masuk dengan Google
          </button>
        ) : (
          <button
            onClick={logout}
            className="text-brand-primary font-bold uppercase text-xs tracking-widest hover:underline"
          >
            Keluar akun
          </button>
        )}
      </div>
    );
  }

  const filteredReports = reports.filter(r => filter === 'all' || r.status === filter);

  return (
    <div className="space-y-10">
      {/* Header Stat Bits */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-brand-primary pb-6">
        <div>
          <h2 className="font-serif text-3xl font-normal leading-tight">Panel Pantauan</h2>
          <p className="text-slate-500 text-sm mt-2">Kelola dan tindak lanjuti laporan dari warga.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="text-right">
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Status</span>
            <span className="text-xs font-bold text-brand-primary uppercase tracking-wider">{user.displayName}</span>
          </div>
          <button onClick={seedData} className="px-3 py-2 border border-brand-primary text-brand-primary font-bold hover:bg-brand-primary hover:text-white uppercase tracking-widest text-[10px] transition-all" title="Reset Data (Mock Data)">
            Reset Data
          </button>
          <button onClick={logout} className="p-2 border border-border-subtle hover:bg-slate-50 text-slate-400 hover:text-red-500 transition-all">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 border border-brand-primary bg-page-bg divide-x divide-brand-primary">
        <div className="p-6">
          <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Total Laporan</span>
          <div className="text-4xl font-serif">{reports.length}</div>
        </div>
        <div className="p-6">
          <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Dalam Proses</span>
          <div className="text-4xl font-serif text-orange-600">{reports.filter(r => r.status === 'processing').length}</div>
        </div>
        <div className="p-6">
          <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Selesai</span>
          <div className="text-4xl font-serif text-emerald-600">{reports.filter(r => r.status === 'completed').length}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border border-border-subtle bg-white p-1">
        {['all', 'pending', 'processing', 'completed'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
              filter === f 
                ? 'bg-brand-primary text-white' 
                : 'bg-white text-slate-400 hover:text-brand-primary'
            }`}
          >
            {f === 'all' ? 'Semua' : f === 'pending' ? 'Belum' : f === 'processing' ? 'Proses' : 'Selesai'}
          </button>
        ))}
      </div>

      {/* List Implementation (Editorial Style) */}
      <div className="space-y-2">
        {filteredReports.map((report) => (
          <motion.div 
            layout 
            key={report.id} 
            className="group flex flex-col md:flex-row md:items-center justify-between p-6 border border-border-subtle hover:border-brand-primary bg-white transition-all gap-4"
          >
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-sm ${
                  report.status === 'completed' ? 'bg-[#D2FFD2] text-[#008000]' :
                  report.status === 'processing' ? 'bg-[#FFF4D2] text-[#996500]' :
                  'bg-[#FFD2D2] text-[#D80000]'
                }`}>
                  {report.status === 'pending' ? 'Belum Diproses' : report.status === 'processing' ? 'Dalam Proses' : 'Selesai'}
                </span>
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                  ID: {report.id.slice(0, 8)}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 leading-snug">{report.description}</h3>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                <div className="flex items-center gap-1.5"><User className="w-3 h-3" /> {report.reporterName}</div>
                <div className="flex items-center gap-1.5 font-normal lowercase tracking-normal italic opacity-70">
                  {report.createdAt ? report.createdAt.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Sesaat yang lalu'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 self-end md:self-center">
              <button
                onClick={() => handleDelete(report.id)}
                className="text-[10px] flex items-center gap-2 font-black uppercase tracking-widest px-4 py-2 border border-border-subtle hover:text-red-500 transition-all hover:bg-slate-50"
                title="Hapus Laporan"
              >
                <Trash2 className="w-3 h-3" />
              </button>
              <button
                onClick={() => setSelectedReport(report)}
                className="text-[10px] flex items-center gap-2 font-black uppercase tracking-widest px-4 py-2 border border-border-subtle hover:border-brand-primary bg-white text-brand-primary transition-all hover:bg-slate-50"
              >
                <Eye className="w-3 h-3" /> Detail
              </button>
              <select
                value={report.status}
                onChange={(e) => handleStatusUpdate(report.id, e.target.value)}
                className="text-[10px] font-black uppercase tracking-widest px-4 py-2 border border-brand-primary bg-white focus:outline-none cursor-pointer transition-all hover:bg-slate-50"
              >
                <option value="pending">BELUM</option>
                <option value="processing">PROSES</option>
                <option value="completed">SELESAI</option>
              </select>
            </div>
          </motion.div>
        ))}
        {filteredReports.length === 0 && (
          <div className="py-20 border border-dashed border-border-subtle text-center italic text-slate-400 font-serif">
            Belum ada laporan yang sesuai kriteria ini.
          </div>
        )}
      </div>

      <div className="p-8 border border-border-subtle bg-slate-50/50 text-center font-serif italic text-sm text-slate-400">
        "Keadilan dan transparansi adalah pondasi kemajuan desa kita bersama."
      </div>

      <AnimatePresence>
        {reportToDelete && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border-2 border-brand-primary w-full max-w-sm p-6 shadow-2xl relative"
            >
              <h3 className="font-serif text-xl font-bold text-slate-900 mb-2">Hapus Laporan?</h3>
              <p className="text-slate-600 text-sm mb-6">Tindakan ini tidak dapat dibatalkan. Laporan akan dihapus secara permanen dari sistem.</p>
              <div className="flex gap-3 justify-end leading-none">
                <button
                  onClick={() => setReportToDelete(null)}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-3 h-3" /> Hapus
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedReport && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-white border-2 border-brand-primary w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b-2 border-brand-primary bg-page-bg">
                <div>
                  <h3 className="font-serif text-2xl">Detail Pelaporan</h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">
                    ID: {selectedReport.id}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleDelete(selectedReport.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors border border-transparent hover:border-red-100 mr-2"
                    title="Hapus Laporan"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setSelectedReport(null)}
                    className="p-2 text-slate-400 hover:text-brand-primary hover:bg-slate-100 transition-colors border border-transparent hover:border-border-subtle"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-8 overflow-y-auto space-y-8 flex-1">
                {/* Meta Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-border-subtle pb-8">
                  <div className="space-y-4">
                    <div>
                      <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nama Pelapor</span>
                      <div className="font-bold text-brand-primary">{selectedReport.reporterName}</div>
                    </div>
                    <div>
                      <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nomor Telepon</span>
                      <div className="font-mono text-sm flex items-center gap-2">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <a href={`https://wa.me/${selectedReport.reporterPhone.replace(/\\D/g, '')}`} target="_blank" rel="noreferrer" className="hover:text-brand-accent hover:underline">
                          {selectedReport.reporterPhone}
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4 space-y-reverse md:space-y-0 md:flex flex-col justify-between">
                    <div>
                      <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Waktu Masuk</span>
                      <div className="text-sm font-medium">
                        {selectedReport.createdAt ? selectedReport.createdAt.toDate().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' }) : 'Baru saja'}
                      </div>
                    </div>
                    <div>
                      <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status Saat Ini</span>
                      <select
                        value={selectedReport.status}
                        onChange={(e) => {
                          handleStatusUpdate(selectedReport.id, e.target.value);
                          setSelectedReport({...selectedReport, status: e.target.value as any});
                        }}
                        className="text-[10px] w-full max-w-[200px] font-black uppercase tracking-widest px-4 py-2 border border-brand-primary bg-white focus:outline-none cursor-pointer hover:bg-slate-50"
                      >
                        <option value="pending">BELUM DIPROSES</option>
                        <option value="processing">DALAM PROSES</option>
                        <option value="completed">SELESAI</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Deskripsi Kejadian</span>
                  <div className="bg-slate-50/50 border border-border-subtle p-6">
                    <p className="font-serif text-slate-800 leading-relaxed whitespace-pre-wrap">
                      {selectedReport.description}
                    </p>
                  </div>
                </div>

                {/* Media Attachment */}
                {selectedReport.mediaUrl && (
                  <div>
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Lampiran Bukti</span>
                    <div className="border border-border-subtle p-2 bg-slate-50 relative group">
                      <a href={safeUrl(selectedReport.mediaUrl)} target="_blank" rel="noreferrer" className="absolute top-4 right-4 bg-black/70 text-white p-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity" title="Buka di tab baru">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      {selectedReport.mediaType === 'video' || isVideoUrl(selectedReport.mediaUrl) ? (
                        <div className="aspect-video bg-black flex items-center justify-center relative">
                           {/* For external broad links like youtube, render a generic clickable fallback. Basic tags fall back naturally if failing */}
                           {selectedReport.mediaUrl.includes('youtube.com') || selectedReport.mediaUrl.includes('youtu.be') ? (
                             <a href={safeUrl(selectedReport.mediaUrl)} target="_blank" rel="noreferrer" className="text-white hover:underline flex items-center gap-2">
                                Buka Video YouTube <ExternalLink className="w-4 h-4" />
                             </a>
                           ) : (
                             <video controls className="w-full h-full object-contain">
                                <source src={safeUrl(selectedReport.mediaUrl)} />
                                Browser Anda tidak medukung tag video.
                             </video>
                           )}
                        </div>
                      ) : (
                        <img 
                          src={selectedReport.mediaUrl} 
                          alt="Bukti Lampiran Laporan" 
                          referrerPolicy="no-referrer"
                          className="w-full h-auto max-h-[400px] object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/placeholder/600/400';
                          }}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
