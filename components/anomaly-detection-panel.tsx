"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Brain, TrendingUp, AlertTriangle, Activity, Zap, Target, BarChart3, Settings, Play, Pause } from "lucide-react"
import { VesselAnomalyDetector, type AnomalyResult, type VesselHistoryPoint } from "@/lib/anomaly-detection"

interface DetectionMetrics {
  totalAnalyzed: number
  anomaliesDetected: number
  falsePositiveRate: number
  detectionAccuracy: number
  processingTime: number
}

interface VesselAnalysis {
  vesselId: string
  vesselName: string
  riskScore: number
  anomalies: AnomalyResult[]
  lastAnalyzed: string
  status: "normal" | "monitoring" | "alert" | "critical"
}

export function AnomalyDetectionPanel() {
  const [isActive, setIsActive] = useState(true)
  const [metrics, setMetrics] = useState<DetectionMetrics>({
    totalAnalyzed: 0,
    anomaliesDetected: 0,
    falsePositiveRate: 0.12,
    detectionAccuracy: 0.94,
    processingTime: 0,
  })
  const [vesselAnalyses, setVesselAnalyses] = useState<VesselAnalysis[]>([])
  const [selectedAnalysis, setSelectedAnalysis] = useState<VesselAnalysis | null>(null)

  // Simulate real-time anomaly detection
  useEffect(() => {
    if (!isActive) return

    const interval = setInterval(() => {
      // Simulate processing vessels
      const startTime = Date.now()

      // Mock vessel data for demonstration
      const mockVessels = [
        {
          id: "v001",
          name: "OCEAN NAVIGATOR",
          currentData: {
            timestamp: new Date().toISOString(),
            latitude: 19.076 + (Math.random() - 0.5) * 0.01,
            longitude: 72.8777 + (Math.random() - 0.5) * 0.01,
            speed: 12.5 + (Math.random() - 0.5) * 3,
            course: 45 + (Math.random() - 0.5) * 20,
            heading: 47 + (Math.random() - 0.5) * 10,
          },
          history: generateMockHistory(),
        },
        {
          id: "v002",
          name: "MARINE EXPLORER",
          currentData: {
            timestamp: new Date().toISOString(),
            latitude: 19.1 + (Math.random() - 0.5) * 0.01,
            longitude: 72.9 + (Math.random() - 0.5) * 0.01,
            speed: Math.random() * 2, // Simulate potential stop anomaly
            course: 180 + (Math.random() - 0.5) * 60, // Simulate course changes
            heading: 185 + (Math.random() - 0.5) * 30,
          },
          history: generateMockHistory(),
        },
        {
          id: "v003",
          name: "GULF GUARDIAN",
          currentData: {
            timestamp: new Date().toISOString(),
            latitude: 28.5383 + (Math.random() - 0.5) * 0.01,
            longitude: -94.0377 + (Math.random() - 0.5) * 0.01,
            speed: 8.7 + (Math.random() - 0.5) * 15, // Simulate speed anomalies
            course: 270 + (Math.random() - 0.5) * 90, // Simulate erratic movement
            heading: 268 + (Math.random() - 0.5) * 45,
          },
          history: generateMockHistory(),
        },
      ]

      const analyses: VesselAnalysis[] = mockVessels.map((vessel) => {
        const anomalies = VesselAnomalyDetector.analyzeVesselBehavior(vessel.id, vessel.currentData, vessel.history)

        const riskScore = calculateRiskScore(anomalies)
        const status = determineStatus(riskScore, anomalies)

        return {
          vesselId: vessel.id,
          vesselName: vessel.name,
          riskScore,
          anomalies,
          lastAnalyzed: new Date().toISOString(),
          status,
        }
      })

      setVesselAnalyses(analyses)

      const processingTime = Date.now() - startTime
      const totalAnomalies = analyses.reduce((sum, analysis) => sum + analysis.anomalies.length, 0)

      setMetrics((prev) => ({
        totalAnalyzed: prev.totalAnalyzed + mockVessels.length,
        anomaliesDetected: prev.anomaliesDetected + totalAnomalies,
        falsePositiveRate: 0.12 + (Math.random() - 0.5) * 0.04,
        detectionAccuracy: 0.94 + (Math.random() - 0.5) * 0.06,
        processingTime,
      }))
    }, 10000) // Run every 10 seconds

    return () => clearInterval(interval)
  }, [isActive])

  const generateMockHistory = (): VesselHistoryPoint[] => {
    const history: VesselHistoryPoint[] = []
    const now = Date.now()

    for (let i = 10; i >= 0; i--) {
      history.push({
        timestamp: new Date(now - i * 5 * 60 * 1000).toISOString(), // 5-minute intervals
        latitude: 19.0 + (Math.random() - 0.5) * 0.1,
        longitude: 72.0 + (Math.random() - 0.5) * 0.1,
        speed: 10 + (Math.random() - 0.5) * 8,
        course: 45 + (Math.random() - 0.5) * 30,
        heading: 47 + (Math.random() - 0.5) * 20,
      })
    }

    return history
  }

  const calculateRiskScore = (anomalies: AnomalyResult[]): number => {
    if (anomalies.length === 0) return 0

    const severityWeights = { low: 1, medium: 2, high: 3, critical: 4 }
    const totalWeight = anomalies.reduce(
      (sum, anomaly) => sum + severityWeights[anomaly.severity] * anomaly.confidence,
      0,
    )

    return Math.min(100, (totalWeight / anomalies.length) * 25)
  }

  const determineStatus = (riskScore: number, anomalies: AnomalyResult[]): VesselAnalysis["status"] => {
    const hasCritical = anomalies.some((a) => a.severity === "critical")
    const hasHigh = anomalies.some((a) => a.severity === "high")

    if (hasCritical || riskScore > 80) return "critical"
    if (hasHigh || riskScore > 50) return "alert"
    if (riskScore > 20) return "monitoring"
    return "normal"
  }

  const getStatusColor = (status: VesselAnalysis["status"]) => {
    switch (status) {
      case "normal":
        return "bg-success text-success-foreground"
      case "monitoring":
        return "bg-warning text-warning-foreground"
      case "alert":
        return "bg-destructive text-destructive-foreground"
      case "critical":
        return "bg-destructive text-destructive-foreground animate-pulse"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getSeverityColor = (severity: AnomalyResult["severity"]) => {
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

  const criticalVessels = vesselAnalyses.filter((v) => v.status === "critical").length
  const alertVessels = vesselAnalyses.filter((v) => v.status === "alert").length
  const totalAnomalies = vesselAnalyses.reduce((sum, v) => sum + v.anomalies.length, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-xl font-semibold">Anomaly Detection System</h2>
            <p className="text-sm text-muted-foreground">AI-powered vessel behavior analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isActive ? "bg-success animate-pulse" : "bg-muted"}`} />
          <span className="text-sm text-muted-foreground mr-4">{isActive ? "Active" : "Paused"}</span>
          <Button variant={isActive ? "destructive" : "default"} size="sm" onClick={() => setIsActive(!isActive)}>
            {isActive ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {isActive ? "Pause" : "Resume"}
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {criticalVessels > 0 && (
        <Alert className="border-destructive bg-destructive/10">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertTitle className="text-destructive">Critical Anomalies Detected</AlertTitle>
          <AlertDescription>
            {criticalVessels} vessel{criticalVessels > 1 ? "s" : ""} showing critical behavior patterns requiring
            immediate investigation
          </AlertDescription>
        </Alert>
      )}

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Detection Accuracy</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(metrics.detectionAccuracy * 100).toFixed(1)}%</div>
            <Progress value={metrics.detectionAccuracy * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vessels Analyzed</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalAnalyzed}</div>
            <p className="text-xs text-muted-foreground">Total processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Anomalies</CardTitle>
            <Zap className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{totalAnomalies}</div>
            <p className="text-xs text-muted-foreground">Currently detected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing Time</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.processingTime}ms</div>
            <p className="text-xs text-muted-foreground">Average analysis time</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analysis Panel */}
      <Tabs defaultValue="vessels" className="space-y-4">
        <TabsList>
          <TabsTrigger value="vessels">Vessel Analysis</TabsTrigger>
          <TabsTrigger value="patterns">Pattern Recognition</TabsTrigger>
          <TabsTrigger value="settings">Detection Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="vessels" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vessel List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Vessel Risk Analysis
                </CardTitle>
                <CardDescription>Real-time behavioral analysis results</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {vesselAnalyses.map((analysis) => (
                  <div
                    key={analysis.vesselId}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-accent/50 ${
                      selectedAnalysis?.vesselId === analysis.vesselId ? "bg-accent" : ""
                    }`}
                    onClick={() => setSelectedAnalysis(analysis)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{analysis.vesselName}</h3>
                        <Badge className={getStatusColor(analysis.status)}>{analysis.status.toUpperCase()}</Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">Risk: {analysis.riskScore.toFixed(0)}%</div>
                        <Progress value={analysis.riskScore} className="w-16 h-2" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{analysis.anomalies.length} anomalies detected</span>
                      <span>{new Date(analysis.lastAnalyzed).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Analysis Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Anomaly Details
                </CardTitle>
                <CardDescription>
                  {selectedAnalysis
                    ? `Analysis for ${selectedAnalysis.vesselName}`
                    : "Select a vessel to view anomaly details"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedAnalysis ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Risk Score</label>
                        <div className="flex items-center gap-2">
                          <Progress value={selectedAnalysis.riskScore} className="flex-1" />
                          <span className="text-sm font-medium">{selectedAnalysis.riskScore.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Status</label>
                        <div>
                          <Badge className={getStatusColor(selectedAnalysis.status)}>
                            {selectedAnalysis.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">Detected Anomalies</label>
                      <div className="space-y-2">
                        {selectedAnalysis.anomalies.length > 0 ? (
                          selectedAnalysis.anomalies.map((anomaly, index) => (
                            <div key={index} className="p-3 rounded-lg border">
                              <div className="flex items-center justify-between mb-1">
                                <Badge className={getSeverityColor(anomaly.severity)}>
                                  {anomaly.severity.toUpperCase()}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {(anomaly.confidence * 100).toFixed(0)}% confidence
                                </span>
                              </div>
                              <p className="text-sm">{anomaly.description}</p>
                              <div className="text-xs text-muted-foreground mt-1">
                                Type: {anomaly.type.replace("_", " ")}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4 text-muted-foreground">
                            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No anomalies detected</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a vessel from the list to view detailed anomaly analysis</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pattern Recognition</CardTitle>
              <CardDescription>Advanced behavioral pattern analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Pattern Analysis Engine</h3>
                <p className="text-muted-foreground mb-4">
                  Advanced machine learning algorithms for detecting complex behavioral patterns
                </p>
                <Button variant="outline">Configure Pattern Detection</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Detection Parameters
              </CardTitle>
              <CardDescription>Configure anomaly detection thresholds and sensitivity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Speed Anomaly Threshold</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={75} className="flex-1" />
                    <span className="text-sm">25 knots</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Course Change Sensitivity</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={60} className="flex-1" />
                    <span className="text-sm">45°</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Stop Detection Time</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={50} className="flex-1" />
                    <span className="text-sm">30 min</span>
                  </div>
                </div>
                <Button className="w-full">Update Detection Parameters</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
