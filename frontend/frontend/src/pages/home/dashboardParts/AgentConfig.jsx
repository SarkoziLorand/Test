"use client"

import { useParams, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { useAuth } from "../../../auth/AuthService"
import WhatsAppIntegration from "./WhatsAppIntegration"
import WhiteBlackList from "./WhiteBlackList"

export default function AgentConfig() {
    const { agentId } = useParams()
    const navigate = useNavigate()
    const { authFetch } = useAuth()

    const [agentData, setAgentData] = useState(null)
    const [availableIntegrations, setAvailableIntegrations] = useState([])
    const [editingIntegration, setEditingIntegration] = useState(null)
    const [editingSystemPrompt, setEditingSystemPrompt] = useState(false)
    const [systemPrompt, setSystemPrompt] = useState("")
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [loading, setLoading] = useState(true)
    const [originalValues, setOriginalValues] = useState({})
    const [validationErrors, setValidationErrors] = useState([])

    const mockUpdateIntegration = (integrationId, agentId, data) => {
        console.log("Updating integration:", integrationId, "for agent:", agentId)

        const original = originalValues[integrationId] || {}
        const changes = {}
        let hasChanges = false

        Object.keys(data).forEach((key) => {
            if (JSON.stringify(original[key]) !== JSON.stringify(data[key])) {
                changes[key] = {
                    from: original[key],
                    to: data[key],
                    status: "UPDATED",
                }
                hasChanges = true
            }
        })

        if (hasChanges) {
            console.log("CHANGES DETECTED:", changes)
            Object.keys(changes).forEach((key) => {
                console.log(`${key}: ${changes[key].status} - from "${changes[key].from}" to "${changes[key].to}"`)
            })
        } else {
            console.log("NO CHANGES DETECTED - NOT UPDATED")
        }

        return Promise.resolve({ success: true, changes, hasChanges })
    }

    const mockAddIntegration = async (agentId, integrationName) => {
        console.log("Adding integration:", integrationName, "to agent:", agentId)

        const bodyParams = {
            agentId,
            integration: integrationName,
        }

        await authFetch(`/agent-config/integrations`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(bodyParams),
        })

        try {
            const response = await authFetch(`/agent-config/cfg/${agentId}`)
            if (response) {
                const agentData = await response.json()
                setAgentData(agentData)
            }
        } catch (e) {
            console.error("Failed to load agent data.", e)
        }
    }

    const mockToggleIntegration = async (agentId, integrationName, status) => {
        console.log("Toggling integration:", integrationName, "for agent:", agentId, "to status:", status)

        const bodyParams = {
            agentId,
            integration: integrationName,
            status
        }

        try {
            const response = await authFetch('/agent-config/integrations-status', {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(bodyParams)
            });

            if (response.ok) {
                console.log("We succesfully updated the flag for integrations.");
            }

        } catch (err) {
            console.log(err);
        }
    }

    const mockUpdateSystemPrompt = async (agentId, prompt) => {
        console.log("Updating system prompt for agent:", agentId, "with prompt:", prompt.slice(0, 10))

        const bodyParams = {
            agentId,
            prompt,
        }

        const response = await authFetch(`/agent/agent-prompt`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(bodyParams),
        })

        console.log(response)

        if (response?.ok) {
            const data = await response.json()

            if (!data.changed) {
                alert("Something went wrong when updating the system prompt!")
            }
        } else {
            alert("Something went wrong when updating the system prompt!")
        }
    }

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await authFetch(`/agent-config/cfg/${agentId}`)
                if (response) {
                    const agentData = await response.json()
                    setAgentData(agentData)
                }
            } catch (e) {
                console.error("Failed to load agent data.", e)
            }

            try {
                const response = await authFetch(`/agent-config/integrations`)
                if (response) {
                    const allAvailableIntegrations = await response.json()
                    setAvailableIntegrations(allAvailableIntegrations)
                }
            } catch (e) {
                console.error("Failed to load available integrations.", e)
            }

            try {
                const response = await authFetch(`/agent/agent-prompt/${agentId}`)
                if (response) {
                    const prompt = await response.json()
                    setSystemPrompt(prompt.system_prompt)
                }
            } catch (e) {
                console.error("Failed to load agent data.", e)
            }

            setLoading(false)
        }

        fetchData()
    }, [agentId])

    const validateIntegration = (integration) => {
        const errors = []

        if (integration.apiKeys && integration.apiKeys.length > 0) {
            integration.apiKeys.forEach((key, index) => {
                const keyInput = document.querySelector(`input[data-key-id="${key.id}"]`)
                if (keyInput) {
                    const value = keyInput.value.trim()
                    if (!value || value.length < 2) {
                        errors.push(`API Key "${key.name}" must be at least 2 characters long`)
                    }
                }
            })
        }

        return errors
    }

    const validateSystemPrompt = (prompt) => {
        const errors = []

        if (!prompt || prompt.trim().length === 0) {
            errors.push("System prompt cannot be empty")
        }

        if (prompt && prompt.length < 10) {
            errors.push("System prompt must be at least 10 characters long")
        }

        if (prompt && prompt.length > 5000) {
            errors.push("System prompt cannot exceed 5000 characters")
        }

        return errors
    }

    const handleSaveIntegration = async (integration) => {
        setValidationErrors([])

        const errors = validateIntegration(integration)

        if (errors.length > 0) {
            setValidationErrors(errors)
            return
        }

        const updatedIntegration = { ...integration }
        if (integration.apiKeys) {
            updatedIntegration.apiKeys = integration.apiKeys.map((key) => {
                const keyInput = document.querySelector(`input[data-key-id="${key.id}"]`)
                return {
                    ...key,
                    keyPreview: keyInput ? keyInput.value : key.keyPreview,
                }
            })
        }

        await mockUpdateIntegration(integration.id, agentId, updatedIntegration)
        setEditingIntegration(null)
        setValidationErrors([])
    }

    const handleAddIntegration = async (integrationName) => {
        await mockAddIntegration(agentId, integrationName)
        setShowAddDialog(false)
    }

    const handleToggleIntegration = async (integrationName, currentStatus) => {
        const newStatus = currentStatus === "ON" ? "OFF" : "ON"
        await mockToggleIntegration(agentId, integrationName, newStatus)

        setAgentData((prev) => ({
            ...prev,
            agentFlags: prev.agentFlags.map((flag) =>
                flag.flagName === integrationName ? { ...flag, status: newStatus } : flag,
            ),
        }))
    }

    const handleSaveSystemPrompt = async () => {
        setValidationErrors([])

        const errors = validateSystemPrompt(systemPrompt)

        if (errors.length > 0) {
            setValidationErrors(errors)
            return
        }

        await mockUpdateSystemPrompt(agentId, systemPrompt)
        setEditingSystemPrompt(false)
        setValidationErrors([])
    }

    const startEditingIntegration = (integration) => {
        setOriginalValues((prev) => ({
            ...prev,
            [integration.id]: { ...integration },
        }))
        setEditingIntegration(integration.id)
        setValidationErrors([])
    }

    const cancelEditIntegration = () => {
        setEditingIntegration(null)
        setValidationErrors([])
    }

    const cancelEditSystemPrompt = () => {
        setEditingSystemPrompt(false)
        setValidationErrors([])
    }

    const getFilteredIntegrations = () => {
        if (!agentData) return []
        const flagNames = agentData.agentFlags.map((flag) => flag.flagName)
        return agentData.integrations.filter((integration) => flagNames.includes(integration.name))
    }

    const getIntegrationStatus = (integrationName) => {
        if (!agentData) return "OFF"
        const flag = agentData.agentFlags.find((flag) => flag.flagName === integrationName)
        return flag ? flag.status : "OFF"
    }

    const getAvailableToAdd = () => {
        if (!agentData) return []
        const flagNames = agentData.agentFlags.map((flag) => flag.flagName)
        return availableIntegrations.filter((int) => !flagNames.includes(int.name))
    }

    const isWhatsAppAvailable = () => {
        if (!agentData) return false
        return agentData.agentFlags.some((flag) => flag.flagName === "WhatsApp")
    }

    const getWhatsAppStatus = () => {
        if (!agentData) return "OFF"
        const flag = agentData.agentFlags.find((flag) => flag.flagName === "WhatsApp")
        return flag ? flag.status : "OFF"
    }

    if (loading) {
        return <div className="loading">Loading agent details...</div>
    }

    return (
        <>
            <link rel="stylesheet" href="/AgentDetail.css" />

            <div className="agent-detail">
                {validationErrors.length > 0 && (
                    <div className="error-container">
                        <div className="error-alert">
                            <div className="error-header">
                                <span className="error-icon">⚠️</span>
                                <span className="error-title">Validation Errors</span>
                            </div>
                            <div className="error-list">
                                {validationErrors.map((error, index) => (
                                    <div key={index} className="error-item">
                                        {error}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="agent-header">
                    <button className="back-btn" onClick={() => navigate("/agents")}>
                        ← Back
                    </button>

                    <div className="agent-info">
                        <img src="/agent-logo.jpg" alt="Agent" className="agent-logo" />
                        <div>
                            <h1>Agent Configuration</h1>
                            <p className="agent-id">ID: {agentId}</p>
                            <p className="integration-count">{getFilteredIntegrations().length} integrations active</p>
                        </div>
                    </div>
                </div>

                <div className="system-prompt-section">
                    <div className="system-prompt-card">
                        <div className="card-header">
                            <h3>System Prompt</h3>
                            <div className="card-actions">
                                {editingSystemPrompt ? (
                                    <>
                                        <button className="save-btn" onClick={handleSaveSystemPrompt}>
                                            Save
                                        </button>
                                        <button className="cancel-btn" onClick={cancelEditSystemPrompt}>
                                            Cancel
                                        </button>
                                    </>
                                ) : (
                                    <button className="edit-btn" onClick={() => setEditingSystemPrompt(true)}>
                                        Edit
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="card-content">
                            {editingSystemPrompt ? (
                                <textarea
                                    value={systemPrompt}
                                    onChange={(e) => setSystemPrompt(e.target.value)}
                                    className="system-prompt-input"
                                    rows={4}
                                    placeholder="Enter system prompt..."
                                />
                            ) : (
                                <p className="system-prompt-text">{systemPrompt}</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="integrations-section">
                    <h2>Active Integrations</h2>

                    <div className="integrations-list">
                        {isWhatsAppAvailable() && (
                            <WhatsAppIntegration agentId={agentId} status={getWhatsAppStatus()} onToggle={handleToggleIntegration} />
                        )}

                        <WhiteBlackList agentId={agentId} listType={'whitelist'}/>
                        <WhiteBlackList agentId={agentId} listType={'blacklist'}/>

                        {getFilteredIntegrations()
                            .filter((integration) => integration.name !== "WhatsApp")
                            .map((integration) => {
                                const status = getIntegrationStatus(integration.name)
                                return (
                                    <div key={integration.id} className="integration-card">
                                        <div className="card-header">
                                            <h3>{integration.name}</h3>
                                            <div className="card-actions">
                                                <div className="toggle-container">
                                                    <div
                                                        className={`toggle-switch ${status === "ON" ? "on" : "off"}`}
                                                        onClick={() => handleToggleIntegration(integration.name, status)}
                                                    >
                                                        <div className="toggle-circle"></div>
                                                    </div>
                                                    <span className="toggle-text">{status}</span>
                                                </div>
                                                {editingIntegration !== integration.id && (
                                                    <button className="edit-btn" onClick={() => startEditingIntegration(integration)}>
                                                        ⚙️
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="card-content">
                                            {integration.apiKeys.length > 0 && (
                                                <div className="field-group">
                                                    <label>API Keys</label>
                                                    {integration.apiKeys.map((key) => (
                                                        <div key={key.id} className="api-key-item">
                                                            <span className="key-name">{key.name}</span>
                                                            {editingIntegration === integration.id ? (
                                                                <input
                                                                    type="text"
                                                                    defaultValue={key.keyPreview}
                                                                    className="key-input"
                                                                    placeholder="Enter API key..."
                                                                    data-key-id={key.id}
                                                                />
                                                            ) : (
                                                                <span className="key-preview">{key.keyPreview}...</span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {editingIntegration === integration.id && (
                                            <div className="card-footer">
                                                <button className="save-btn" onClick={() => handleSaveIntegration(integration)}>
                                                    Save
                                                </button>
                                                <button className="cancel-btn" onClick={cancelEditIntegration}>
                                                    Cancel
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}

                        {getAvailableToAdd().length > 0 && (
                            <div className="add-integration-btn" onClick={() => setShowAddDialog(true)}>
                                <div className="plus-icon">+</div>
                            </div>
                        )}
                    </div>
                </div>

                {showAddDialog && (
                    <div className="dialog-overlay" onClick={() => setShowAddDialog(false)}>
                        <div className="dialog" onClick={(e) => e.stopPropagation()}>
                            <h3>Add Integration</h3>
                            <div className="available-integrations">
                                {getAvailableToAdd().map((integration) => (
                                    <button
                                        key={integration.name}
                                        className="integration-option"
                                        onClick={() => handleAddIntegration(integration.name)}
                                    >
                                        {integration.name}
                                    </button>
                                ))}
                            </div>
                            <button className="close-dialog" onClick={() => setShowAddDialog(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}
