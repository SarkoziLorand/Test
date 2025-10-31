"use client"

export default function Overview() {
    return (
        <>
            <link rel="stylesheet" href="/Overview.css" />

            <div className="overview">
                <div className="card">
                    <div className="section-label">Mission KPIs (7d)</div>
                    <div className="kpis">
                        <div className="kpi">
                            <div className="label">Conversations</div>
                            <div className="value">1,284</div>
                            <div className="delta up">+12.4%</div>
                        </div>
                        <div className="kpi">
                            <div className="label">Revenue via agents</div>
                            <div className="value">$18,920</div>
                            <div className="delta up">+7.8%</div>
                        </div>
                        <div className="kpi">
                            <div className="label">Avg. margin</div>
                            <div className="value">32.6%</div>
                            <div className="delta up">+1.9%</div>
                        </div>
                    </div>
                    <div className="chart">
                        <svg viewBox="0 0 600 160" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#2dd4bf" />
                                    <stop offset="100%" stopColor="#60a5fa" />
                                </linearGradient>
                            </defs>
                            <path d="M0,120 C60,108 120,98 180,75 C240,52 300,90 360,64 C420,38 480,20 540,64 C570,86 600,70 600,70" fill="none" stroke="url(#lg)" strokeWidth="4" />
                        </svg>
                    </div>
                </div>

                <div className="grid2">
                    <div className="card">
                        <div className="section-label">Agents</div>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Channel</th>
                                    <th>Status</th>
                                    <th>7d conv.</th>
                                    <th>Rev.</th>
                                    <th>Margin</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Concierge-Bot</td>
                                    <td>WhatsApp</td>
                                    <td><span className="status ok">Healthy</span></td>
                                    <td>472</td>
                                    <td>$7,240</td>
                                    <td>33%</td>
                                </tr>
                                <tr>
                                    <td>Booking Sync</td>
                                    <td>Booking.com</td>
                                    <td><span className="status warn">Degraded</span></td>
                                    <td>316</td>
                                    <td>$5,960</td>
                                    <td>31%</td>
                                </tr>
                                <tr>
                                    <td>Channel Manager</td>
                                    <td>Smoobu</td>
                                    <td><span className="status ok">Healthy</span></td>
                                    <td>228</td>
                                    <td>$3,440</td>
                                    <td>35%</td>
                                </tr>
                                <tr>
                                    <td>Web Chat</td>
                                    <td>Direct</td>
                                    <td><span className="status err">Down</span></td>
                                    <td>—</td>
                                    <td>—</td>
                                    <td>—</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="card">
                        <div className="section-label">Channel mix</div>
                        <svg viewBox="0 0 160 160" className="donut">
                            <defs>
                                <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0%" stopColor="#e7cb71" />
                                    <stop offset="100%" stopColor="#c7a441" />
                                </linearGradient>
                            </defs>
                            <circle cx="80" cy="80" r="58" stroke="rgba(255,255,255,.06)" strokeWidth="16" fill="none" />
                            <circle cx="80" cy="80" r="58" stroke="url(#gold)" strokeWidth="16" fill="none" strokeDasharray="180 364" transform="rotate(-90 80 80)" />
                            <circle cx="80" cy="80" r="58" stroke="#60a5fa" strokeWidth="16" fill="none" strokeDasharray="120 364" strokeDashoffset="-180" transform="rotate(-90 80 80)" />
                            <circle cx="80" cy="80" r="58" stroke="#2dd4bf" strokeWidth="16" fill="none" strokeDasharray="64 364" strokeDashoffset="-300" transform="rotate(-90 80 80)" />
                        </svg>
                        <div className="caption">Direct • Booking.com • WhatsApp</div>
                    </div>
                </div>
            </div>
        </>
    )
}