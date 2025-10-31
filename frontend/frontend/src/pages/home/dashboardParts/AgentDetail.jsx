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
    const [editedIntegrationValues, setEditedIntegrationValues] = useState({})

    const validateIntegration = (integrationId) => {
        const errors = []
        const edited = editedIntegrationValues[integrationId]?.apiKeys || []
        edited.forEach((k, index) => {
            const value = (k.keyPreview ?? '').trim()
            if (!value) {
                const keyName = k.name || `Key ${index + 1}`
                errors.push(`API Key "${keyName}" must be at least 2 characters long`)
            }
        })
        const editedConfigs = editedIntegrationValues[integrationId]?.agentConfig || []
        editedConfigs.forEach((c, index) => {
            const value = (c.key ?? '').trim()
            if (!value) {
                const cfgName = c.name || `Config ${index + 1}`
                errors.push(`Agent Config "${cfgName}" must be at least 2 characters long`)
            }
        })
        return errors
    }

    const updateEditedApiKey = (integrationId, keyId, value) => {
        setEditedIntegrationValues((prev) => {
            const currentApiKeys = prev[integrationId]?.apiKeys || []
            const currentConfigs = prev[integrationId]?.agentConfig || []
            const nextApiKeys = currentApiKeys.map((k) => (k.id === keyId ? { ...k, keyPreview: value } : k))
            return { ...prev, [integrationId]: { apiKeys: nextApiKeys, agentConfig: currentConfigs } }
        })
    }

    const updateEditedAgentConfig = (integrationId, configId, value) => {
        setEditedIntegrationValues((prev) => {
            const currentApiKeys = prev[integrationId]?.apiKeys || []
            const currentConfigs = prev[integrationId]?.agentConfig || []
            const nextConfigs = currentConfigs.map((c) => (c.id === configId ? { ...c, key: value } : c))
            return { ...prev, [integrationId]: { apiKeys: currentApiKeys, agentConfig: nextConfigs } }
        })
    }

    const detectUpdatedApiKeys = (original = [], edited = []) => {
        const updates = []
        edited.forEach((editedKey) => {
            const originalKey = original.find((k) => k.id === editedKey.id)
            if (originalKey && originalKey.keyPreview !== editedKey.keyPreview) {
                updates.push({
                    id: editedKey.id,
                    name: originalKey.name,
                    original: originalKey,
                    updated: editedKey,
                })
            }
        })
        return updates
    }

    const detectUpdatedAgentConfig = (original = [], edited = []) => {
        const updates = []
        edited.forEach((editedCfg) => {
            const originalCfg = original.find((c) => c.id === editedCfg.id)
            if (originalCfg && originalCfg.key !== editedCfg.key) {
                updates.push({
                    id: editedCfg.id,
                    name: originalCfg.name,
                    original: originalCfg,
                    updated: editedCfg,
                })
            }
        })
        return updates
    }

    const updateApiKey = async (entryId, keyPreview) => {
        const bodyParams = {
            entryId,
            keyPreview
        };

        const response = await authFetch(`/agent-config/apikeys`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(bodyParams)
        });

        if (response?.ok) {
            console.log("API key successfully updated.");
            return true;
        }
        console.log("There was a problem updating the API key");
        return false;
    }

    const updateAgentConfig = async (entryId, key) => {
        const bodyPrams = {
            entryId,
            key
        };

        const response = await authFetch(`/agent-config/agentcfg`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(bodyPrams)
        });

        if (response?.ok) {
            console.log("The AgentConfig was successfully updated");
            return true;
        }
        console.log("There was a problem updating the agent config");
        return false;
    }

    const submitIntegrationUpdate = async ({ agentId, integrationId, integrationName, updatedApiKeys = [], updatedAgentConfig = [] }) => {
        const payload = {
            agentId,
            integrationId,
            apiKeyUpdates: updatedApiKeys.map((u) => ({ id: u.id, name: u.name, keyPreview: u.updated.keyPreview })),
            agentConfigUpdates: updatedAgentConfig.map((u) => ({ id: u.id, name: u.name, key: u.updated.key })),
        }
        console.log('Payload (not sent):', payload)
        console.groupEnd()
        // TODO: perform API call here when enabled

        const apiKeyPromises = updatedApiKeys.map((apiKey) =>
            updateApiKey(apiKey.updated.id ?? apiKey.id, apiKey.updated.keyPreview)
        );

        const agentCfgPromises = updatedAgentConfig.map((config) =>
            updateAgentConfig(config.updated.id ?? config.id, config.updated.key)
        );

        const results = await Promise.allSettled([...apiKeyPromises, ...agentCfgPromises]);
        const failures = results.filter((r) => r.status === "rejected");
        if (failures.length) {
            console.error("Some updates failed:", failures);
            return { success: false };
        }

        try {
            const response = await authFetch(`/agent-config/cfg/${agentId}`)
            if (response) {
                const agentData = await response.json()
                setAgentData(agentData)
            }
        } catch (e) {
            console.error("Failed to load agent data.", e)
        }

        return { success: true }
    }

    // Log before toggling an integration from OFF to ON
    const logBeforeToggleOn = (agentId, integrationName, fromStatus, toStatus) => {
        console.group('[Integration Toggle Preview]')
        console.log('Agent ID:', agentId)
        console.log('Integration:', integrationName)
        console.log('From:', fromStatus, 'To:', toStatus)
        console.groupEnd()
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

    const mockUpdateIntegration = (integrationId, agentId) => {
        console.log("Updating integration:", integrationId, "for agent:", agentId)

        const original = originalValues[integrationId] || {}
        const integrationElements = document.querySelectorAll(`[data-integration-id="${integrationId}"] .api-key-item`)

        const updatedData = { apiKeys: [] }
        integrationElements.forEach((element) => {
            const keyInput = element.querySelector('.key-input')
            const keyName = element.querySelector('.key-name')?.textContent
            const keyId = keyInput?.getAttribute('data-key-id')

            if (keyInput && keyId) {
                updatedData.apiKeys.push({
                    id: keyId,
                    name: keyName,
                    keyPreview: keyInput.value.trim()
                })
            }
        })

        const changes = {}
        let hasChanges = false

        if (JSON.stringify(original.apiKeys) !== JSON.stringify(updatedData.apiKeys)) {
            changes.apiKeys = {
                from: (original.apiKeys?.length || 0) + " keys",
                to: updatedData.apiKeys.length + " keys",
                status: "UPDATED"
            }
            hasChanges = true
        }

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

    const handleSaveIntegration = async (integration) => {
        setValidationErrors([])

        const errors = validateIntegration(integration.id)

        if (errors.length > 0) {
            setValidationErrors(errors)
            return
        }

        const originalApiKeys = originalValues[integration.id]?.apiKeys || []
        const editedApiKeys = editedIntegrationValues[integration.id]?.apiKeys || []
        const updatedApiKeys = detectUpdatedApiKeys(originalApiKeys, editedApiKeys)

        const originalAgentConfig = originalValues[integration.id]?.agentConfig || []
        const editedAgentConfig = editedIntegrationValues[integration.id]?.agentConfig || []
        const updatedAgentConfig = detectUpdatedAgentConfig(originalAgentConfig, editedAgentConfig)

        const preview = {
            agentId,
            integrationId: integration.id,
            integrationName: integration.name,
            updatedApiKeys,
            updatedAgentConfig,
        }

        if (updatedApiKeys.length === 0 && updatedAgentConfig.length === 0) {
            console.info(`[Integration Update] No changes detected for ${integration.name} (${integration.id}).`)
        } else {
            await submitIntegrationUpdate(preview)
        }
        setEditingIntegration(null)
        setValidationErrors([])
    }

    const handleAddIntegration = async (integrationName) => {
        await mockAddIntegration(agentId, integrationName)
        setShowAddDialog(false)
    }

    const handleToggleIntegration = async (integrationName, currentStatus) => {
        const newStatus = currentStatus === "ON" ? "OFF" : "ON"
        if (currentStatus !== "ON" && newStatus === "ON") {
            logBeforeToggleOn(agentId, integrationName, currentStatus, newStatus)
        }
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
            [integration.id]: {
                ...integration,
                apiKeys: (integration.apiKeys || []).map((k) => ({ ...k })),
                agentConfig: (integration.agentConfig || []).map((c) => ({ ...c })),
            },
        }))
        setEditedIntegrationValues((prev) => ({
            ...prev,
            [integration.id]: {
                apiKeys: (integration.apiKeys || []).map((k) => ({ id: k.id, name: k.name, keyPreview: k.keyPreview })),
                agentConfig: (integration.agentConfig || []).map((c) => ({ id: c.id, name: c.name, key: c.key })),
            },
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

    const getIntegrationIcon = (name) => {
        const key = (name || '').toLowerCase()
        const map = {
            openai: '/openai.png',
            smoobu: '/smoobu.jpg',
            whatsapp: '/whatsapp.jpg',
            elevenlabs: '/elevenlabs.jpg'
        }
        return map[key] || '/integration.png'
    }

    const getIntegrationLink = (name) => {
        const key = (name || '').toLowerCase()
        const map = {
            openai: '',
            smoobu: '',
            whatsapp: '',
        }
        const url = map[key]
        return url && url.trim() ? url : null
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
                    <button className="back-btn" onClick={() => navigate("/app/agents")}>
                        ← Back
                    </button>

                    <div className="agent-info">
                        <img src="/jmrlogo.png" alt="Agent" className="agent-logo" />
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

                        <WhiteBlackList agentId={agentId} listType={'whitelist'} />
                        <WhiteBlackList agentId={agentId} listType={'blacklist'} />

                        {getFilteredIntegrations()
                            .filter((integration) => integration.name !== "WhatsApp")
                            .map((integration) => {
                                const status = getIntegrationStatus(integration.name)
                                const iconSrc = getIntegrationIcon(integration.name)
                                const link = getIntegrationLink(integration.name)
                                return (
                                    <div key={integration.id} className="integration-card" data-integration-id={integration.id}>
                                        <div className="card-header">
                                            <h3 className="integration-title">
                                                <img
                                                    className="integration-icon"
                                                    src={iconSrc}
                                                    alt={`${integration.name} icon`}
                                                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/jmrlogo.png' }}
                                                />
                                                {link ? (
                                                    <a href={link} target="_blank" rel="noopener noreferrer">{integration.name}</a>
                                                ) : (
                                                    <span>{integration.name}</span>
                                                )}
                                            </h3>
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
                                                                    value={editedIntegrationValues[integration.id]?.apiKeys.find((k) => k.id === key.id)?.keyPreview ?? ""}
                                                                    onChange={(e) => updateEditedApiKey(integration.id, key.id, e.target.value)}
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
                                            <br />
                                            {integration.agentConfig && integration.agentConfig.length > 0 && (
                                                <div className="field-group">
                                                    <label>Agent Configs</label>
                                                    {integration.agentConfig.map((cfg) => (
                                                        <div key={cfg.id} className="api-key-item">
                                                            <span className="key-name">{cfg.name}</span>
                                                            {editingIntegration === integration.id ? (
                                                                <input
                                                                    type="text"
                                                                    value={editedIntegrationValues[integration.id]?.agentConfig.find((c) => c.id === cfg.id)?.key ?? ""}
                                                                    onChange={(e) => updateEditedAgentConfig(integration.id, cfg.id, e.target.value)}
                                                                    className="key-input"
                                                                    placeholder="Enter config value..."
                                                                />
                                                            ) : (
                                                                <span className="key-preview">{cfg.key}...</span>
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