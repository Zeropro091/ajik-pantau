import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Report } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Clock, CheckCircle2, AlertCircle, MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';
import ReportDetails from './ReportDetails';

export default function MyReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  useEffect(() => {
    const fetchMyReports = async () => {
      const savedIds = JSON.parse(localStorage.getItem('my_reports') || '[]');
      
      if (savedIds.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const fetchedReports: Report[] = [];
        for (const id of savedIds) {
          const docRef = doc(db, 'reports', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            fetchedReports.push({ id: docSnap.id, ...docSnap.data() } as Report);
          }
        }
        // sort by newest
        fetchedReports.sort((a, b) => {
           if (!a.createdAt || !b.createdAt) return 0;
           return b.createdAt.toMillis() - a.createdAt.toMillis();
        });
        setReports(fetchedReports);
      } catch (err) {
        console.error("Error fetching my reports:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyReports();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'processing': return <Clock className="w-4 h-4 text-brand-accent" />;
      default: return <AlertCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Selesai';
      case 'processing': return 'Diproses';
      default: return 'Menunggu';
    }
  };

  if (loading) {
    return <div className="p-10 text-center"><div className="w-8 h-8 mx-auto border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-8">
        <h2 className="font-serif text-3xl font-normal leading-tight">Laporan Saya</h2>
        <p className="text-slate-500 text-sm mt-2">Daftar laporan pengaduan yang pernah Anda kirimkan.</p>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-20 px-4 border border-dashed border-border-subtle bg-white">
          <p className="text-slate-500 mb-4">Anda belum pernah membuat laporan dari perangkat ini.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {reports.map((report, index) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              key={report.id}
              className="border border-border-subtle bg-white p-5 cursor-pointer hover:border-brand-primary transition-all group flex flex-col h-full"
              onClick={() => setSelectedReportId(report.id!)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider bg-slate-50 px-3 py-1 rounded-sm w-fit">
                    {getStatusIcon(report.status)}
                    <span className={
                      report.status === 'completed' ? 'text-emerald-600' :
                      report.status === 'processing' ? 'text-brand-accent' :
                      'text-slate-500'
                    }>
                      {getStatusText(report.status)}
                    </span>
                  </div>
                  {report.priority && (
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-sm ${
                      report.priority === 'Urgent' ? 'bg-[#ff0000] text-white animate-pulse' :
                      report.priority === 'Tinggi' ? 'bg-red-600 text-white' :
                      report.priority === 'Sedang' ? 'bg-orange-400 text-white' :
                      'bg-slate-300 text-slate-800'
                    }`}>
                      {report.priority}
                    </span>
                  )}
                  {report.categories && report.categories.length > 0 ? (
                    <div className="flex gap-1 flex-wrap">
                      {report.categories.map((cat, idx) => (
                        <span key={idx} className="text-[10px] font-black text-white bg-slate-800 uppercase tracking-widest px-2 py-1 rounded-sm">
                          {cat}
                        </span>
                      ))}
                    </div>
                  ) : report.category && report.category !== 'Other' ? (
                    <span className="text-[10px] font-black text-white bg-slate-800 uppercase tracking-widest px-2 py-1 rounded-sm">
                      {report.category}
                    </span>
                  ) : null}
                </div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  {report.id?.slice(0, 8)}
                </span>
              </div>
              
              <p className="text-sm text-slate-700 line-clamp-3 mb-4 flex-1">
                {report.aiSummary ? (
                  <span><span className="text-brand-primary">Ringkasan AI:</span> {report.aiSummary}</span>
                ) : report.description}
              </p>
              
              <div className="flex justify-between items-end border-t border-border-subtle pt-4 mt-auto">
                <span className="text-[10px] text-slate-400 capitalize">
                  {report.createdAt ? formatDistanceToNow(report.createdAt.toDate(), { locale: idLocale, addSuffix: true }) : 'Baru saja'}
                </span>
                <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-brand-primary group-hover:text-black transition-colors">
                  {report.hasUnreadReporter && (
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-1"></span>
                  )}
                  <MessageCircle className="w-3 h-3" /> Chat / Detail
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {selectedReportId && (
        <ReportDetails 
          reportId={selectedReportId} 
          isAdmin={false} 
          onClose={() => setSelectedReportId(null)} 
        />
      )}
    </div>
  );
}
