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
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contacts") // Assuming your table is named 'contacts'
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setMessages(data || []);
    setLoading(false);
  };

  const toggleReadStatus = async (id, currentStatus) => {
    const { error } = await supabase
      .from("contacts")
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
    setDeleting(id);
    const { error } = await supabase.from("contacts").delete().eq("id", id);
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full overflow-hidden">
        
        {/* MESSAGE LIST */}
        <div className="lg:col-span-5 bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col overflow-hidden">
          <div className="overflow-y-auto flex-1 divide-y divide-gray-50">
            {loading ? (
              <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>
            ) : messages.length === 0 ? (
              <div className="p-10 text-center text-gray-400">No messages yet.</div>
            ) : (
              messages.map((msg) => (
                <div 
                  key={msg.id}
                  onClick={() => setSelectedMessage(msg)}
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
                      <p className={`text-sm truncate ${msg.is_read ? "text-gray-500" : "font-bold text-gray-900"}`}>
                        {msg.name}
                      </p>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap uppercase font-bold">
                        {new Date(msg.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 font-medium truncate">{msg.email}</p>
                    <p className="text-sm text-gray-600 line-clamp-1 mt-1">{msg.message}</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 self-center" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* MESSAGE DETAIL */}
        <div className="lg:col-span-7 bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col">
          {selectedMessage ? (
            <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Toolbar */}
              <div className="p-4 border-b border-gray-50 flex justify-between items-center">
                <div className="flex gap-2">
                  <button 
                    onClick={() => toggleReadStatus(selectedMessage.id, selectedMessage.is_read)}
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                    title={selectedMessage.is_read ? "Mark as unread" : "Mark as read"}
                  >
                    {selectedMessage.is_read ? <Mail size={20} /> : <MailOpen size={20} />}
                  </button>
                  <button 
                    onClick={() => deleteMessage(selectedMessage.id)}
                    disabled={deleting === selectedMessage.id}
                    className="p-2 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-500 transition-colors"
                  >
                    {deleting === selectedMessage.id ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-8 overflow-y-auto">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 mb-1">{selectedMessage.name}</h2>
                    <p className="text-blue-600 font-medium">{selectedMessage.email}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-gray-400 text-xs font-bold uppercase tracking-wider">
                      <Clock size={12} />
                      {new Date(selectedMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <p className="text-gray-400 text-xs font-bold">{new Date(selectedMessage.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-2xl text-gray-700 leading-relaxed whitespace-pre-wrap border border-gray-100">
                  {selectedMessage.message}
                </div>

                <div className="mt-8 pt-8 border-t border-gray-50">
                  <a 
                    href={`mailto:${selectedMessage.email}`}
                    className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition shadow-lg shadow-gray-200"
                  >
                    Reply via Email
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Mail className="text-gray-200" size={40} />
              </div>
              <h3 className="text-gray-900 font-bold text-lg">Select a message</h3>
              <p className="text-gray-400 max-w-xs text-sm">Choose a conversation from the list to view full details and reply.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}