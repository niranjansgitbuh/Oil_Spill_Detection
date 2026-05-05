"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Ship, AlertTriangle, Satellite, MapPin, Activity, Navigation, Shield, Eye, Gavel } from "lucide-react"
import { AnomalyDetectionPanel } from "@/components/anomaly-detection-panel"
import { SatelliteImageryViewer } from "@/components/satellite-imagery-viewer"
import { OilSpillAlertSystem } from "@/components/oil-spill-alert-system"
import { OilSpillDetectionPanel } from "@/components/OilSpillDetector"
import { GeographicMappingInterface } from "@/components/geographic-mapping-interface"
import { RegulatoryAuthorityPortal } from "@/components/regulatory-authority-portal"
import AISTracking from "./AISTracking"

interface VesselData {
  id: string
  name: string
  imo: string
  callSign: string
  latitude: number
  longitude: number
  speed: number
  course: number
  heading: number
  vesselType: string
  status: "normal" | "anomaly" | "distress" | "spill_detected"
  lastUpdate: string
  destination: string
  eta: string
  draught: number
}

interface AlertData {
  id: string
  vesselId: string
  vesselName: string
  type: "speed_anomaly" | "course_change" | "stop_anomaly" | "oil_spill"
  severity: "low" | "medium" | "high" | "critical"
  timestamp: string
  location: { lat: number; lng: number }
  description: string
}

export function AISMonitoringDashboard() {
  const [vessels, setVessels] = useState<VesselData[]>([])
  const [alerts, setAlerts] = useState<AlertData[]>([])
  const [selectedVessel, setSelectedVessel] = useState<VesselData | null>(null)
  const [isMonitoring, setIsMonitoring] = useState(true)
  const [showRegulatoryPortal, setShowRegulatoryPortal] = useState(false)

  useEffect(() => {
    const generateMockVessels = (): VesselData[] => [
      {
        id: "v001",
        name: "OCEAN NAVIGATOR",
        imo: "9123456",
        callSign: "ABCD",
        latitude: 19.076,
        longitude: 72.8777,
        speed: 12.5,
        course: 45,
        heading: 47,
        vesselType: "Cargo Ship",
        status: "normal",
        lastUpdate: new Date().toISOString(),
        destination: "Mumbai Port",
        eta: "2025-01-21T14:30:00Z",
        draught: 8.5,
      },
      {
        id: "v002",
        name: "MARINE EXPLORER",
        imo: "9234567",
        callSign: "EFGH",
        latitude: 19.1,
        longitude: 72.9,
        speed: 0.2,
        course: 180,
        heading: 185,
        vesselType: "Tanker",
        status: "anomaly",
        lastUpdate: new Date().toISOString(),
        destination: "Kandla Port",
        eta: "2025-01-22T08:15:00Z",
        draught: 12.3,
      },
      {
        id: "v003",
        name: "GULF GUARDIAN",
        imo: "9345678",
        callSign: "IJKL",
        latitude: 28.5383,
        longitude: -94.0377,
        speed: 8.7,
        course: 270,
        heading: 268,
        vesselType: "Oil Tanker",
        status: "spill_detected",
        lastUpdate: new Date().toISOString(),
        destination: "Houston Port",
        eta: "2025-01-21T20:45:00Z",
        draught: 15.2,
      },
    ]

    const generateMockAlerts = (): AlertData[] => [
      {
        id: "a001",
        vesselId: "v002",
        vesselName: "MARINE EXPLORER",
        type: "stop_anomaly",
        severity: "high",
        timestamp: new Date(Date.now() - 300000).toISOString(),
        location: { lat: 19.1, lng: 72.9 },
        description: "Vessel stopped unexpectedly in shipping lane",
      },
      {
        id: "a002",
        vesselId: "v003",
        vesselName: "GULF GUARDIAN",
        type: "oil_spill",
        severity: "critical",
        timestamp: new Date(Date.now() - 600000).toISOString(),
        location: { lat: 28.5383, lng: -94.0377 },
        description: "Satellite imagery confirms oil spill detected",
      },
    ]

    setVessels(generateMockVessels())
    setAlerts(generateMockAlerts())

    const interval = setInterval(() => {
      if (isMonitoring) {
        setVessels((prev) =>
          prev.map((vessel) => ({
            ...vessel,
            latitude: vessel.latitude + (Math.random() - 0.5) * 0.001,
            longitude: vessel.longitude + (Math.random() - 0.5) * 0.001,
            speed: Math.max(0, vessel.speed + (Math.random() - 0.5) * 2),
            course: (vessel.course + (Math.random() - 0.5) * 10) % 360,
            lastUpdate: new Date().toISOString(),
          })),
        )
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [isMonitoring])

  const getStatusColor = (status: VesselData["status"]) => {
    switch (status) {
      case "normal":
        return "bg-success text-success-foreground"
      case "anomaly":
        return "bg-warning text-warning-foreground"
      case "distress":
        return "bg-destructive text-destructive-foreground"
      case "spill_detected":
        return "bg-destructive text-destructive-foreground animate-pulse"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getSeverityColor = (severity: AlertData["severity"]) => {
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

  const criticalAlerts = alerts.filter((alert) => alert.severity === "critical").length
  const activeVessels = vessels.length
  const anomalyVessels = vessels.filter((v) => v.status !== "normal").length

  if (showRegulatoryPortal) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-8 w-8 text-primary" />
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">MarineGuard</h1>
                    <p className="text-sm text-muted-foreground">Oil Spill Detection System</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={() => setShowRegulatoryPortal(false)}>
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-6 py-6">
          <RegulatoryAuthorityPortal />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Shield className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold text-foreground">MarineGuard</h1>
                  <p className="text-sm text-muted-foreground">Oil Spill Detection System</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isMonitoring ? "bg-success animate-pulse" : "bg-muted"}`} />
                <span className="text-sm text-muted-foreground">
                  {isMonitoring ? "Live Monitoring" : "Monitoring Paused"}
                </span>
              </div>
              <Button
                variant={isMonitoring ? "destructive" : "default"}
                size="sm"
                onClick={() => setIsMonitoring(!isMonitoring)}
              >
                {isMonitoring ? "Pause" : "Resume"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6">
        {/* Critical Alerts Banner */}
        {criticalAlerts > 0 && (
          <Alert className="mb-6 border-destructive bg-destructive/10">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertTitle className="text-destructive">Critical Alert</AlertTitle>
            <AlertDescription>
              {criticalAlerts} critical alert{criticalAlerts > 1 ? "s" : ""} requiring immediate attention
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Vessels</CardTitle>
              <Ship className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeVessels}</div>
              <p className="text-xs text-muted-foreground">Currently tracked</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Anomalies</CardTitle>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{anomalyVessels}</div>
              <p className="text-xs text-muted-foreground">Vessels with anomalies</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
              <Satellite className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{criticalAlerts}</div>
              <p className="text-xs text-muted-foreground">Requiring immediate action</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              <Activity className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">Online</div>
              <p className="text-xs text-muted-foreground">All systems operational</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard */}
        <Tabs defaultValue="vessels" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="vessels">Vessel Tracking</TabsTrigger>
            <TabsTrigger value="oil-spill">Oil Spill Detection</TabsTrigger>
            <TabsTrigger value="anomalies">Anomaly Detection</TabsTrigger>
            <TabsTrigger value="alerts">Alert System</TabsTrigger>
            <TabsTrigger value="satellite">Satellite View</TabsTrigger>
            <TabsTrigger value="mapping">Geographic Map</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="vessels" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Vessel List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ship className="h-5 w-5" />
                    Tracked Vessels
                  </CardTitle>
                  <CardDescription>Real-time AIS data from active vessels</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {vessels.map((vessel) => (
                    <div
                      key={vessel.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-accent/50 ${
                        selectedVessel?.id === vessel.id ? "bg-accent" : ""
                      }`}
                      onClick={() => setSelectedVessel(vessel)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{vessel.name}</h3>
                          <Badge className={getStatusColor(vessel.status)}>
                            {vessel.status.replace("_", " ").toUpperCase()}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">{vessel.vesselType}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {vessel.latitude.toFixed(4)}, {vessel.longitude.toFixed(4)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Navigation className="h-3 w-3" />
                          {vessel.speed.toFixed(1)} kts
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Vessel Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Vessel Details
                  </CardTitle>
                  <CardDescription>
                    {selectedVessel ? `Details for ${selectedVessel.name}` : "Select a vessel to view details"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedVessel ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">IMO Number</label>
                          <p className="font-mono">{selectedVessel.imo}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Call Sign</label>
                          <p className="font-mono">{selectedVessel.callSign}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Position</label>
                          <p className="font-mono">
                            {selectedVessel.latitude.toFixed(6)}, {selectedVessel.longitude.toFixed(6)}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Speed</label>
                          <p>{selectedVessel.speed.toFixed(1)} knots</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Course</label>
                          <p>{selectedVessel.course}°</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Heading</label>
                          <p>{selectedVessel.heading}°</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Destination</label>
                          <p>{selectedVessel.destination}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Draught</label>
                          <p>{selectedVessel.draught}m</p>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Last Update</label>
                        <p className="text-sm">{new Date(selectedVessel.lastUpdate).toLocaleString()}</p>
                      </div>
                      {selectedVessel.status !== "normal" && (
                        <Button className="w-full bg-transparent" variant="outline">
                          <Satellite className="h-4 w-4 mr-2" />
                          Monitor with Satellite
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Ship className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Select a vessel from the list to view detailed information</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            <AISTracking vessels={vessels} selectedVessel={selectedVessel} onVesselSelect={setSelectedVessel} />

          </TabsContent>

          <TabsContent value="oil-spill" className="space-y-6">
            <OilSpillDetectionPanel />
          </TabsContent>

          <TabsContent value="anomalies" className="space-y-6">
            <AnomalyDetectionPanel />
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <OilSpillAlertSystem />
          </TabsContent>

          <TabsContent value="satellite" className="space-y-6">
            <SatelliteImageryViewer />
          </TabsContent>

          <TabsContent value="mapping" className="space-y-6">
            <GeographicMappingInterface />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Reports</CardTitle>
                  <CardDescription>Generate and view detection reports</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Activity className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Reporting Module</h3>
                    <p className="text-muted-foreground mb-4">
                      Generate comprehensive reports for regulatory authorities
                    </p>
                    <Button variant="outline">Generate Report</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Regulatory Portal</CardTitle>
                  <CardDescription>Access regulatory authority functions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Gavel className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Authority Access</h3>
                    <p className="text-muted-foreground mb-4">Incident management, compliance, and enforcement tools</p>
                    <Button onClick={() => setShowRegulatoryPortal(true)}>Access Portal</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
          </TabsContent>
           
        </Tabs>
       
      </div>
    </div>
  )
}
