"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface MessageAttachment {
  id: number;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
}

interface Message {
  id: number;
  sender: { id: number; name: string; role: string };
  content: string;
  createdAt: string;
  attachments: MessageAttachment[];
}

interface Conversation {
  id: number;
  messages: Message[];
  buyer: { id: number; name: string; email: string };
}

export default function MessagesPage() {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    fetchUser();
    fetchConversation();
  }, []);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("pawmart_token") || sessionStorage.getItem("pawmart_token");
      const res = await fetch("http://localhost:4000/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData.user);
      }
    } catch (err) {
      console.error("Failed to fetch user:", err);
    }
  };

  const fetchConversation = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("pawmart_token") || sessionStorage.getItem("pawmart_token");
      const res = await fetch("http://localhost:4000/api/messages", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load messages");
      const data = await res.json();
      setConversation(data.conversation);
    } catch (err: any) {
      setError(err.message || "Failed to load messages");
    } finally {
      setLoading(false);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      const isValidType = validTypes.includes(file.type);
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      return isValidType && isValidSize;
    });
    
    if (validFiles.length !== files.length) {
      alert("Some files were skipped. Only PDF, JPG, and PNG files up to 10MB are allowed.");
    }
    
    setSelectedFiles(validFiles);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getDisplayName = (sender: { name: string; role: string }) => {
    if (sender.role === "ADMIN" || sender.role === "STAFF") {
      return "PawMart";
    }
    return sender.name;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!message.trim() && selectedFiles.length === 0) || !conversation) return;
    
    setSending(true);
    setError(null);
    try {
      const token = localStorage.getItem("pawmart_token") || sessionStorage.getItem("pawmart_token");
      
      const formData = new FormData();
      formData.append('content', message);
      selectedFiles.forEach(file => {
        formData.append('attachments', file);
      });

      const res = await fetch(`http://localhost:4000/api/messages/${conversation.id}/send`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      
      if (!res.ok) throw new Error("Failed to send message");
      
      setMessage("");
      setSelectedFiles([]);
      await fetchConversation();
    } catch (err: any) {
      setError(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 flex flex-col items-center">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow p-6 flex flex-col h-[70vh]">
        <h1 className="text-2xl font-bold text-blue-800 mb-4">Messages</h1>
        {loading ? (
          <div className="text-gray-600">Loading messages...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : conversation ? (
          <>
            <div className="flex-1 overflow-y-auto mb-4 pr-2" style={{ maxHeight: "50vh" }}>
              {conversation.messages.length === 0 ? (
                <div className="text-gray-500 text-center mt-12">No messages yet. Start the conversation!</div>
              ) : (
                conversation.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`mb-4 flex ${msg.sender.role === "BUYER" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`rounded-lg px-4 py-2 max-w-xs break-words shadow text-sm ${
                        msg.sender.role === "BUYER"
                          ? "bg-blue-600 text-white ml-auto"
                          : "bg-gray-200 text-gray-900 mr-auto"
                      }`}
                    >
                      <div className="mb-1 font-semibold">
                        {msg.sender.role === "BUYER" ? "You" : getDisplayName(msg.sender)}
                      </div>
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                      
                      {/* File Attachments */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {msg.attachments.map((attachment) => (
                            <div key={attachment.id} className="flex items-center gap-2">
                              <span className="text-xs opacity-75">
                                📎 {attachment.fileName} ({formatFileSize(attachment.fileSize)})
                              </span>
                              <a
                                href={`http://localhost:4000/${attachment.filePath}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs underline hover:no-underline"
                              >
                                View
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-300 mt-1 text-right">
                        {new Date(msg.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <form onSubmit={handleSend} className="flex flex-col gap-2">
              {/* File Upload */}
              <div className="flex items-center gap-2">
                <label className="bg-gray-600 text-white px-3 py-2 rounded cursor-pointer font-semibold hover:bg-gray-700 transition-colors text-sm">
                  📎 Attach Files
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={sending}
                  />
                </label>
                <span className="text-xs text-gray-600">
                  {selectedFiles.length} file(s) selected
                </span>
              </div>
              
              {/* Selected Files */}
              {selectedFiles.length > 0 && (
                <div className="bg-gray-50 p-2 rounded text-xs">
                  <div className="font-semibold mb-1">Selected Files:</div>
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span>{file.name} ({formatFileSize(file.size)})</span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 border rounded-lg px-3 py-2 text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={sending}
                  maxLength={1000}
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  disabled={sending || (!message.trim() && selectedFiles.length === 0)}
                >
                  Send
                </button>
              </div>
            </form>
          </>
        ) : null}
      </div>
    </div>
  );
} 