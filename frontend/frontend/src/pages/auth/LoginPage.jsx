import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthService";

export default function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || "/app";

    const { login } = useAuth(); // ✅ Use the context login
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    async function onSubmit(e) {
        e.preventDefault();
        setSubmitting(true);
        setError("");

        console.log("ce");
        const ok = await login(email, password, remember); // ✅ Use remember

        console.log(ok);
        setSubmitting(false);
        if (ok) navigate(from, { replace: true });
        else setError("Invalid credentials.");
    }

    return (
        <>
            <link rel="stylesheet" href="/style-nepalezu-login.css" />
            <div className="bg-aurora"></div>
            <div className="auth-wrap">
                <div className="card" style={{ transform: "perspective(1200px) translateZ(0)" }}>
                    <div className="scanline"></div>

                    <div className="brand">
                        <div className="orb"></div>
                        <div className="title">Maria AI</div>
                    </div>

                    <div className="subtitle">NEPALEZU Console • JMR Royal</div>

                    <form className="form" onSubmit={onSubmit}>
                        <label>
                            Email
                            <input
                                className="input"
                                placeholder="you@jmrroyal.com"
                                autoComplete="username email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={submitting}
                                required
                                autoFocus
                            />

                        </label>

                        <label>
                            Password
                            <input
                                type="password"
                                className="input"
                                placeholder="••••••••"
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={submitting}
                                required
                            />
                        </label>

                        <div className="actions">
                            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <input
                                    type="checkbox"
                                    checked={remember}
                                    onChange={(e) => setRemember(e.target.checked)}
                                    disabled={submitting}
                                />
                                Remember
                            </label>
                            <a href="#" style={{ color: "var(--muted)" }} onClick={(e) => e.preventDefault()}>
                                Forgot?
                            </a>
                        </div>

                        <button type="submit" className="btn" disabled={submitting}>
                            Sign in
                        </button>

                        {error ? (
                            <div style={{ color: "crimson", marginTop: 8, textAlign: "center" }}>{error}</div>
                        ) : null}
                    </form>

                    <div className="footer-note">© 2026 NEPALEZU</div>
                </div>
            </div>
        </>
    );
}
