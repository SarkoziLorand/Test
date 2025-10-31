"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "../../../auth/AuthService"
import { io } from "socket.io-client"
import { data } from "react-router-dom"

export default function WhatsAppIntegration({ agentId, status, onToggle }) {
    const { getValidAccessToken, authFetch } = useAuth()
    const [whatsappStatus, setWhatsappStatus] = useState("DISCONNECTED")
    const [statusDetails, setStatusDetails] = useState("")
    const [qrCode, setQrCode] = useState(null)
    const [isConnecting, setIsConnecting] = useState(false)
    const [phoneNumber, setPhoneNumber] = useState(null)
    const socketRef = useRef(null)

    useEffect(() => {
        if (status === "ON") {
            connectWebSocket()
        } else {
            disconnectWebSocket()
            setWhatsappStatus("DISCONNECTED")
            setStatusDetails("")
            setQrCode(null)
            setIsConnecting(false)
        }

        return () => {
            disconnectWebSocket()
        }
    }, [status, agentId])

    // When WhatsApp session becomes CONNECTED, fetch phone number
    useEffect(() => {
        const fetchPhone = async () => {
            try {
                const response = await authFetch(`/agent-config/phone-number/${agentId}`)
                if (response?.ok) {
                    const data = await response.json()
                    setPhoneNumber(data?.phoneNumber ?? null)
                } else {
                    setPhoneNumber(null)
                }
            } catch (err) {
                console.error("[v0] Failed to fetch phone number:", err)
                setPhoneNumber(null)
            }
        }

        if (whatsappStatus === "CONNECTED") {
            fetchPhone()
        } else {
            setPhoneNumber(null)
        }
    }, [whatsappStatus, agentId])

    const connectWebSocket = async () => {
        try {
            const token = await getValidAccessToken()

            socketRef.current = io("http://localhost:8080/ws/agents", {
                auth: { token },
                query: { agentId },
                transports: ["websocket"],
            })

            socketRef.current.on("connect", () => {
                console.log("[v0] WhatsApp WebSocket connected")
                setIsConnecting(false)
            })
 
            socketRef.current.on("wapp:status", ({ state, details }) => {
                console.log("[v0] WhatsApp status update:", state, details)
                const normalizedState = state || "DISCONNECTED"
                setWhatsappStatus(normalizedState)
                setStatusDetails(details || "")
                
                // Clear QR code when authenticated or connected
                if (["AUTHENTICATED", "CONNECTED"].includes(normalizedState)) {
                    setQrCode(null)
                }
            })

            socketRef.current.on("wapp:qr", ({ dataUrl }) => {
                console.log("[v0] WhatsApp QR received")
                console.log(whatsappStatus);
                console.log(dataUrl);
                if (dataUrl) {
                    setQrCode(dataUrl)
                }
            })

            socketRef.current.on("wapp:error", ({ message }) => {
                console.log("[v0] WhatsApp error:", message)
                setStatusDetails(`Error: ${message}`)
                // Clear QR on error
                setQrCode(null)
            })

            socketRef.current.on("disconnect", () => {
                console.log("[v0] WhatsApp WebSocket disconnected")
                setWhatsappStatus("DISCONNECTED")
                setQrCode(null)
                setStatusDetails("")
            })
        } catch (error) {
            console.error("[v0] Failed to connect WhatsApp WebSocket:", error)
            setWhatsappStatus("DISCONNECTED")
            setStatusDetails("Connection failed")
            setQrCode(null)
        }
    }

    const disconnectWebSocket = () => {
        if (socketRef.current) {
            socketRef.current.disconnect()
            socketRef.current = null
        }
    }

    const handleStart = async () => {
        setIsConnecting(true)
        try {
            const token = await getValidAccessToken()
            const response = await authFetch(`/agents/${agentId}/whatsapp/start`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            })

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`)
            }

            setStatusDetails("Starting WhatsApp client...")
        } catch (error) {
            console.error("[v0] Failed to start WhatsApp:", error)
            setStatusDetails("Failed to start")
            setIsConnecting(false)
        }
    }

    const handleStop = async () => {
        try {
            const token = await getValidAccessToken()
            const response = await authFetch(`/agents/${agentId}/whatsapp/stop`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            })

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`)
            }

            setStatusDetails("Stopping WhatsApp client...")
        } catch (error) {
            console.error("[v0] Failed to stop WhatsApp:", error)
            setStatusDetails("Failed to stop")
        }
    }

    const handleReset = async () => {
        try {
            const token = await getValidAccessToken()
            const response = await authFetch(`/agents/${agentId}/whatsapp/reset`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            })

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`)
            }

            setStatusDetails("Resetting WhatsApp session...")
            setQrCode(null)
        } catch (error) {
            console.error("[v0] Failed to reset WhatsApp:", error)
            setStatusDetails("Failed to reset")
        }
    }

    const getStatusPillClass = () => {
        const state = whatsappStatus.toUpperCase()
        if (["CONNECTED", "AUTHENTICATED"].includes(state)) {
            return "whatsapp-status-ok"
        } else if (["REQUESTING_QR", "INITIALIZING"].includes(state)) {
            return "whatsapp-status-warn"
        } else {
            return "whatsapp-status-err"
        }
    }

    const shouldShowQR = whatsappStatus === "REQUESTING_QR" && qrCode;
    const shouldShowActions = ["CONNECTED", "AUTHENTICATED"].includes(whatsappStatus)

    return (
        <div className="integration-card whatsapp-card">
            <div className="card-header">
                <h3 className="integration-title">
                    <img
                        className="integration-icon"
                        src="/whatsapp.jpg"
                        alt="WhatsApp icon"
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/jmrlogo.png' }}
                    />
                    <span>WhatsApp</span>
                </h3>
                <div className="card-actions">
                    <div className="toggle-container">
                        <div
                            className={`toggle-switch ${status === "ON" ? "on" : "off"}`}
                            onClick={() => onToggle("WhatsApp", status)}
                        >
                            <div className="toggle-circle"></div>
                        </div>
                        <span className="toggle-text">{status}</span>
                    </div>
                </div>
            </div>

            {status === "ON" && (
                <div className="card-content">
                    <div className="whatsapp-dashboard">
                        <div className="whatsapp-status-row">
                            <span>Status:</span>
                            <div className={`whatsapp-status-pill ${getStatusPillClass()}`}>{whatsappStatus}</div>
                        </div>

                        {whatsappStatus === "CONNECTED" && (
                            <div className="whatsapp-phone-row">
                                <span>Phone:</span>
                                <div className="whatsapp-phone-badge">{phoneNumber ?? "—"}</div>
                            </div>
                        )}

                        {statusDetails && (
                            <div className="whatsapp-details">
                                <small>{statusDetails}</small>
                            </div>
                        )}

                        {shouldShowQR && (
                            <div className="whatsapp-qr-section">
                                <h4>Scan QR to log in</h4>
                                <img src={qrCode || "/placeholder.svg"} alt="WhatsApp QR Code" className="whatsapp-qr-image" />
                                <div className="whatsapp-qr-instructions">
                                    <small>Open WhatsApp → Linked devices → Link a device</small>
                                </div>
                            </div>
                        )}

                        <div className="whatsapp-actions">
                            {!shouldShowActions && whatsappStatus !== "INITIALIZING" && (
                                <button className="whatsapp-btn whatsapp-btn-start" onClick={handleStart} disabled={isConnecting}>
                                    {isConnecting ? "Starting..." : "Start"}
                                </button>
                            )}

                            {shouldShowActions && (
                                <>
                                    <button className="whatsapp-btn whatsapp-btn-stop" onClick={handleStop}>
                                        Stop
                                    </button>
                                    <button className="whatsapp-btn whatsapp-btn-reset" onClick={handleReset}>
                                        Reset
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}