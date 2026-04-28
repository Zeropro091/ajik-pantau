import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Report } from '../types';
import { X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ChatBox from './ChatBox';

interface ReportDetailsProps {
  reportId: string;
  isAdmin: boolean;
  onClose: () => void;
}

export default function ReportDetails({ reportId, isAdmin, onClose }: ReportDetailsProps) {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch report
    const fetchReport = async () => {
      try {
        const docRef = doc(db, 'reports', reportId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setReport({ id: docSnap.id, ...docSnap.data() } as Report);
        }
      } catch (err) {
        console.error("Error fetching report:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [reportId]);

  if (loading && !report) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl relative"
        >
          {/* Header */}
          <div className="p-4 border-b border-border-subtle flex justify-between items-center bg-slate-50">
            <div>
              <h3 className="font-serif text-xl font-black text-slate-800">Detail Laporan</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">ID: {reportId.slice(0, 8)}...</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 transition-colors rounded-sm">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col md:flex-row">
            {/* Report Info */}
            <div className="w-full md:w-5/12 p-6 border-b md:border-b-0 md:border-r border-border-subtle bg-slate-50 overflow-y-auto">
              <div className="space-y-6">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Pelapor</div>
                  <div className="font-bold text-sm text-slate-800">{report?.reporterName}</div>
                </div>
                
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Status & Prioritas</div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-block px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm ${
                      report?.status === 'completed' ? 'bg-[#D2FFD2] text-[#008000]' :
                      report?.status === 'processing' ? 'bg-[#FFF4D2] text-[#996500]' :
                      'bg-[#FFD2D2] text-[#D80000]'
                    }`}>
                      {report?.status === 'completed' ? 'Selesai' : report?.status === 'processing' ? 'Diproses' : 'Menunggu'}
                    </span>
                    {report?.priority && (
                      <span className={`inline-block px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm ${
                        report.priority === 'Urgent' ? 'bg-[#ff0000] text-white animate-pulse' :
                        report.priority === 'Tinggi' ? 'bg-red-600 text-white' :
                        report.priority === 'Sedang' ? 'bg-orange-400 text-white' :
                        'bg-slate-300 text-slate-800'
                      }`}>
                        {report.priority}
                      </span>
                    )}
                    {report?.aiSentiment && (
                      <span className={`inline-block px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm ${
                        report.aiSentiment === 'Keluhan' ? 'bg-red-100 text-red-700' :
                        report.aiSentiment === 'Saran' ? 'bg-blue-100 text-blue-700' :
                        report.aiSentiment === 'Apresiasi' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {report.aiSentiment}
                      </span>
                    )}
                  </div>
                </div>

                {(report?.aiCategory || (report?.tags && report.tags.length > 0)) && (
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Kategorisasi AI</div>
                    <div className="flex flex-wrap gap-1">
                      {report?.aiCategory && report.aiCategory !== 'Lainnya' && (
                        <span className="text-[10px] font-black text-white bg-indigo-600 uppercase tracking-widest px-2 py-0.5 rounded-sm">
                          {report.aiCategory} {report.aiSubCategory && report.aiSubCategory !== 'Lainnya' && ` - ${report.aiSubCategory}`}
                        </span>
                      )}
                      {report?.tags && report.tags.map((tag, idx) => (
                        <span key={idx} className="text-[10px] font-black text-white bg-slate-800 uppercase tracking-widest px-2 py-0.5 rounded-sm">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {report?.aiSummary && (
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-brand-primary mb-1">Ringkasan AI</div>
                    <p className="text-sm font-medium text-slate-800 leading-relaxed italic">{report.aiSummary}</p>
                  </div>
                )}

                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Deskripsi Lengkap</div>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{report?.description}</p>
                </div>

                {report?.mediaUrl && (
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Lampiran Media</div>
                    {report.mediaType === 'video' ? (
                      <video src={report.mediaUrl} controls className="w-full bg-black rounded-sm" />
                    ) : (
                      <img src={report.mediaUrl} alt="Lampiran" className="w-full max-h-48 object-contain bg-slate-200 rounded-sm" referrerPolicy="no-referrer" />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="w-full md:w-7/12 flex flex-col h-[60vh] md:h-[calc(90vh-73px)]">
              <ChatBox reportId={reportId} isAdmin={isAdmin} reporterName={report?.reporterName} />
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
