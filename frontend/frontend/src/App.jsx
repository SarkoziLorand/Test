import React from "react";
import LoginPage from "./pages/auth/LoginPage";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Dashboard from "./pages/home/Dashboard";
import { AuthProvider, useAuth } from "./auth/AuthService";

// Pagini (conținutul pentru Outlet)
import Overview from "./pages/home/dashboardParts/Overview";
import Agents from "./pages/home/dashboardParts/Agents";
import AgentDetail from "./pages/home/dashboardParts/AgentDetail";
import Conversations from "./pages/home/dashboardParts/Conversations";
import Integrations from "./pages/home/dashboardParts/Integrations";
import ConversationDetail from "./pages/home/dashboardParts/ConversationDetail";
import AgentConfig from "./pages/home/dashboardParts/AgentConfig";
import ConversationsSplitView from "./pages/home/dashboardParts/ConversationsSplit";

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Layout protejat */}
          <Route
            path="/app"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<Overview />} />
            <Route path="agents" element={<Agents />} />
            <Route path="agents/:agentId" element={<AgentDetail />} />
            <Route path="agents/:agentId/config" element={<AgentConfig />} />
            <Route path="conversations/:chatId" element={<ConversationDetail />} />
            <Route path="conversations" element={<ConversationsSplitView />} />
            <Route path="integrations" element={<Integrations />} />
          </Route>

          <Route path="*" element={<Navigate to="/app" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
