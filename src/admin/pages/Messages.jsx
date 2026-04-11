import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { 
  Mail, 
  MailOpen, 
  Trash2, 
  User, 
  Clock, 
  Loader2, 
  ChevronRight,
  Inbox
} from "lucide-react";

export default function Messages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchMessages();

    // 📡 Realtime Listener to keep the inbox in sync
    const channel = supabase
      .channel('messages-inbox')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMessages = async () => {
    // Only show loading on initial fetch to prevent flicker during realtime updates
    if (messages.length === 0) setLoading(true);
    
    const { data, error } = await supabase
      .from("messages") 
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) {
      setMessages(data || []);
      // Sync selected message if it exists
      if (selectedMessage) {
        const updated = data.find(m => m.id === selectedMessage.id);
        if (updated) setSelectedMessage(updated);
      }
    }
    setLoading(false);
  };

  const handleSelectMessage = async (msg) => {
    setSelectedMessage(msg);
    
    if (!msg.is_read) {
      const { error } = await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("id", msg.id);

      if (!error) {
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: true } : m));
      }
    }
  };

  const toggleReadStatus = async (id, currentStatus) => {
    const { error } = await supabase
      .from("messages")
      .update({ is_read: !currentStatus })
      .eq("id", id);

    if (!error) {
      setMessages(messages.map(m => m.id === id ? { ...m, is_read: !currentStatus } : m));
      if (selectedMessage?.id === id) {
        setSelectedMessage({ ...selectedMessage, is_read: !currentStatus });
      }
    }
  };

  const deleteMessage = async (id) => {
    if (!window.confirm("Purge this transmission from the database?")) return;
    
    setDeleting(id);
    const { error } = await supabase.from("messages").delete().eq("id", id);
    if (!error) {
      setMessages(messages.filter(m => m.id !== id));
      if (selectedMessage?.id === id) setSelectedMessage(null);
    }
    setDeleting(null);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-[calc(100vh-100px)]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Inbox</h1>
          <p className="text-gray-500">Manage inquiries from the contact form.</p>
        </div>
        <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
          <Inbox size={18} />
          {messages.filter(m => !m.is_read).length} Unread
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full overflow-hidden pb-4">
        
        {/* MESSAGE LIST */}
        <div className="lg:col-span-5 bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col overflow-hidden">
          <div className="overflow-y-auto flex-1 divide-y divide-gray-50 custom-scrollbar">
            {loading ? (
              <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>
            ) : messages.length === 0 ? (
              <div className="p-10 text-center text-gray-400">No messages yet.</div>
            ) : (
              messages.map((msg) => (
                <div 
                  key={msg.id}
                  onClick={() => handleSelectMessage(msg)}
                  className={`p-4 cursor-pointer transition-all flex gap-4 relative group ${
                    selectedMessage?.id === msg.id ? "bg-blue-50/50" : "hover:bg-gray-50"
                  }`}
                >
                  {!msg.is_read && (
                    <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-600 rounded-full" />
                  )}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.is_read ? "bg-gray-100 text-gray-400" : "bg-blue-100 text-blue-600"
                  }`}>
                    <User size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className={`text-sm truncate ${msg.is_read ? "text-gray-500 font-medium" : "font-black text-gray-900"}`}>
                        {msg.name}
                      </p>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap uppercase font-bold ml-2">
                        {new Date(msg.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-tighter truncate">{msg.email}</p>
                    <p className="text-sm text-gray-600 line-clamp-1 mt-1 italic">
                      {msg.message}
                    </p>
                  </div>
                  <ChevronRight size={16} className={`self-center transition-transform ${selectedMessage?.id === msg.id ? "text-blue-600 translate-x-1" : "text-gray-300"}`} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* MESSAGE DETAIL */}
        <div className="lg:col-span-7 bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col overflow-hidden">
          {selectedMessage ? (
            <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex gap-2">
                  <button 
                    onClick={() => toggleReadStatus(selectedMessage.id, selectedMessage.is_read)}
                    title={selectedMessage.is_read ? "Mark as unread" : "Mark as read"}
                    className="p-2.5 hover:bg-gray-100 rounded-xl text-gray-500 transition-all active:scale-95"
                  >
                    {selectedMessage.is_read ? <Mail size={20} /> : <MailOpen size={20} className="text-blue-600" />}
                  </button>
                  <button 
                    onClick={() => deleteMessage(selectedMessage.id)}
                    disabled={deleting === selectedMessage.id}
                    className="p-2.5 hover:bg-red-50 rounded-xl text-gray-500 hover:text-red-500 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {deleting === selectedMessage.id ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}
                  </button>
                </div>
                <div className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Transmission Details</div>
              </div>

              <div className="p-6 md:p-10 overflow-y-auto flex-1 custom-scrollbar">
                <div className="flex flex-col md:flex-row justify-between items-start mb-10 gap-4">
                  <div>
                    <h2 className="text-3xl font-black text-gray-900 mb-2 leading-none">{selectedMessage.name}</h2>
                    <p className="text-blue-600 font-bold tracking-tight text-lg">{selectedMessage.email}</p>
                  </div>
                  <div className="md:text-right bg-gray-50 p-3 rounded-2xl border border-gray-100 min-w-[140px]">
                    <div className="flex items-center md:justify-end gap-1.5 text-gray-500 text-[10px] font-black uppercase tracking-wider mb-1">
                      <Clock size={12} className="text-blue-500" />
                      {new Date(selectedMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{new Date(selectedMessage.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute -left-4 top-0 bottom-0 w-1 bg-blue-600/10 rounded-full" />
                  <div className="bg-gray-50/50 p-8 rounded-3xl text-gray-700 leading-relaxed whitespace-pre-wrap border border-gray-100 text-lg shadow-inner">
                    {selectedMessage.message}
                  </div>
                </div>

                <div className="mt-10 pt-10 border-t border-gray-50 flex flex-wrap gap-4">
                  <a 
                    href={`mailto:${selectedMessage.email}`}
                    className="inline-flex items-center gap-3 bg-gray-900 text-white px-8 py-4 rounded-2xl font-black hover:bg-blue-600 transition-all shadow-xl shadow-gray-200 hover:shadow-blue-100 active:scale-95 uppercase text-xs tracking-widest"
                  >
                    Reply via Email
                  </a>
                  <button 
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-3 bg-white text-gray-600 border border-gray-200 px-8 py-4 rounded-2xl font-black hover:bg-gray-50 transition-all active:scale-95 uppercase text-xs tracking-widest"
                  >
                    Archive to PDF
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-gray-50/30">
              <div className="w-24 h-24 bg-white shadow-xl shadow-gray-100 rounded-3xl flex items-center justify-center mb-6 border border-gray-50">
                <Mail className="text-gray-200" size={48} strokeWidth={1.5} />
              </div>
              <h3 className="text-gray-900 font-black text-xl uppercase tracking-tight">Select a transmission</h3>
              <p className="text-gray-400 max-w-xs text-sm mt-2 font-medium">Choose a conversation from the sidebar to decrypt details and respond.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}