import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { Report } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function PublicFeed() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    // Only query where status is in the allowed list to satisfy Firestore security rules
    let q = query(
      collection(db, 'reports'),
      where('isPublic', '==', true),
      where('status', 'in', ['pending', 'processing', 'completed']),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Report[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Report);
      });
      setReports(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching public reports:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Compute available categories from fetched reports
  const availableCategories = Array.from(new Set(reports.flatMap(r => r.categories || (r.category ? [r.category] : [])))).filter(c => c && c !== 'Other');

  const filteredReports = selectedCategory 
    ? reports.filter(r => (r.categories && r.categories.includes(selectedCategory)) || r.category === selectedCategory)
    : reports;


  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-3 h-3 text-emerald-500" />;
      case 'processing': return <Clock className="w-3 h-3 text-brand-accent" />;
      default: return <AlertCircle className="w-3 h-3 text-slate-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Selesai';
      case 'processing': return 'Diproses';
      default: return 'Menunggu';
    }
  };

  // Mask name for privacy since it's a public feed
  const maskName = (name: string) => {
    if (!name) return 'Anonim';
    const words = name.trim().split(/\s+/);
    return words.map(word => {
      if (word.length <= 1) return word;
      return word[0] + '*'.repeat(word.length - 1);
    }).join(' ');
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 mt-12 w-full">
        <div className="h-4 bg-slate-200 rounded w-1/2 mb-6"></div>
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-slate-100 rounded-sm w-full"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="md:mt-12 w-full">
      <h3 className="font-serif font-black uppercase tracking-widest text-xs text-brand-primary mb-6 flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
        </span>
        Pantauan Terkini
      </h3>
      
      {availableCategories.length > 0 && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-sm flex-shrink-0 transition-colors ${
              selectedCategory === null 
                ? 'bg-brand-primary text-white' 
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            Semua
          </button>
          {availableCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-sm flex-shrink-0 transition-colors ${
                selectedCategory === cat 
                  ? 'bg-slate-800 text-white' 
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-4 relative">
        {/* Connection line */}
        <div className="absolute left-[15px] top-4 bottom-4 w-px bg-slate-200 z-0"></div>

        {filteredReports.length === 0 ? (
          <div className="relative z-10 pl-10 text-xs text-slate-500 italic">
            Belum ada laporan di kategori ini.
          </div>
        ) : (
          <AnimatePresence>
            {filteredReports.map((report, index) => (
              <motion.div
              key={report.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative z-10 pl-10"
            >
              {/* Timeline dot */}
              <div className="absolute left-[11px] top-5 w-2 h-2 rounded-full bg-slate-300 ring-4 ring-white"></div>
              
              <div className="border border-border-subtle bg-white p-4 hover:border-brand-primary/30 transition-colors shadow-sm rounded-sm">
                <div className="flex justify-between items-start mb-2 gap-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 flex-1 flex-wrap">
                    <span className="text-xs font-bold text-slate-800 break-words">
                      {maskName(report.reporterName)}
                    </span>
                    {report.priority && (
                      <span className={`text-[9px] font-black w-fit uppercase tracking-widest px-1.5 py-0.5 rounded-sm ${
                        report.priority === 'Urgent' ? 'bg-[#ff0000] text-white animate-pulse' :
                        report.priority === 'Tinggi' ? 'bg-red-600 text-white' :
                        report.priority === 'Sedang' ? 'bg-orange-400 text-white' :
                        'bg-slate-300 text-slate-800'
                      }`}>
                        {report.priority}
                      </span>
                    )}
                    {report.aiCategory && report.aiCategory !== 'Lainnya' && (
                      <span className="text-[9px] font-black w-fit text-white bg-indigo-600 uppercase tracking-widest px-1.5 py-0.5 rounded-sm">
                        {report.aiCategory} {report.aiSubCategory && report.aiSubCategory !== 'Lainnya' && ` - ${report.aiSubCategory}`}
                      </span>
                    )}
                    {report.tags && report.tags.length > 0 ? (
                      <div className="flex gap-1 flex-wrap">
                        {report.tags.slice(0, 2).map((cat, idx) => (
                          <span key={idx} className="text-[9px] font-black w-fit text-white bg-slate-800 uppercase tracking-widest px-1.5 py-0.5 rounded-sm">
                            #{cat}
                          </span>
                        ))}
                      </div>
                    ) : report.categories && report.categories.length > 0 ? (
                      <div className="flex gap-1 flex-wrap">
                        {report.categories.map((cat, idx) => (
                          <span key={idx} className="text-[9px] font-black w-fit text-white bg-slate-800 uppercase tracking-widest px-1.5 py-0.5 rounded-sm">
                            {cat}
                          </span>
                        ))}
                      </div>
                    ) : report.category && report.category !== 'Other' ? (
                      <span className="text-[9px] font-black w-fit text-white bg-slate-800 uppercase tracking-widest px-1.5 py-0.5 rounded-sm">
                        {report.category}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider bg-slate-50 px-2 py-1 rounded-sm flex-shrink-0">
                    {getStatusIcon(report.status)}
                    <span className={
                      report.status === 'completed' ? 'text-emerald-600' :
                      report.status === 'processing' ? 'text-brand-accent' :
                      'text-slate-500'
                    }>
                      {getStatusText(report.status)}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-slate-600 line-clamp-2 mt-1 mb-3">
                  {report.aiSummary ? (
                    <span><span className="text-brand-primary">Ringkasan AI:</span> {report.aiSummary}</span>
                  ) : report.description}
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-[10px] text-slate-400 capitalize">
                    {report.createdAt ? formatDistanceToNow(report.createdAt.toDate(), { locale: idLocale, addSuffix: true }) : 'Baru saja'}
                  </span>
                  {report.mediaUrl && (
                    <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded uppercase tracking-wider font-bold">
                      Berlampiran
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          </AnimatePresence>
        )}

        {reports.length === 0 && (
          <div className="text-center py-8 text-sm text-slate-500 relative z-10 bg-white border border-dashed border-border-subtle rounded-sm">
            Belum ada laporan terkini.
          </div>
        )}
      </div>
    </div>
  );
}
