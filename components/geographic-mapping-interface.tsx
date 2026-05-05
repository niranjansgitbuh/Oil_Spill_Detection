"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { MapPin, AlertTriangle, Satellite, Layers, ZoomIn, ZoomOut, RotateCcw, Download, Share } from "lucide-react"

interface VesselMarker {
  id: string
  name: string
  position: { lat: number; lng: number }
  status: "normal" | "anomaly" | "distress" | "spill_detected"
  vesselType: string
  speed: number
  course: number
  lastUpdate: string
}

interface SpillMarker {
  id: string
  position: { lat: number; lng: number }
  severity: "low" | "medium" | "high" | "critical"
  size: number // in square kilometers
  confidence: number
  detectedAt: string
  source: "satellite" | "vessel_report" | "aerial_survey"
}

interface MapLayer {
  id: string
  name: string
  type: "vessels" | "spills" | "weather" | "traffic" | "boundaries"
  visible: boolean
  opacity: number
}

export function GeographicMappingInterface() {
  const mapRef = useRef<HTMLDivElement>(null)
  const [vessels, setVessels] = useState<VesselMarker[]>([])
  const [spills, setSpills] = useState<SpillMarker[]>([])
  const [selectedRegion, setSelectedRegion] = useState("mumbai")
  const [mapLayers, setMapLayers] = useState<MapLayer[]>([
    { id: "vessels", name: "Vessel Positions", type: "vessels", visible: true, opacity: 100 },
    { id: "spills", name: "Oil Spills", type: "spills", visible: true, opacity: 90 },
    { id: "weather", name: "Weather Data", type: "weather", visible: false, opacity: 70 },
    { id: "traffic", name: "Shipping Lanes", type: "traffic", visible: true, opacity: 60 },
    { id: "boundaries", name: "Maritime Boundaries", type: "boundaries", visible: false, opacity: 50 },
  ])
  const [zoomLevel, setZoomLevel] = useState(10)
  const [mapCenter, setMapCenter] = useState({ lat: 19.076, lng: 72.8777 })
  const [selectedVessel, setSelectedVessel] = useState<VesselMarker | null>(null)
  const [selectedSpill, setSelectedSpill] = useState<SpillMarker | null>(null)

  // Initialize mock data
  useEffect(() => {
    const mockVessels: VesselMarker[] = [
      {
        id: "v001",
        name: "OCEAN NAVIGATOR",
        position: { lat: 19.076, lng: 72.8777 },
        status: "normal",
        vesselType: "Cargo Ship",
        speed: 12.5,
        course: 45,
        lastUpdate: new Date().toISOString(),
      },
      {
        id: "v002",
        name: "MARINE EXPLORER",
        position: { lat: 19.1, lng: 72.9 },
        status: "anomaly",
        vesselType: "Tanker",
        speed: 0.2,
        course: 180,
        lastUpdate: new Date().toISOString(),
      },
      {
        id: "v003",
        name: "GULF GUARDIAN",
        position: { lat: 28.5383, lng: -94.0377 },
        status: "spill_detected",
        vesselType: "Oil Tanker",
        speed: 8.7,
        course: 270,
        lastUpdate: new Date().toISOString(),
      },
    ]

    const mockSpills: SpillMarker[] = [
      {
        id: "s001",
        position: { lat: 28.5383, lng: -94.0377 },
        severity: "critical",
        size: 2.5,
        confidence: 95,
        detectedAt: new Date(Date.now() - 600000).toISOString(),
        source: "satellite",
      },
      {
        id: "s002",
        position: { lat: 19.1, lng: 72.9 },
        severity: "medium",
        size: 0.8,
        confidence: 78,
        detectedAt: new Date(Date.now() - 1200000).toISOString(),
        source: "vessel_report",
      },
    ]

    setVessels(mockVessels)
    setSpills(mockSpills)
  }, [])

  // Update map center based on selected region
  useEffect(() => {
    const regions = {
      mumbai: { lat: 19.076, lng: 72.8777 },
      gulf_mexico: { lat: 28.5383, lng: -94.0377 },
      global: { lat: 20, lng: 0 },
    }
    setMapCenter(regions[selectedRegion as keyof typeof regions] || regions.mumbai)
  }, [selectedRegion])

  const getVesselStatusColor = (status: VesselMarker["status"]) => {
    switch (status) {
      case "normal":
        return "#22c55e"
      case "anomaly":
        return "#f59e0b"
      case "distress":
        return "#ef4444"
      case "spill_detected":
        return "#dc2626"
      default:
        return "#6b7280"
    }
  }

  const getSpillSeverityColor = (severity: SpillMarker["severity"]) => {
    switch (severity) {
      case "low":
        return "#fbbf24"
      case "medium":
        return "#f59e0b"
      case "high":
        return "#ef4444"
      case "critical":
        return "#dc2626"
      default:
        return "#6b7280"
    }
  }

  const toggleLayer = (layerId: string) => {
    setMapLayers((prev) => prev.map((layer) => (layer.id === layerId ? { ...layer, visible: !layer.visible } : layer)))
  }

  const updateLayerOpacity = (layerId: string, opacity: number) => {
    setMapLayers((prev) => prev.map((layer) => (layer.id === layerId ? { ...layer, opacity } : layer)))
  }

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 1, 18))
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 1, 2))
  const handleResetView = () => {
    setZoomLevel(10)
    setMapCenter(selectedRegion === "mumbai" ? { lat: 19.076, lng: 72.8777 } : { lat: 28.5383, lng: -94.0377 })
  }

  return (
    <div className="space-y-6">
      {/* Map Controls Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Geographic Mapping Interface
              </CardTitle>
              <CardDescription>Real-time visualization of vessels, oil spills, and environmental data</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Region:</label>
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mumbai">Mumbai Coast</SelectItem>
                  <SelectItem value="gulf_mexico">Gulf of Mexico</SelectItem>
                  <SelectItem value="global">Global View</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Zoom:</label>
              <Button variant="outline" size="sm" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm font-mono w-8 text-center">{zoomLevel}</span>
              <Button variant="outline" size="sm" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleResetView}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map Display */}
        <div className="lg:col-span-3">
          <Card className="h-[600px]">
            <CardContent className="p-0 h-full">
              <div
                ref={mapRef}
                className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 relative overflow-hidden rounded-lg"
              >
                {/* Simulated Map Background */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(59,130,246,0.05)_25%,transparent_25%,transparent_75%,rgba(59,130,246,0.05)_75%)] bg-[length:20px_20px]" />
                </div>

                {/* Vessel Markers */}
                {mapLayers.find((l) => l.id === "vessels")?.visible &&
                  vessels.map((vessel) => (
                    <div
                      key={vessel.id}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                      style={{
                        left: `${(vessel.position.lng - mapCenter.lng) * 50 + 50}%`,
                        top: `${-(vessel.position.lat - mapCenter.lat) * 50 + 50}%`,
                      }}
                      onClick={() => setSelectedVessel(vessel)}
                    >
                      <div
                        className="w-4 h-4 rounded-full border-2 border-white shadow-lg transition-all group-hover:scale-125"
                        style={{ backgroundColor: getVesselStatusColor(vessel.status) }}
                      />
                      <div className="absolute top-5 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {vessel.name}
                      </div>
                    </div>
                  ))}

                {/* Oil Spill Markers */}
                {mapLayers.find((l) => l.id === "spills")?.visible &&
                  spills.map((spill) => (
                    <div
                      key={spill.id}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                      style={{
                        left: `${(spill.position.lng - mapCenter.lng) * 50 + 50}%`,
                        top: `${-(spill.position.lat - mapCenter.lat) * 50 + 50}%`,
                      }}
                      onClick={() => setSelectedSpill(spill)}
                    >
                      <div
                        className="w-6 h-6 rounded-full border-2 border-white shadow-lg animate-pulse"
                        style={{
                          backgroundColor: getSpillSeverityColor(spill.severity),
                          opacity: spill.confidence / 100,
                        }}
                      />
                      <div className="absolute top-7 left-1/2 transform -translate-x-1/2 bg-red-900/90 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Oil Spill - {spill.severity.toUpperCase()}
                      </div>
                    </div>
                  ))}

                {/* Shipping Lanes */}
                {mapLayers.find((l) => l.id === "traffic")?.visible && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <defs>
                      <pattern id="shipping-lane" patternUnits="userSpaceOnUse" width="10" height="10">
                        <path d="M0,5 L10,5" stroke="rgba(59,130,246,0.3)" strokeWidth="1" strokeDasharray="2,2" />
                      </pattern>
                    </defs>
                    <path
                      d="M100,200 Q300,150 500,200 T900,250"
                      fill="none"
                      stroke="url(#shipping-lane)"
                      strokeWidth="20"
                      opacity={mapLayers.find((l) => l.id === "traffic")?.opacity! / 100}
                    />
                  </svg>
                )}

                {/* Map Legend */}
                <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-gray-900/90 p-3 rounded-lg shadow-lg">
                  <h4 className="text-sm font-semibold mb-2">Legend</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span>Normal Vessel</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <span>Anomaly Detected</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span>Oil Spill</span>
                    </div>
                  </div>
                </div>

                {/* Coordinates Display */}
                <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-900/90 p-2 rounded text-xs font-mono">
                  Center: {mapCenter.lat.toFixed(4)}, {mapCenter.lng.toFixed(4)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Control Panel */}
        <div className="space-y-6">
          {/* Layer Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Layers className="h-4 w-4" />
                Map Layers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mapLayers.map((layer) => (
                <div key={layer.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">{layer.name}</label>
                    <Switch checked={layer.visible} onCheckedChange={() => toggleLayer(layer.id)} />
                  </div>
                  {layer.visible && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Opacity:</span>
                      <Slider
                        value={[layer.opacity]}
                        onValueChange={([value]) => updateLayerOpacity(layer.id, value)}
                        max={100}
                        step={10}
                        className="flex-1"
                      />
                      <span className="text-xs text-muted-foreground w-8">{layer.opacity}%</span>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Selected Item Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {selectedVessel ? "Vessel Details" : selectedSpill ? "Spill Details" : "Selection Info"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedVessel ? (
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold">{selectedVessel.name}</h4>
                    <Badge
                      className={`mt-1 ${
                        selectedVessel.status === "normal"
                          ? "bg-success"
                          : selectedVessel.status === "anomaly"
                            ? "bg-warning"
                            : "bg-destructive"
                      }`}
                    >
                      {selectedVessel.status.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Type:</span> {selectedVessel.vesselType}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Position:</span>
                      <br />
                      <span className="font-mono text-xs">
                        {selectedVessel.position.lat.toFixed(6)}, {selectedVessel.position.lng.toFixed(6)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Speed:</span> {selectedVessel.speed} kts
                    </div>
                    <div>
                      <span className="text-muted-foreground">Course:</span> {selectedVessel.course}°
                    </div>
                  </div>
                  <Button size="sm" className="w-full">
                    <Satellite className="h-4 w-4 mr-2" />
                    Monitor with Satellite
                  </Button>
                </div>
              ) : selectedSpill ? (
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold">Oil Spill Detection</h4>
                    <Badge
                      className={`mt-1 ${
                        selectedSpill.severity === "critical"
                          ? "bg-destructive animate-pulse"
                          : selectedSpill.severity === "high"
                            ? "bg-destructive"
                            : selectedSpill.severity === "medium"
                              ? "bg-warning"
                              : "bg-muted"
                      }`}
                    >
                      {selectedSpill.severity.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Size:</span> {selectedSpill.size} km²
                    </div>
                    <div>
                      <span className="text-muted-foreground">Confidence:</span> {selectedSpill.confidence}%
                    </div>
                    <div>
                      <span className="text-muted-foreground">Source:</span> {selectedSpill.source.replace("_", " ")}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Detected:</span>
                      <br />
                      <span className="text-xs">{new Date(selectedSpill.detectedAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <Button size="sm" className="w-full" variant="destructive">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Alert Authorities
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Click on a vessel or spill marker to view details</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Map Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Vessels Tracked:</span>
                <span className="font-semibold">{vessels.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Active Spills:</span>
                <span className="font-semibold text-destructive">{spills.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Anomalies:</span>
                <span className="font-semibold text-warning">
                  {vessels.filter((v) => v.status !== "normal").length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Coverage Area:</span>
                <span className="font-semibold">{selectedRegion === "global" ? "Global" : "Regional"}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
