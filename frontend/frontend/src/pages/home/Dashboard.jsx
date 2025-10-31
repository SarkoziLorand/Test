import React from "react";
import { NavLink, Outlet } from "react-router-dom";

export default function Dashboard({
  brand = "NEPALEZU",
  logoSrc = "/nepalezu-symbol.svg",
}) {
  const items = [
    { label: "Overview", to: "/app/overview" },
    { label: "Agents", to: "/app/agents" },
    { label: "Conversations", to: "/app/conversations" },
    { label: "Integrations", to: "/app/integrations" },
    // { label: "Reservations", to: "/app/reservations" },
    // { label: "Revenue", to: "/app/revenue" },
  ];

  return (
    <>
      <link rel="stylesheet" href="/nepalezu-dashboard.css" />
      <div className="backgrounebun layout-row">
        <aside className="dashboard sidebar" role="navigation" aria-label="Sidebar">
          <div className="brand">
            {logoSrc ? (
              <img src={logoSrc} alt={`${brand} logo`} width="30" height="30" />
            ) : null}
            <span>{brand}</span>
          </div>

          <nav className="nav">
            {items.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                className={({ isActive }) => (isActive ? "is-active" : undefined)}
              >
                {it.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="right-side-dashboard">
          {/* Aici intră paginile rulate ca rute copil */}
          <Outlet />
        </div>
      </div>
    </>
  );
}
