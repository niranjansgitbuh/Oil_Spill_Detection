"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  AlertTriangle,
  Bell,
  Send,
  MapPin,
  Mail,
  Siren,
  Users,
  FileText,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  Settings,
  Zap,
  Radio,
  Satellite,
  Ship,
} from "lucide-react"

interface OilSpillAlert {
  id: string
  timestamp: string
  severity: "low" | "medium" | "high" | "critical"
  status: "active" | "acknowledged" | "resolved" | "false_alarm"
  source: "ais_anomaly" | "satellite_detection" | "manual_report" | "vessel_distress"
  location: { lat: number; lng: number }
  vesselId?: string
  vesselName?: string
  spillArea?: number // square kilometers
  confidence: number
  description: string
  weatherConditions?: {
    windSpeed: number
    windDirection: number
    waveHeight: number
    temperature: number
  }
  estimatedVolume?: number // barrels
  responseTeams: string[]
  notifications: NotificationRecord[]
}

interface NotificationRecord {
  id: string
  timestamp: string
  recipient: string
  method: "email" | "sms" | "radio" | "satellite_phone" | "emergency_broadcast"
  status: "sent" | "delivered" | "failed" | "acknowledged"
  message: string
}

interface ResponseTeam {
  id: string
  name: string
  type: "coast_guard" | "environmental_agency" | "cleanup_crew" | "emergency_services"
  contactMethods: {
    email: string
    phone: string
    radio: string
    emergencyLine: string
  }
  location: { lat: number; lng: number }
  status: "available" | "deployed" | "unavailable"
  estimatedResponseTime: number // minutes
}

interface AlertSettings {
  autoNotification: boolean
  severityThreshold: "low" | "medium" | "high" | "critical"
  notificationMethods: string[]
  escalationTime: number // minutes
  requireAcknowledgment: boolean
  broadcastToAll: boolean
}

export function OilSpillAlertSystem() {
  const [alerts, setAlerts] = useState<OilSpillAlert[]>([])
  const [responseTeams, setResponseTeams] = useState<ResponseTeam[]>([])
  const [selectedAlert, setSelectedAlert] = useState<OilSpillAlert | null>(null)
  const [alertSettings, setAlertSettings] = useState<AlertSettings>({
    autoNotification: true,
    severityThreshold: "medium",
    notificationMethods: ["email", "sms", "radio"],
    escalationTime: 15,
    requireAcknowledgment: true,
    broadcastToAll: false,
  })
  const [isSystemActive, setIsSystemActive] = useState(true)
  const [newAlertForm, setNewAlertForm] = useState({
    severity: "medium" as const,
    location: { lat: 0, lng: 0 },
    description: "",
    vesselName: "",
    estimatedVolume: 0,
  })

  // Mock data initialization
  useEffect(() => {
    const mockAlerts: OilSpillAlert[] = [
      {
        id: "alert001",
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        severity: "critical",
        status: "active",
        source: "satellite_detection",
        location: { lat: 28.5383, lng: -94.0377 },
        vesselId: "v003",
        vesselName: "GULF GUARDIAN",
        spillArea: 2.3,
        confidence: 0.92,
        description: "Large oil spill detected via satellite imagery. Vessel GULF GUARDIAN showing distress signals.",
        weatherConditions: {
          windSpeed: 15,
          windDirection: 225,
          waveHeight: 2.1,
          temperature: 24,
        },
        estimatedVolume: 1500,
        responseTeams: ["team001", "team002"],
        notifications: [
          {
            id: "notif001",
            timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
            recipient: "US Coast Guard District 8",
            method: "emergency_broadcast",
            status: "acknowledged",
            message: "CRITICAL: Oil spill detected at 28.5383, -94.0377. Immediate response required.",
          },
        ],
      },
      {
        id: "alert002",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        severity: "high",
        status: "acknowledged",
        source: "ais_anomaly",
        location: { lat: 19.1, lng: 72.9 },
        vesselId: "v002",
        vesselName: "MARINE EXPLORER",
        confidence: 0.78,
        description: "Vessel stopped unexpectedly in shipping lane. Potential distress situation.",
        responseTeams: ["team003"],
        notifications: [
          {
            id: "notif002",
            timestamp: new Date(Date.now() - 115 * 60 * 1000).toISOString(),
            recipient: "Mumbai Port Authority",
            method: "email",
            status: "delivered",
            message: "HIGH: Vessel anomaly detected. MARINE EXPLORER requires investigation.",
          },
        ],
      },
    ]

    const mockTeams: ResponseTeam[] = [
      {
        id: "team001",
        name: "US Coast Guard District 8",
        type: "coast_guard",
        contactMethods: {
          email: "ops@uscg-d8.mil",
          phone: "+1-504-589-6225",
          radio: "Channel 16 VHF",
          emergencyLine: "+1-504-589-6298",
        },
        location: { lat: 29.9511, lng: -90.0715 },
        status: "deployed",
        estimatedResponseTime: 45,
      },
      {
        id: "team002",
        name: "EPA Emergency Response Team",
        type: "environmental_agency",
        contactMethods: {
          email: "spill-response@epa.gov",
          phone: "+1-800-424-8802",
          radio: "FEMA Channel 1",
          emergencyLine: "+1-800-424-8802",
        },
        location: { lat: 29.7604, lng: -95.3698 },
        status: "available",
        estimatedResponseTime: 90,
      },
      {
        id: "team003",
        name: "Mumbai Coast Guard",
        type: "coast_guard",
        contactMethods: {
          email: "ops@indiancoastguard.nic.in",
          phone: "+91-22-2431-6558",
          radio: "Channel 16 VHF",
          emergencyLine: "+91-22-2431-6558",
        },
        location: { lat: 18.922, lng: 72.8347 },
        status: "available",
        estimatedResponseTime: 30,
      },
    ]

    setAlerts(mockAlerts)
    setResponseTeams(mockTeams)
    setSelectedAlert(mockAlerts[0])
  }, [])

  // Simulate real-time alert updates
  useEffect(() => {
    if (!isSystemActive) return

    const interval = setInterval(() => {
      // Simulate new alerts occasionally
      if (Math.random() < 0.1) {
        // 10% chance every 30 seconds
        const newAlert: OilSpillAlert = {
          id: `alert_${Date.now()}`,
          timestamp: new Date().toISOString(),
          severity: ["low", "medium", "high"][Math.floor(Math.random() * 3)] as "low" | "medium" | "high",
          status: "active",
          source: ["ais_anomaly", "satellite_detection"][Math.floor(Math.random() * 2)] as
            | "ais_anomaly"
            | "satellite_detection",
          location: {
            lat: 19 + (Math.random() - 0.5) * 2,
            lng: 72 + (Math.random() - 0.5) * 2,
          },
          confidence: 0.6 + Math.random() * 0.4,
          description: "Automated detection of potential oil spill incident",
          responseTeams: [],
          notifications: [],
        }

        setAlerts((prev) => [newAlert, ...prev])
      }
    }, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [isSystemActive])

  const handleAlertStatusChange = (alertId: string, newStatus: OilSpillAlert["status"]) => {
    setAlerts((prev) => prev.map((alert) => (alert.id === alertId ? { ...alert, status: newStatus } : alert)))
  }

  const handleSendNotification = async (alertId: string, method: string, recipient: string) => {
    const alert = alerts.find((a) => a.id === alertId)
    if (!alert) return

    const notification: NotificationRecord = {
      id: `notif_${Date.now()}`,
      timestamp: new Date().toISOString(),
      recipient,
      method: method as NotificationRecord["method"],
      status: "sent",
      message: `${alert.severity.toUpperCase()}: Oil spill alert at ${alert.location.lat.toFixed(4)}, ${alert.location.lng.toFixed(4)}`,
    }

    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, notifications: [...a.notifications, notification] } : a)),
    )

    // Simulate delivery status update
    setTimeout(() => {
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === alertId
            ? {
                ...a,
                notifications: a.notifications.map((n) =>
                  n.id === notification.id ? { ...n, status: "delivered" } : n,
                ),
              }
            : a,
        ),
      )
    }, 2000)
  }

  const handleCreateManualAlert = () => {
    const newAlert: OilSpillAlert = {
      id: `manual_${Date.now()}`,
      timestamp: new Date().toISOString(),
      severity: newAlertForm.severity,
      status: "active",
      source: "manual_report",
      location: newAlertForm.location,
      confidence: 1.0,
      description: newAlertForm.description,
      vesselName: newAlertForm.vesselName || undefined,
      estimatedVolume: newAlertForm.estimatedVolume || undefined,
      responseTeams: [],
      notifications: [],
    }

    setAlerts((prev) => [newAlert, ...prev])
    setNewAlertForm({
      severity: "medium",
      location: { lat: 0, lng: 0 },
      description: "",
      vesselName: "",
      estimatedVolume: 0,
    })
  }

  const getSeverityColor = (severity: OilSpillAlert["severity"]) => {
    switch (severity) {
      case "low":
        return "bg-muted text-muted-foreground"
      case "medium":
        return "bg-warning text-warning-foreground"
      case "high":
        return "bg-destructive text-destructive-foreground"
      case "critical":
        return "bg-destructive text-destructive-foreground animate-pulse"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getStatusColor = (status: OilSpillAlert["status"]) => {
    switch (status) {
      case "active":
        return "bg-destructive text-destructive-foreground"
      case "acknowledged":
        return "bg-warning text-warning-foreground"
      case "resolved":
        return "bg-success text-success-foreground"
      case "false_alarm":
        return "bg-muted text-muted-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getSourceIcon = (source: OilSpillAlert["source"]) => {
    switch (source) {
      case "ais_anomaly":
        return <Ship className="h-4 w-4" />
      case "satellite_detection":
        return <Satellite className="h-4 w-4" />
      case "manual_report":
        return <FileText className="h-4 w-4" />
      case "vessel_distress":
        return <Radio className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const activeAlerts = alerts.filter((a) => a.status === "active").length
  const criticalAlerts = alerts.filter((a) => a.severity === "critical" && a.status === "active").length
  const totalNotifications = alerts.reduce((sum, alert) => sum + alert.notifications.length, 0)
  const acknowledgedAlerts = alerts.filter((a) => a.status === "acknowledged").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Siren className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-xl font-semibold">Oil Spill Alert System</h2>
            <p className="text-sm text-muted-foreground">Emergency response and notification management</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isSystemActive ? "bg-success animate-pulse" : "bg-muted"}`} />
          <span className="text-sm text-muted-foreground mr-4">
            {isSystemActive ? "System Active" : "System Paused"}
          </span>
          <Button
            variant={isSystemActive ? "destructive" : "default"}
            size="sm"
            onClick={() => setIsSystemActive(!isSystemActive)}
          >
            {isSystemActive ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {isSystemActive ? "Pause" : "Activate"}
          </Button>
        </div>
      </div>

      {/* Critical Alert Banner */}
      {criticalAlerts > 0 && (
        <Alert className="border-destructive bg-destructive/10 animate-pulse">
          <Siren className="h-4 w-4 text-destructive" />
          <AlertTitle className="text-destructive">CRITICAL ALERT ACTIVE</AlertTitle>
          <AlertDescription>
            {criticalAlerts} critical oil spill alert{criticalAlerts > 1 ? "s" : ""} requiring immediate emergency
            response
          </AlertDescription>
        </Alert>
      )}

      {/* Alert Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Bell className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{activeAlerts}</div>
            <p className="text-xs text-muted-foreground">Requiring attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            <Zap className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{criticalAlerts}</div>
            <p className="text-xs text-muted-foreground">Emergency response needed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notifications Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalNotifications}</div>
            <p className="text-xs text-muted-foreground">Total dispatched</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Teams</CardTitle>
            <Users className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {responseTeams.filter((t) => t.status === "available").length}
            </div>
            <p className="text-xs text-muted-foreground">Available for deployment</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Alert Management */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Alerts</TabsTrigger>
          <TabsTrigger value="create">Create Alert</TabsTrigger>
          <TabsTrigger value="teams">Response Teams</TabsTrigger>
          <TabsTrigger value="settings">Alert Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Alert List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Alert Queue
                </CardTitle>
                <CardDescription>Current oil spill alerts and incidents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-accent/50 ${
                      selectedAlert?.id === alert.id ? "bg-accent" : ""
                    }`}
                    onClick={() => setSelectedAlert(alert)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getSourceIcon(alert.source)}
                        <Badge className={getSeverityColor(alert.severity)}>{alert.severity.toUpperCase()}</Badge>
                        <Badge className={getStatusColor(alert.status)}>
                          {alert.status.replace("_", " ").toUpperCase()}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm mb-2">{alert.description}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {alert.location.lat.toFixed(4)}, {alert.location.lng.toFixed(4)}
                      </div>
                      {alert.vesselName && (
                        <div className="flex items-center gap-1">
                          <Ship className="h-3 w-3" />
                          {alert.vesselName}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        {(alert.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Alert Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Alert Details & Response
                </CardTitle>
                <CardDescription>
                  {selectedAlert ? `Alert ${selectedAlert.id}` : "Select an alert to view details"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedAlert ? (
                  <div className="space-y-4">
                    {/* Alert Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Severity</label>
                        <div className="flex items-center gap-2">
                          <Badge className={getSeverityColor(selectedAlert.severity)}>
                            {selectedAlert.severity.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Status</label>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(selectedAlert.status)}>
                            {selectedAlert.status.replace("_", " ").toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Location</label>
                        <p className="font-mono text-sm">
                          {selectedAlert.location.lat.toFixed(6)}, {selectedAlert.location.lng.toFixed(6)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Confidence</label>
                        <div className="flex items-center gap-2">
                          <Progress value={selectedAlert.confidence * 100} className="flex-1" />
                          <span className="text-sm">{(selectedAlert.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Environmental Data */}
                    {selectedAlert.weatherConditions && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">
                          Environmental Conditions
                        </label>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>Wind: {selectedAlert.weatherConditions.windSpeed} m/s</div>
                          <div>Waves: {selectedAlert.weatherConditions.waveHeight} m</div>
                          <div>Direction: {selectedAlert.weatherConditions.windDirection}°</div>
                          <div>Temp: {selectedAlert.weatherConditions.temperature}°C</div>
                        </div>
                      </div>
                    )}

                    {/* Status Actions */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Alert Actions</label>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAlertStatusChange(selectedAlert.id, "acknowledged")}
                          disabled={selectedAlert.status === "acknowledged"}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Acknowledge
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAlertStatusChange(selectedAlert.id, "resolved")}
                          disabled={selectedAlert.status === "resolved"}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Resolve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAlertStatusChange(selectedAlert.id, "false_alarm")}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          False Alarm
                        </Button>
                      </div>
                    </div>

                    {/* Emergency Notifications */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Emergency Notifications</label>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-destructive text-destructive-foreground"
                          onClick={() =>
                            handleSendNotification(selectedAlert.id, "emergency_broadcast", "All Response Teams")
                          }
                        >
                          <Radio className="h-4 w-4 mr-2" />
                          Emergency Broadcast
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendNotification(selectedAlert.id, "email", "Coast Guard")}
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Email Alert
                        </Button>
                      </div>
                    </div>

                    {/* Notification History */}
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        Notification History
                      </label>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {selectedAlert.notifications.map((notif) => (
                          <div key={notif.id} className="p-2 rounded border text-sm">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{notif.recipient}</span>
                              <Badge variant="outline" className="text-xs">
                                {notif.status}
                              </Badge>
                            </div>
                            <div className="text-muted-foreground text-xs">
                              {notif.method} • {new Date(notif.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select an alert from the queue to view details and manage response</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Create Manual Alert
              </CardTitle>
              <CardDescription>Report oil spill incidents manually</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Severity Level</label>
                  <Select
                    value={newAlertForm.severity}
                    onValueChange={(value: "low" | "medium" | "high" | "critical") =>
                      setNewAlertForm((prev) => ({ ...prev, severity: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Vessel Name (Optional)</label>
                  <Input
                    value={newAlertForm.vesselName}
                    onChange={(e) => setNewAlertForm((prev) => ({ ...prev, vesselName: e.target.value }))}
                    placeholder="Enter vessel name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Latitude</label>
                  <Input
                    type="number"
                    step="0.000001"
                    value={newAlertForm.location.lat}
                    onChange={(e) =>
                      setNewAlertForm((prev) => ({
                        ...prev,
                        location: { ...prev.location, lat: Number.parseFloat(e.target.value) || 0 },
                      }))
                    }
                    placeholder="0.000000"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Longitude</label>
                  <Input
                    type="number"
                    step="0.000001"
                    value={newAlertForm.location.lng}
                    onChange={(e) =>
                      setNewAlertForm((prev) => ({
                        ...prev,
                        location: { ...prev.location, lng: Number.parseFloat(e.target.value) || 0 },
                      }))
                    }
                    placeholder="0.000000"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Estimated Volume (Barrels)</label>
                <Input
                  type="number"
                  value={newAlertForm.estimatedVolume}
                  onChange={(e) =>
                    setNewAlertForm((prev) => ({ ...prev, estimatedVolume: Number.parseInt(e.target.value) || 0 }))
                  }
                  placeholder="0"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Textarea
                  value={newAlertForm.description}
                  onChange={(e) => setNewAlertForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the oil spill incident..."
                  rows={4}
                />
              </div>

              <Button onClick={handleCreateManualAlert} className="w-full">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Create Alert
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teams" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Response Teams
              </CardTitle>
              <CardDescription>Emergency response team contacts and status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {responseTeams.map((team) => (
                <div key={team.id} className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{team.name}</h3>
                      <Badge variant="outline">{team.type.replace("_", " ")}</Badge>
                      <Badge
                        className={
                          team.status === "available"
                            ? "bg-success text-success-foreground"
                            : team.status === "deployed"
                              ? "bg-warning text-warning-foreground"
                              : "bg-muted text-muted-foreground"
                        }
                      >
                        {team.status.toUpperCase()}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">ETA: {team.estimatedResponseTime} min</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Emergency Line:</span>
                      <span className="ml-2 font-mono">{team.contactMethods.emergencyLine}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Radio:</span>
                      <span className="ml-2">{team.contactMethods.radio}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <span className="ml-2">{team.contactMethods.email}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="ml-2 font-mono">{team.contactMethods.phone}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Alert System Configuration
              </CardTitle>
              <CardDescription>Configure automatic alert and notification settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Automatic Notifications</label>
                    <p className="text-sm text-muted-foreground">
                      Send notifications automatically when alerts are created
                    </p>
                  </div>
                  <Switch
                    checked={alertSettings.autoNotification}
                    onCheckedChange={(checked) => setAlertSettings((prev) => ({ ...prev, autoNotification: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Require Acknowledgment</label>
                    <p className="text-sm text-muted-foreground">Require manual acknowledgment of alerts</p>
                  </div>
                  <Switch
                    checked={alertSettings.requireAcknowledgment}
                    onCheckedChange={(checked) =>
                      setAlertSettings((prev) => ({ ...prev, requireAcknowledgment: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Broadcast to All Teams</label>
                    <p className="text-sm text-muted-foreground">Send critical alerts to all response teams</p>
                  </div>
                  <Switch
                    checked={alertSettings.broadcastToAll}
                    onCheckedChange={(checked) => setAlertSettings((prev) => ({ ...prev, broadcastToAll: checked }))}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Minimum Severity for Auto-Notification</label>
                  <Select
                    value={alertSettings.severityThreshold}
                    onValueChange={(value: "low" | "medium" | "high" | "critical") =>
                      setAlertSettings((prev) => ({ ...prev, severityThreshold: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Escalation Time (minutes)</label>
                  <Input
                    type="number"
                    value={alertSettings.escalationTime}
                    onChange={(e) =>
                      setAlertSettings((prev) => ({ ...prev, escalationTime: Number.parseInt(e.target.value) || 15 }))
                    }
                    placeholder="15"
                  />
                </div>

                <Button className="w-full">Save Alert Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
