"use client";
import React, { useEffect, useState } from "react";

interface User {
  id: number;
  name: string;
  email: string;
}

interface Message {
  id: number;
  sender: { id: number; name: string; role: string };
  content: string;
  createdAt: string;
  isRead: boolean;
  attachments?: any[];
}

interface Conversation {
  id: number;
  buyer: User;
  messages: Message[];
}

export default function AdminMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    fetchConversations();
    // Optionally, poll for new messages
    // const interval = setInterval(fetchConversations, 10000);
    // return () => clearInterval(interval);
  }, [search, refresh]);

  const fetchConversations = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("pawmart_token") || sessionStorage.getItem("pawmart_token");
      const res = await fetch(`http://localhost:4000/api/messages/all?search=${encodeURIComponent(search)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load conversations");
      const data = await res.json();
      setConversations(data.conversations || []);
      // If a conversation is selected, update it
      if (selectedConv) {
        const updated = data.conversations.find((c: Conversation) => c.id === selectedConv.id);
        if (updated) setSelectedConv(updated);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConv = async (conv: Conversation) => {
    setSelectedConv(conv);
    // Mark messages as read for this conversation
    try {
      const token = localStorage.getItem("pawmart_token") || sessionStorage.getItem("pawmart_token");
      await fetch(`http://localhost:4000/api/messages/${conv.id}/mark-read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setRefresh(r => r + 1); // Refresh conversations to update unread badge
    } catch (err) {
      // Optionally handle error
    }
    setTimeout(() => {
      const el = document.getElementById("admin-messages-end");
      el?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedConv) return;
    setSending(true);
    setError(null);
    try {
      const token = localStorage.getItem("pawmart_token") || sessionStorage.getItem("pawmart_token");
      const formData = new FormData();
      formData.append("content", message);
      const res = await fetch(`http://localhost:4000/api/messages/${selectedConv.id}/send`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to send message");
      setMessage("");
      setRefresh(r => r + 1);
    } catch (err: any) {
      setError(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const getUnreadCount = (conv: Conversation) => {
    return conv.messages.filter(m => !m.isRead && m.sender.role === "BUYER").length;
  };

  return (
    <div className="flex h-[80vh] bg-gray-50 rounded-lg shadow overflow-hidden">
      {/* Sidebar: Conversation List */}
      <div className="w-80 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <input
            type="text"
            placeholder="Search buyers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-gray-900"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-gray-500">Loading conversations...</div>
          ) : error ? (
            <div className="p-4 text-red-600">{error}</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-gray-500">No conversations found.</div>
          ) : (
            conversations.map(conv => {
              const lastMsg = conv.messages[conv.messages.length - 1];
              const unread = getUnreadCount(conv);
              return (
                <div
                  key={conv.id}
                  className={`px-4 py-3 border-b cursor-pointer hover:bg-blue-50 transition flex items-center justify-between ${selectedConv?.id === conv.id ? "bg-blue-100" : ""}`}
                  onClick={() => handleSelectConv(conv)}
                >
                  <div>
                    <div className="font-semibold text-blue-800">{conv.buyer.name}</div>
                    <div className="text-xs text-gray-500">{conv.buyer.email}</div>
                    {lastMsg && (
                      <div className="text-xs text-gray-700 mt-1 truncate max-w-[180px]">
                        {lastMsg.sender.role === "BUYER" ? "Buyer: " : "PawMart: "}
                        {lastMsg.content.length > 30 ? lastMsg.content.slice(0, 30) + "..." : lastMsg.content}
                      </div>
                    )}
                  </div>
                  {unread > 0 && (
                    <span className="ml-2 bg-blue-600 text-white text-xs rounded-full px-2 py-0.5 font-bold">
                      {unread}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
      {/* Main: Chat */}
      <div className="flex-1 flex flex-col">
        {selectedConv ? (
          <>
            <div className="border-b px-6 py-4 bg-white flex items-center justify-between">
              <div>
                <div className="font-bold text-lg text-blue-800">{selectedConv.buyer.name}</div>
                <div className="text-xs text-gray-500">{selectedConv.buyer.email}</div>
              </div>
              <button
                className="text-blue-600 hover:underline text-sm"
                onClick={() => setSelectedConv(null)}
              >
                Back to all
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50">
              {selectedConv.messages.length === 0 ? (
                <div className="text-gray-500 text-center mt-12">No messages yet.</div>
              ) : (
                selectedConv.messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`mb-4 flex ${msg.sender.role === "BUYER" ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`rounded-lg px-4 py-2 max-w-xs break-words shadow text-sm ${
                        msg.sender.role === "BUYER"
                          ? "bg-blue-100 text-blue-900 mr-auto"
                          : "bg-gray-200 text-gray-900 ml-auto"
                      }`}
                    >
                      <div className="mb-1 font-semibold">
                        {msg.sender.role === "BUYER" ? selectedConv.buyer.name : "PawMart"}
                      </div>
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                      <div className="text-xs text-gray-400 mt-1 text-right">
                        {new Date(msg.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div id="admin-messages-end" />
            </div>
            <form onSubmit={handleSend} className="flex gap-2 p-4 border-t bg-white">
              <input
                type="text"
                className="flex-1 border rounded-lg px-3 py-2 text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Type your message..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                disabled={sending}
                maxLength={1000}
                required
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                disabled={sending || !message.trim()}
              >
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-xl">
            Select a conversation to view messages
          </div>
        )}
      </div>
    </div>
  );
} 