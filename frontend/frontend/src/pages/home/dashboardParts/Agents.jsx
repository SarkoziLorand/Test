import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../auth/AuthService";

export default function Agents() {
    const { authFetch } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    const [companies, setCompanies] = useState([]);

    const [openIds, setOpenIds] = useState(() => new Set());

    useEffect(() => {
        const loadData = async () => {
            try {
                const response = await authFetch("/agent");
                if (!response) return;

                const agents = await response.json();

                const byCompany = agents.reduce((acc, a) => {
                    const cid = a?.company?.id || "unknown";
                    if (!acc[cid]) acc[cid] = { company: a.company || { id: cid, name: "Unknown Company" }, agents: [] };
                    acc[cid].agents.push(a);
                    return acc;
                }, {});
                setCompanies(Object.values(byCompany));
            } catch (e) {
                console.error("Failed to load agents", e);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [authFetch]);

    const toggleCompany = (id) => {
        setOpenIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const goToAgentDetail = useCallback((agent) => {
        navigate(`/app/agents/${agent.id}`, { state: { agent } });
    }, [navigate]);

    return (
        <>
            <link rel="stylesheet" href="/Agents.css" />

            <section className="companies-wrap" aria-label="Companies">
                <header className="companies-head">
                    <h2 className="companies-title">Companies</h2>
                    <div className="companies-meta">
                        <span className="count">{companies?.length ?? 0}</span>
                        <span className="muted">total</span>
                    </div>
                </header>

                {loading ? (
                    <div className="empty-state">
                        <p className="empty-title">Loading…</p>
                        <p className="empty-sub">Fetching companies and agents.</p>
                    </div>
                ) : (!companies || companies.length === 0) ? (
                    <div className="empty-state">
                        <p className="empty-title">No companies found</p>
                        <p className="empty-sub">When companies are available, they’ll appear here.</p>
                    </div>
                ) : (
                    <ul className="company-list" role="list">
                        {companies.map((group) => {
                            const id = group?.company?.id;
                            const name = group?.company?.name || "Unknown Company";
                            const isOpen = !openIds.has(id);

                            return (
                                <li key={id} className="company-card" data-id={id}>
                                    <div className="card-body">
                                        {/* company logo */}
                                        <img
                                            src="/jmrlogo.png"
                                            alt={`${name} logo`}
                                            className="company-logo"
                                            width="40"
                                            height="40"
                                            loading="lazy"
                                        />

                                        <h3 className="company-name">{name}</h3>

                                        <button
                                            type="button"
                                            className="btn-toggle"
                                            aria-expanded={isOpen}
                                            aria-controls={`agents-${id}`}
                                            onClick={() => toggleCompany(id)}
                                        >
                                            {isOpen ? "Hide agents" : "Show agents"}
                                        </button>
                                    </div>

                                    <div
                                        id={`agents-${id}`}
                                        className={`agents-panel ${isOpen ? "open" : ""}`}
                                        role="region"
                                        aria-label={`Agents for ${name}`}
                                    >
                                        {group.agents && group.agents.length > 0 ? (
                                            <table className="agents-table">
                                                <thead>
                                                    <tr>
                                                        <th>Name</th>
                                                        <th>State</th>
                                                        <th>Assistant ID</th>
                                                        <th></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {group.agents.map((a) => (
                                                        <tr key={a.id}>
                                                            <td className="agent-name">
                                                                <img
                                                                    src="/jmrlogo.png"
                                                                    alt={`${name} logo`}
                                                                    className="agent-logo"
                                                                    width="18"
                                                                    height="18"
                                                                    loading="lazy"
                                                                />
                                                                <span>{a.name}</span>
                                                            </td>
                                                            <td className="agent-state">{a.state}</td>
                                                            <td className="agent-assistant">{a.assistant_id}</td>
                                                            <td className="agent-actions">
                                                                <button
                                                                    type="button"
                                                                    className="btn-primary"
                                                                    onClick={() => goToAgentDetail(a)}
                                                                    aria-label={`Open details for ${a.name}`}
                                                                >
                                                                    Agent Detail
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <div className="no-agents">No agents for this company.</div>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>
        </>
    );
}
