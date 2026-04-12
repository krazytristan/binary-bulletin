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
  Inbox,
  Printer,
  AtSign
} from "lucide-react";

export default function Messages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchMessages();

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
    if (messages.length === 0) setLoading(true);
    
    const { data, error } = await supabase
      .from("messages") 
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) {
      setMessages(data || []);
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
    <div className="bg-gray-50 min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto flex flex-col h-[calc(100vh-100px)]">
        
        {/* Header Area */}
        <div className="flex justify-between items-end mb-6 px-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
              <Inbox className="text-blue-600" /> Communications
            </h1>
            <p className="text-gray-500 text-sm mt-1">Manage and respond to inbound contact requests.</p>
          </div>
          <div className="bg-white border border-gray-200 shadow-sm px-4 py-2 rounded-lg text-sm font-semibold text-gray-700">
            <span className="text-blue-600">{messages.filter(m => !m.is_read).length}</span> Unread
          </div>
        </div>

        {/* Main Interface Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex-1">
          
          {/* Message List Panel */}
          <div className="lg:col-span-4 border-r border-gray-100 flex flex-col bg-white">
            <div className="p-4 border-b border-gray-50 bg-gray-50/50 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Recent Transmissions
            </div>
            
            <div className="overflow-y-auto flex-1 divide-y divide-gray-50">
              {loading ? (
                <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>
              ) : messages.length === 0 ? (
                <div className="p-10 text-center text-gray-400 text-sm italic">No records found.</div>
              ) : (
                messages.map((msg) => (
                  <button 
                    key={msg.id}
                    onClick={() => handleSelectMessage(msg)}
                    className={`w-full text-left p-5 transition-all flex gap-4 relative group ${
                      selectedMessage?.id === msg.id ? "bg-blue-50/40" : "hover:bg-gray-50"
                    }`}
                  >
                    {!msg.is_read && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />
                    )}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border ${
                      msg.is_read ? "bg-gray-50 text-gray-400 border-gray-100" : "bg-blue-50 text-blue-600 border-blue-100"
                    }`}>
                      <User size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className={`text-sm truncate ${msg.is_read ? "text-gray-600" : "font-bold text-gray-900"}`}>
                          {msg.name}
                        </p>
                        <span className="text-[10px] text-gray-400 font-medium">
                          {new Date(msg.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{msg.email}</p>
                      <p className="text-xs text-gray-500 line-clamp-1 mt-2 font-medium italic">
                        "{msg.message}"
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Message Detail Panel */}
          <div className="lg:col-span-8 flex flex-col bg-white overflow-hidden">
            {selectedMessage ? (
              <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => toggleReadStatus(selectedMessage.id, selectedMessage.is_read)}
                      className="p-2 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 rounded-lg text-gray-500 transition-all active:scale-95"
                      title="Mark as unread"
                    >
                      {selectedMessage.is_read ? <Mail size={18} /> : <MailOpen size={18} className="text-blue-600" />}
                    </button>
                    <button 
                      onClick={() => deleteMessage(selectedMessage.id)}
                      disabled={deleting === selectedMessage.id}
                      className="p-2 hover:bg-red-50 hover:border-red-100 border border-transparent rounded-lg text-gray-500 hover:text-red-600 transition-all disabled:opacity-50"
                    >
                      {deleting === selectedMessage.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => window.print()} className="p-2 text-gray-400 hover:text-gray-600">
                      <Printer size={18} />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 md:p-12 overflow-y-auto flex-1">
                  <header className="mb-8 pb-8 border-b border-gray-50 flex flex-col md:flex-row justify-between gap-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                         <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase rounded">Verified Source</span>
                      </div>
                      <h2 className="text-3xl font-bold text-gray-900 leading-tight">{selectedMessage.name}</h2>
                      <div className="flex items-center gap-2 text-blue-600 font-medium mt-1">
                        <AtSign size={14} />
                        <span className="text-sm underline underline-offset-4">{selectedMessage.email}</span>
                      </div>
                    </div>
                    
                    <div className="md:text-right">
                      <div className="inline-flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">
                        <Clock size={12} /> Received
                      </div>
                      <p className="text-gray-900 font-semibold">{new Date(selectedMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      <p className="text-gray-500 text-xs">{new Date(selectedMessage.created_at).toLocaleDateString()}</p>
                    </div>
                  </header>

                  <div className="prose prose-blue max-w-none">
                    <div className="text-gray-700 leading-relaxed text-lg whitespace-pre-wrap bg-gray-50/50 p-6 rounded-xl border border-gray-100">
                      {selectedMessage.message}
                    </div>
                  </div>

                  <div className="mt-12 flex gap-4 no-print">
                    <a 
                      href={`mailto:${selectedMessage.email}`}
                      className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95 text-sm"
                    >
                      Reply to Sender
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-gray-50/20">
                <div className="w-20 h-20 bg-white shadow-sm rounded-3xl flex items-center justify-center mb-4 border border-gray-100 text-gray-200">
                  <Mail size={40} strokeWidth={1.5} />
                </div>
                <h3 className="text-gray-900 font-bold text-lg">No message selected</h3>
                <p className="text-gray-400 max-w-xs text-sm mt-1">Select an item from the transmission log to view full details.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Scrollbar Styling */}
      <style jsx>{`
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
      `}</style>
    </div>
  );
}