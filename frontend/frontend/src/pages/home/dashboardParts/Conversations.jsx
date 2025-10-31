import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../auth/AuthService";

export default function Conversations() {
  const { authFetch } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [conversations, setConversation] = useState([]);
  const [currentAgent, setCurrentAgent] = useState(""); // used as filter (by agent name)
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        const response = await authFetch("/conversations");
        if (!response) return;
        const convs = await response.json();
        if (active) {
          setConversation(Array.isArray(convs) ? convs : []);
        }
      } catch (e) {
        console.error("Failed to load conversations", e);
        setError("Failed to load conversations.");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();
    return () => { active = false; };
  }, [authFetch]);

  const filtered = useMemo(() => {
    const q = (currentAgent || "").trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(c =>
      (c?.agent?.name || "").toLowerCase().includes(q)
    );
  }, [conversations, currentAgent]);

  const openConversation = (chatId) => {
    if (!chatId) return;
    console.log(chatId);
    navigate(`/app/conversations/${chatId}`);
  };

  const preview = (text, n = 80) => {
    if (!text) return "—";
    const s = String(text);
    return s.length > n ? s.slice(0, n - 1) + "… " : s;
  };

  return (
    <>
      <link rel="stylesheet" href="/Conversations.css" />

      <section className="conv-wrap" aria-label="Conversations">
        <header className="conv-head">
          <div className="conv-titlewrap">
            <h2 className="conv-title">Conversations</h2>
            <div className="conv-meta">
              <span className="count">{filtered.length}</span>
              <span className="muted">visible</span>
            </div>
          </div>

          <div className="conv-actions">
            <input
              type="text"
              value={currentAgent}
              onChange={(e) => setCurrentAgent(e.target.value)}
              className="conv-input"
              placeholder="Filter by agent name…"
              aria-label="Filter conversations by agent name"
            />
          </div>
        </header>

        {loading ? (
          <div className="conv-empty">
            <p className="empty-title">Loading…</p>
            <p className="empty-sub">Fetching conversations.</p>
          </div>
        ) : error ? (
          <div className="conv-empty">
            <p className="empty-title">Something went wrong</p>
            <p className="empty-sub">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="conv-empty">
            <p className="empty-title">No conversations</p>
            <p className="empty-sub">Try a different agent name.</p>
          </div>
        ) : (
          <div className="conv-tablewrap">
            <table className="conv-table">
              <thead>
                <tr>
                  <th>Chat ID</th>
                  <th>Agent</th>
                  <th>Company</th>
                  <th>Preview</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const chatId = c?.chatId;
                  const agentName = c?.agent?.name || "Unknown";
                  const agentId = c?.agent?.id || c?.agentId || "—";
                  const companyName = c?.agent?.company?.name || "—";
                  return (
                    <tr
                      key={chatId}
                      className="conv-row"
                      data-chat-id={chatId}
                      data-agent-id={agentId}
                      title={`Chat ${chatId}`}
                    >
                      <td className="cell-id">{chatId}</td>
                      <td className="cell-agent">
                        {/* logo is optional; keeping text-only to stay minimal */}
                        <span className="agent-name">{agentName}</span>
                        <span className="visually-hidden">Agent ID: {agentId}</span>
                      </td>
                      <td className="cell-company">{companyName}</td>
                      <td className="cell-preview">{preview(c?.message, 88)}</td>
                      <td className="cell-actions">
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => openConversation(chatId)}
                          aria-label={`Open conversation ${chatId}`}
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
