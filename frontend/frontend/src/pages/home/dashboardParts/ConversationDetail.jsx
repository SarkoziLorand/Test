import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../auth/AuthService";

export default function ConversationDetail() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { authFetch } = useAuth();

  const [loading, setLoading] = useState(true);
  const [msgs, setMsgs] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // POST body { chatId } 
        const response = await authFetch("/conversations/get-chat-by-id", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chatId }),
        });
        if (!response) {
          throw new Error("No response");
        }

        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error("Unexpected payload");
        }

        if (active) {
          // sort by createdAt asc for a natural timeline
          const sorted = [...data].sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
          );
          setMsgs(sorted);
        }
      } catch (e) {
        console.error("Failed to load conversation", e);
        if (active) setError("Failed to load this conversation.");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();
    return () => { active = false; };
  }, [authFetch, chatId]);

  const meta = useMemo(() => {
    const first = msgs[0];
    return {
      agentName: first?.agent?.name || "—",
      companyName: first?.agent?.company?.name || "—",
    };
  }, [msgs]);

  const fmt = (iso) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso || "—";
    }
  };

  return (
    <>
      <link rel="stylesheet" href="/ConversationDetail.css" />

      <section className="cd-wrap" aria-label="Conversation detail">
        <header className="cd-head">
          <div className="cd-left">
            <button
              type="button"
              className="btn-outline"
              onClick={() => navigate("/app/conversations")}
              aria-label="Back to conversations"
            >
              ← Back
            </button>

            <div className="cd-ident">
              <img
                src="/jmrlogo.png"
                alt="Business logo"
                className="cd-logo"
                width="32"
                height="32"
                loading="lazy"
              />
              <div className="cd-titles">
                <h2 className="cd-title">Conversation</h2>
                <div className="cd-sub">
                  <span className="cd-chip">Chat: {chatId}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="cd-right">
            <div className="cd-meta">
              <div className="cd-meta-item">
                <span className="cd-label">Agent</span>
                <span className="cd-value">{meta.agentName}</span>
              </div>
              <div className="cd-meta-item">
                <span className="cd-label">Company</span>
                <span className="cd-value">{meta.companyName}</span>
              </div>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="cd-empty">
            <p className="empty-title">Loading…</p>
            <p className="empty-sub">Fetching messages.</p>
          </div>
        ) : error ? (
          <div className="cd-empty">
            <p className="empty-title">Something went wrong</p>
            <p className="empty-sub">{error}</p>
          </div>
        ) : msgs.length === 0 ? (
          <div className="cd-empty">
            <p className="empty-title">No messages yet</p>
            <p className="empty-sub">This chat has no content.</p>
          </div>
        ) : (
          <div className="cd-thread">
            {msgs.map((m, idx) => (
              <article key={`${m.threadId}-${idx}`} className="cd-msg">
                <div className="cd-avatar">
                  <img
                    src="/jmrlogo.png"
                    alt="Avatar"
                    width="28"
                    height="28"
                    loading="lazy"
                  />
                </div>
                <div className="cd-bubble">
                  <header className="cd-msg-head">
                    <span className="cd-msg-author">
                      {m?.sender || "Agent"}
                    </span>
                    <span className="cd-msg-time">{fmt(m.createdAt)}</span>
                  </header>
                  <div className="cd-msg-body">
                    <p>{m?.message || ""}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
