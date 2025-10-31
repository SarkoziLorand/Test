"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "../../../auth/AuthService"

export default function ConversationsSplitView() {
    const { authFetch } = useAuth()

    const [loading, setLoading] = useState(true)
    const [conversations, setConversations] = useState([])
    const [selectedChatId, setSelectedChatId] = useState(null)
    const [selectedMessages, setSelectedMessages] = useState([])
    const [messagesLoading, setMessagesLoading] = useState(false)
    const [currentAgent, setCurrentAgent] = useState("")
    const [error, setError] = useState(null)

    useEffect(() => {
        let active = true

        const loadData = async () => {
            try {
                const response = await authFetch("/conversations")
                if (!response) return
                const convs = await response.json()
                if (active) {
                    setConversations(Array.isArray(convs) ? convs : [])
                }
            } catch (e) {
                console.error("Failed to load conversations", e)
                setError("Failed to load conversations.")
            } finally {
                if (active) setLoading(false)
            }
        }

        loadData()
        return () => {
            active = false
        }
    }, [authFetch])

    useEffect(() => {
        if (!selectedChatId) {
            setSelectedMessages([])
            return
        }

        let active = true

        const loadMessages = async () => {
            try {
                setMessagesLoading(true)
                const response = await authFetch(`/conversations/${selectedChatId}`)

                if (!response) throw new Error("No response")

                const data = await response.json()
                if (!Array.isArray(data)) throw new Error("Unexpected payload")

                if (active) {
                    const sorted = [...data].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                    setSelectedMessages(sorted)
                }
            } catch (e) {
                console.error("Failed to load conversation messages", e)
                if (active) setSelectedMessages([])
            } finally {
                if (active) setMessagesLoading(false)
            }
        }

        loadMessages()
        return () => {
            active = false
        }
    }, [authFetch, selectedChatId])

    const filtered = useMemo(() => {
        const q = (currentAgent || "").trim().toLowerCase()
        if (!q) return conversations
        return conversations.filter((c) => (c?.agent?.name || "").toLowerCase().includes(q))
    }, [conversations, currentAgent])

    const selectedConversation = useMemo(() => {
        return conversations.find((c) => c.chatId === selectedChatId)
    }, [conversations, selectedChatId])

    const selectedMeta = useMemo(() => {
        const first = selectedMessages[0]
        return {
            agentName: first?.agent?.name || selectedConversation?.agent?.name || "—",
            companyName: first?.agent?.company?.name || selectedConversation?.agent?.company?.name || "—",
        }
    }, [selectedMessages, selectedConversation])

    const preview = (text, n = 60) => {
        if (!text) return "—"
        const s = String(text)
        return s.length > n ? s.slice(0, n - 1) + "…" : s
    }

    const formatTime = (iso) => {
        try {
            return new Date(iso).toLocaleString()
        } catch {
            return iso || "—"
        }
    }

    const formatDate = (iso) => {
        try {
            const date = new Date(iso)
            const now = new Date()
            const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))

            if (diffDays === 0) return "Today"
            if (diffDays === 1) return "Yesterday"
            if (diffDays < 30) return `${diffDays} days ago`
            if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
            return date.toLocaleDateString()
        } catch {
            return "Unknown date"
        }
    }

    const groupedConversations = useMemo(() => {
        const groups = {}
        filtered.forEach((conv) => {
            const dateKey = formatDate(conv.createdAt || conv.updatedAt)
            if (!groups[dateKey]) groups[dateKey] = []
            groups[dateKey].push(conv)
        })
        return groups
    }, [filtered])

    return (
        <>
            <link rel="stylesheet" href="/ConversaationsSplit.css" />

            <div className="conv-split-container">
                <div className="conv-split-left">
                    <div className="conv-split-header">
                        <h2 className="conv-split-title">Conversations</h2>
                        <div className="conv-split-meta">
                            <span className="count">{filtered.length}</span>
                        </div>
                    </div>

                    <div className="conv-split-search">
                        <input
                            type="text"
                            value={currentAgent}
                            onChange={(e) => setCurrentAgent(e.target.value)}
                            className="conv-search-input"
                            placeholder="Search conversations..."
                            aria-label="Search conversations"
                        />
                    </div>

                    <div className="conv-split-list">
                        {loading ? (
                            <div className="conv-split-empty">
                                <p>Loading conversations...</p>
                            </div>
                        ) : error ? (
                            <div className="conv-split-empty">
                                <p>Error loading conversations</p>
                            </div>
                        ) : Object.keys(groupedConversations).length === 0 ? (
                            <div className="conv-split-empty">
                                <p>No conversations found</p>
                            </div>
                        ) : (
                            Object.entries(groupedConversations).map(([dateGroup, convs]) => (
                                <div key={dateGroup} className="conv-date-group">
                                    <div className="conv-date-header">{dateGroup}</div>
                                    {convs.map((conv) => (
                                        <div
                                            key={conv.chatId}
                                            className={`conv-item ${selectedChatId === conv.chatId ? "selected" : ""}`}
                                            onClick={() => setSelectedChatId(conv.chatId)}
                                        >
                                            <div className="conv-item-main">
                                                <div className="conv-item-header">
                                                    <span className="conv-item-agent">{conv?.agent?.name || "Unknown Agent"}</span>
                                                    <span className="conv-item-time">{formatTime(conv.createdAt || conv.updatedAt)}</span>
                                                </div>
                                                <div className="conv-item-preview">{preview(conv?.message)}</div>
                                                <div className="conv-item-meta">
                                                    <span className="conv-item-id">thread_{conv.chatId}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="conv-split-right">
                    {!selectedChatId ? (
                        <div className="conv-split-placeholder">
                            <h3>Select a thread to view details</h3>
                            <p>Choose a conversation from the left to see the full thread</p>
                        </div>
                    ) : (
                        <div className="conv-detail-container">
                            <div className="conv-detail-header">
                                <div className="conv-detail-info">
                                    <h3 className="conv-detail-title">Conversation</h3>
                                    <div className="conv-detail-meta">
                                        <span className="conv-detail-agent">Agent: {selectedMeta.agentName}</span>
                                        <span className="conv-detail-company">Company: {selectedMeta.companyName}</span>
                                        <span className="conv-detail-id">Chat: {selectedChatId}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="conv-detail-messages">
                                {messagesLoading ? (
                                    <div className="conv-detail-loading">
                                        <p>Loading messages...</p>
                                    </div>
                                ) : selectedMessages.length === 0 ? (
                                    <div className="conv-detail-empty">
                                        <p>No messages in this conversation</p>
                                    </div>
                                ) : (
                                    <div className="conv-messages-thread">
                                        {selectedMessages.map((msg, idx) => (
                                            <div key={`${msg.threadId}-${idx}`} className="conv-message">
                                                <div className="conv-message-avatar">
                                                    <img src="/jmrlogo.png" alt="Avatar" width="32" height="32" loading="lazy" />
                                                </div>
                                                <div className="conv-message-content">
                                                    <div className="conv-message-header">
                                                        <span className="conv-message-sender">{msg?.sender || "Agent"}</span>
                                                        <span className="conv-message-time">{formatTime(msg.createdAt)}</span>
                                                    </div>
                                                    <div className="conv-message-body">
                                                        <p>{msg?.message || ""}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
