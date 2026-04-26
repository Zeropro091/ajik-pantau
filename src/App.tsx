import React, { useState, useEffect } from 'react';
import ReportForm from './components/ReportForm';
import AdminDashboard from './components/AdminDashboard';
import PublicFeed from './components/PublicFeed';
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
          isScrolled ? 'px-6 py-3 md:px-6 shadow-md' : 'px-6 py-5 md:px-10'
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
              className="p-6 md:p-10 flex flex-col md:flex-row gap-12"
            >
              <div className="md:w-5/12 flex flex-col">
                <div className="mb-8 md:mb-10 text-center md:text-left">
                  <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-normal leading-tight">
                    Sampaikan Keluhan Anda
                  </h2>
                  <div className="mx-auto md:mx-0 h-0.5 w-16 md:w-20 bg-brand-primary mt-6 md:mt-8 mb-6"></div>
                  <p className="text-slate-500 text-sm md:text-base px-2 md:px-0">
                    Platform resmi pengaduan warga. Adukan masalah sampah, fasilitas sekolah, atau kejadian apa pun untuk segera tim Ajik Pantau selesaikan.
                  </p>
                </div>
                <div className="hidden md:block">
                  <PublicFeed />
                </div>
              </div>
              <div className="md:w-7/12">
                <ReportForm onAdminTrigger={() => setActiveTab('admin')} />
                <div className="md:hidden mt-8 border-t border-border-subtle pt-6">
                  <PublicFeed />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="admin-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="p-4 sm:p-6 md:p-10"
            >
              <AdminDashboard />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="px-6 md:px-10 py-4 md:py-6 border-t border-border-subtle bg-page-bg flex flex-col md:flex-row justify-between items-center gap-2 text-center md:text-left text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-wider">
        <div>&copy; 2026 Tim Aspirasi Ajik. Hak Cipta Dilindungi.</div>
        <div>Sistem Pelaporan Terpadu v1.1.0</div>
      </footer>
    </div>
  );
}
