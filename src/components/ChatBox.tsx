import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, collection, query, orderBy, onSnapshot, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Send, Loader2, User, UserCheck } from 'lucide-react';

interface ChatBoxProps {
  reportId: string;
  isAdmin: boolean;
  reporterName?: string;
}

export default function ChatBox({ reportId, isAdmin, reporterName }: ChatBoxProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'reports', reportId, 'messages'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: any[] = [];
      snapshot.forEach(docMsg => {
        data.push({ id: docMsg.id, ...docMsg.data() });
      });
      setMessages(data);
    });

    // Clear unread status when opening the chat
    const clearUnread = async () => {
      try {
        await updateDoc(doc(db, 'reports', reportId), {
          [isAdmin ? 'hasUnreadAdmin' : 'hasUnreadReporter']: false,
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        console.error("Error clearing unread status:", err);
      }
    };
    clearUnread();

    return () => unsubscribe();
  }, [reportId, isAdmin]);

  const getDeviceFingerprint = () => {
    let fp = localStorage.getItem('ajik_pantau_fp');
    if (!fp) {
      fp = Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('ajik_pantau_fp', fp);
    }
    return fp;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      await addDoc(collection(db, 'reports', reportId, 'messages'), {
        text: newMessage.trim(),
        senderType: isAdmin ? 'admin' : 'reporter',
        senderName: isAdmin ? 'Admin' : (reporterName || 'Pelapor'),
        fingerprint: isAdmin ? '' : getDeviceFingerprint(),
        createdAt: serverTimestamp()
      });
      
      // Notify the other party
      await updateDoc(doc(db, 'reports', reportId), {
        [isAdmin ? 'hasUnreadReporter' : 'hasUnreadAdmin']: true,
        updatedAt: serverTimestamp()
      });

      setNewMessage('');
    } catch (err) {
      console.error("Error sending message:", err);
      alert('Gagal mengirim pesan.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-border-subtle">
      <div className="p-4 border-b border-border-subtle bg-slate-50">
        <h4 className="text-xs font-black uppercase tracking-widest text-brand-primary">Diskusi & Tindak Lanjut</h4>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[400px] min-h-[300px]">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-400 border border-dashed border-border-subtle bg-white">
            Belum ada pesan terkait laporan ini.
          </div>
        ) : (
          messages.map((msg) => {
            const isSelf = isAdmin ? msg.senderType === 'admin' : (msg.senderType === 'reporter' && msg.fingerprint === getDeviceFingerprint());
            const isAdminMsg = msg.senderType === 'admin';

            return (
              <div key={msg.id} className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-1 mb-1">
                  {isAdminMsg ? <UserCheck className="w-3 h-3 text-brand-primary" /> : <User className="w-3 h-3 text-slate-400" />}
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isAdminMsg ? 'text-brand-primary' : 'text-slate-500'}`}>
                    {msg.senderName} {isAdminMsg && '(Admin)'}
                  </span>
                </div>
                <div className={`px-4 py-2 text-sm max-w-[85%] ${
                  isSelf 
                    ? 'bg-brand-primary text-white rounded-l-xl rounded-br-xl' 
                    : 'bg-slate-100 text-slate-700 rounded-r-xl rounded-bl-xl'
                }`}>
                  {msg.text}
                </div>
                <span className="text-[9px] text-slate-400 mt-1">
                  {msg.createdAt ? formatDistanceToNow(msg.createdAt.toDate(), { locale: idLocale, addSuffix: true }) : 'Baru saja'}
                </span>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSendMessage} className="p-3 border-t border-border-subtle bg-white flex gap-2">
        <input
          type="text"
          placeholder="Ketik pesan..."
          className="flex-1 px-4 py-2 border border-border-subtle focus:border-brand-primary outline-none transition-all text-sm"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="px-4 py-2 bg-brand-primary text-white hover:bg-black transition-colors disabled:opacity-50"
          title="Kirim Pesan"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}
