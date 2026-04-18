import React, { useState, useEffect } from 'react';
import ReportForm from './components/ReportForm';
import AdminDashboard from './components/AdminDashboard';
import { Megaphone, LayoutDashboard, ShieldCheck, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'user' | 'admin'>('user');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <motion.header 
        layout
        className={`border-b-2 border-brand-primary bg-page-bg sticky top-0 z-50 flex justify-between items-end transition-all duration-500 ease-in-out ${
          isScrolled ? 'px-6 py-3 shadow-md' : 'px-10 py-5'
        }`}
      >
        <motion.div layout="position" className="origin-left">
          <motion.h1 
            layout="position"
            className={`font-serif font-extrabold tracking-tighter uppercase leading-none transition-all duration-500 ease-in-out ${
              isScrolled ? 'text-2xl' : 'text-4xl'
            }`}
          >
            Ajik Pantau
          </motion.h1>
          <div className="overflow-hidden">
            <div 
              className={`font-serif italic text-sm opacity-70 whitespace-nowrap transition-all duration-500 ease-in-out ${
                isScrolled ? 'max-h-0 opacity-0 mt-0' : 'max-h-10 opacity-100 mt-1'
              }`}
            >
              Infrastruktur Digital Untuk Aspirasi Rakyat
            </div>
          </div>
        </motion.div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-[1024px] mx-auto border-x border-border-subtle bg-white min-h-[calc(100vh-140px)]">
        <AnimatePresence mode="wait">
          {activeTab === 'user' ? (
            <motion.div
              key="form-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="p-10"
            >
              <div className="mb-10 text-center md:text-left">
                <h2 className="font-serif text-4xl md:text-5xl font-normal leading-tight">
                  Sampaikan Keluhan Anda
                </h2>
                <div className="h-0.5 w-20 bg-brand-primary mt-4 mb-6"></div>
                <p className="text-slate-500 max-w-xl">
                  Platform resmi pengaduan warga. Adukan masalah sampah, fasilitas sekolah, atau kejadian apa pun untuk segera tim Ajik Pantau selesaikan.
                </p>
              </div>
              <ReportForm onAdminTrigger={() => setActiveTab('admin')} />
            </motion.div>
          ) : (
            <motion.div
              key="admin-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="p-10"
            >
              <AdminDashboard />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="px-10 py-4 border-t border-border-subtle bg-page-bg flex justify-between items-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
        <div>&copy; 2026 Tim Aspirasi Ajik. Hak Cipta Dilindungi.</div>
        <div>Sistem Pelaporan Terpadu v1.1.0</div>
      </footer>
    </div>
  );
}
