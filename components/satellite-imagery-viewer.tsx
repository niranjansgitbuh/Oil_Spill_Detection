"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Satellite,
  Download,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Layers,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Clock,
  Camera,
  Crosshair,
  Filter,
  Settings,
} from "lucide-react"

interface SatelliteImage {
  id: string
  timestamp: string
  location: { lat: number; lng: number }
  resolution: number // meters per pixel
  cloudCover: number // percentage
  source: "Sentinel-1" | "Sentinel-2" | "Landsat-8" | "MODIS" | "WorldView"
  bands: string[]
  oilSpillDetected: boolean
  confidence: number
  spillArea?: number // square kilometers
  imageUrl: string
  thumbnailUrl: string
}

interface AnalysisResult {
  id: string
  imageId: string
  algorithm: "SAR" | "Optical" | "Thermal" | "Multispectral"
  oilSpillDetected: boolean
  confidence: number
  spillPolygons: Array<{ lat: number; lng: number }[]>
  spillArea: number
  thickness: "thin" | "medium" | "thick"
  weatherConditions: {
    windSpeed: number
    waveHeight: number
    temperature: number
  }
  timestamp: string
}

interface ViewerSettings {
  showOilSpills: boolean
  showVessels: boolean
  showWeatherOverlay: boolean
  contrastLevel: number
  brightnessLevel: number
  selectedBands: string[]
  analysisMode: "automatic" | "manual" | "hybrid"
}

export function SatelliteImageryViewer() {
  const [images, setImages] = useState<SatelliteImage[]>([])
  const [selectedImage, setSelectedImage] = useState<SatelliteImage | null>(null)
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [viewerSettings, setViewerSettings] = useState<ViewerSettings>({
    showOilSpills: true,
    showVessels: true,
    showWeatherOverlay: false,
    contrastLevel: 50,
    brightnessLevel: 50,
    selectedBands: ["RGB"],
    analysisMode: "automatic",
  })
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null)

  // Mock satellite imagery data
  useEffect(() => {
    const generateMockImages = (): SatelliteImage[] => [
      {
        id: "sat001",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        location: { lat: 28.5383, lng: -94.0377 }, // Gulf of Mexico
        resolution: 10,
        cloudCover: 15,
        source: "Sentinel-1",
        bands: ["VV", "VH"],
        oilSpillDetected: true,
        confidence: 0.92,
        spillArea: 2.3,
        imageUrl: "/satellite-radar-image-oil-spill-dark-patches-ocean.jpg",
        thumbnailUrl: "/satellite-thumbnail-oil-spill.jpg",
      },
      {
        id: "sat002",
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        location: { lat: 19.1, lng: 72.9 }, // Mumbai coast
        resolution: 30,
        cloudCover: 35,
        source: "Landsat-8",
        bands: ["RGB", "NIR", "SWIR"],
        oilSpillDetected: false,
        confidence: 0.15,
        imageUrl: "/satellite-optical-image-clear-ocean-water.jpg",
        thumbnailUrl: "/satellite-thumbnail-clear-water.jpg",
      },
      {
        id: "sat003",
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        location: { lat: 28.5383, lng: -94.0377 }, // Gulf of Mexico
        resolution: 5,
        cloudCover: 8,
        source: "WorldView",
        bands: ["RGB", "NIR"],
        oilSpillDetected: true,
        confidence: 0.87,
        spillArea: 1.8,
        imageUrl: "/high-resolution-satellite-image-oil-spill-visible-.jpg",
        thumbnailUrl: "/high-res-satellite-thumbnail-oil-spill.jpg",
      },
    ]

    const generateMockAnalysis = (): AnalysisResult[] => [
      {
        id: "analysis001",
        imageId: "sat001",
        algorithm: "SAR",
        oilSpillDetected: true,
        confidence: 0.92,
        spillPolygons: [
          [
            { lat: 28.5383, lng: -94.0377 },
            { lat: 28.54, lng: -94.035 },
            { lat: 28.542, lng: -94.038 },
            { lat: 28.54, lng: -94.04 },
          ],
        ],
        spillArea: 2.3,
        thickness: "medium",
        weatherConditions: {
          windSpeed: 12,
          waveHeight: 1.5,
          temperature: 24,
        },
        timestamp: new Date().toISOString(),
      },
    ]

    setImages(generateMockImages())
    setAnalysisResults(generateMockAnalysis())
    setSelectedImage(generateMockImages()[0])
  }, [])

  const handleImageAnalysis = async (imageId: string) => {
    setIsLoading(true)

    // Simulate analysis processing
    await new Promise((resolve) => setTimeout(resolve, 3000))

    const newAnalysis: AnalysisResult = {
      id: `analysis_${Date.now()}`,
      imageId,
      algorithm: "SAR",
      oilSpillDetected: Math.random() > 0.3,
      confidence: 0.7 + Math.random() * 0.3,
      spillPolygons: [],
      spillArea: Math.random() * 5,
      thickness: ["thin", "medium", "thick"][Math.floor(Math.random() * 3)] as "thin" | "medium" | "thick",
      weatherConditions: {
        windSpeed: 5 + Math.random() * 20,
        waveHeight: 0.5 + Math.random() * 3,
        temperature: 15 + Math.random() * 20,
      },
      timestamp: new Date().toISOString(),
    }

    setAnalysisResults((prev) => [...prev, newAnalysis])
    setIsLoading(false)
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-success"
    if (confidence >= 0.6) return "text-warning"
    return "text-destructive"
  }

  const getSpillStatusBadge = (detected: boolean, confidence: number) => {
    if (detected && confidence > 0.7) {
      return <Badge className="bg-destructive text-destructive-foreground">Oil Spill Detected</Badge>
    } else if (detected && confidence > 0.4) {
      return <Badge className="bg-warning text-warning-foreground">Possible Spill</Badge>
    } else {
      return <Badge className="bg-success text-success-foreground">Clear</Badge>
    }
  }

  const detectedSpills = images.filter((img) => img.oilSpillDetected && img.confidence > 0.7).length
  const totalImages = images.length
  const averageConfidence = images.reduce((sum, img) => sum + img.confidence, 0) / images.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Satellite className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-xl font-semibold">Satellite Imagery Analysis</h2>
            <p className="text-sm text-muted-foreground">Real-time oil spill detection from space</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleImageAnalysis(selectedImage?.id || "")}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Analysis
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Detection Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Images Analyzed</CardTitle>
            <Camera className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalImages}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Spills Detected</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{detectedSpills}</div>
            <p className="text-xs text-muted-foreground">High confidence detections</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Confidence</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getConfidenceColor(averageConfidence)}`}>
              {(averageConfidence * 100).toFixed(0)}%
            </div>
            <Progress value={averageConfidence * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing Status</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{isLoading ? "Processing..." : "Ready"}</div>
            <p className="text-xs text-muted-foreground">System operational</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Viewer */}
      <Tabs defaultValue="viewer" className="space-y-4">
        <TabsList>
          <TabsTrigger value="viewer">Image Viewer</TabsTrigger>
          <TabsTrigger value="analysis">Analysis Results</TabsTrigger>
          <TabsTrigger value="settings">Viewer Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="viewer" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Image List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Available Images
                </CardTitle>
                <CardDescription>Recent satellite imagery captures</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent/50 ${
                      selectedImage?.id === image.id ? "bg-accent" : ""
                    }`}
                    onClick={() => setSelectedImage(image)}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={image.thumbnailUrl || "/placeholder.svg"}
                        alt="Satellite thumbnail"
                        className="w-16 h-12 object-cover rounded"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{image.source}</span>
                          {getSpillStatusBadge(image.oilSpillDetected, image.confidence)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <div>{new Date(image.timestamp).toLocaleString()}</div>
                          <div>
                            Resolution: {image.resolution}m | Cloud: {image.cloudCover}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Main Image Viewer */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Satellite Image Viewer
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Crosshair className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  {selectedImage
                    ? `${selectedImage.source} - ${new Date(selectedImage.timestamp).toLocaleString()}`
                    : "Select an image to view"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedImage ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <img
                        src={selectedImage.imageUrl || "/placeholder.svg"}
                        alt="Satellite imagery"
                        className="w-full h-96 object-cover rounded-lg border"
                        style={{
                          filter: `contrast(${viewerSettings.contrastLevel}%) brightness(${viewerSettings.brightnessLevel}%)`,
                        }}
                      />
                      {selectedImage.oilSpillDetected && (
                        <div className="absolute top-4 left-4">
                          <Alert className="w-auto border-destructive bg-destructive/10">
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                            <AlertDescription className="text-destructive">
                              Oil spill detected with {(selectedImage.confidence * 100).toFixed(0)}% confidence
                            </AlertDescription>
                          </Alert>
                        </div>
                      )}
                    </div>

                    {/* Image Controls */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Contrast</label>
                        <Slider
                          value={[viewerSettings.contrastLevel]}
                          onValueChange={(value) => setViewerSettings((prev) => ({ ...prev, contrastLevel: value[0] }))}
                          max={200}
                          min={0}
                          step={10}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Brightness</label>
                        <Slider
                          value={[viewerSettings.brightnessLevel]}
                          onValueChange={(value) =>
                            setViewerSettings((prev) => ({ ...prev, brightnessLevel: value[0] }))
                          }
                          max={200}
                          min={0}
                          step={10}
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Image Metadata */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="font-medium text-muted-foreground">Location</label>
                        <p>
                          {selectedImage.location.lat.toFixed(4)}, {selectedImage.location.lng.toFixed(4)}
                        </p>
                      </div>
                      <div>
                        <label className="font-medium text-muted-foreground">Resolution</label>
                        <p>{selectedImage.resolution}m per pixel</p>
                      </div>
                      <div>
                        <label className="font-medium text-muted-foreground">Cloud Cover</label>
                        <p>{selectedImage.cloudCover}%</p>
                      </div>
                      <div>
                        <label className="font-medium text-muted-foreground">Bands</label>
                        <p>{selectedImage.bands.join(", ")}</p>
                      </div>
                    </div>

                    {/* Analysis Button */}
                    <Button
                      className="w-full"
                      onClick={() => handleImageAnalysis(selectedImage.id)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Analyzing Image...
                        </>
                      ) : (
                        <>
                          <Satellite className="h-4 w-4 mr-2" />
                          Run Oil Spill Analysis
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Satellite className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No Image Selected</h3>
                    <p>Select a satellite image from the list to view and analyze</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Analysis Results
              </CardTitle>
              <CardDescription>Automated oil spill detection results</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysisResults.map((result) => {
                const image = images.find((img) => img.id === result.imageId)
                return (
                  <div key={result.id} className="p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{image?.source || "Unknown Source"}</h3>
                        {getSpillStatusBadge(result.oilSpillDetected, result.confidence)}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(result.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <label className="font-medium text-muted-foreground">Algorithm</label>
                        <p>{result.algorithm}</p>
                      </div>
                      <div>
                        <label className="font-medium text-muted-foreground">Confidence</label>
                        <p className={getConfidenceColor(result.confidence)}>{(result.confidence * 100).toFixed(0)}%</p>
                      </div>
                      <div>
                        <label className="font-medium text-muted-foreground">Spill Area</label>
                        <p>{result.spillArea.toFixed(2)} km²</p>
                      </div>
                      <div>
                        <label className="font-medium text-muted-foreground">Thickness</label>
                        <p className="capitalize">{result.thickness}</p>
                      </div>
                    </div>

                    {result.oilSpillDetected && (
                      <div className="mt-3 p-3 bg-destructive/10 rounded-lg">
                        <h4 className="font-medium text-destructive mb-2">Environmental Conditions</h4>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Wind Speed:</span>
                            <span className="ml-1">{result.weatherConditions.windSpeed.toFixed(1)} m/s</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Wave Height:</span>
                            <span className="ml-1">{result.weatherConditions.waveHeight.toFixed(1)} m</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Temperature:</span>
                            <span className="ml-1">{result.weatherConditions.temperature.toFixed(1)}°C</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Viewer Configuration
              </CardTitle>
              <CardDescription>Customize satellite imagery analysis settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Analysis Mode</label>
                  <Select
                    value={viewerSettings.analysisMode}
                    onValueChange={(value: "automatic" | "manual" | "hybrid") =>
                      setViewerSettings((prev) => ({ ...prev, analysisMode: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="automatic">Automatic Detection</SelectItem>
                      <SelectItem value="manual">Manual Analysis</SelectItem>
                      <SelectItem value="hybrid">Hybrid Mode</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium">Overlay Options</label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Show Oil Spill Overlays</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewerSettings((prev) => ({ ...prev, showOilSpills: !prev.showOilSpills }))}
                      >
                        {viewerSettings.showOilSpills ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Show Vessel Positions</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewerSettings((prev) => ({ ...prev, showVessels: !prev.showVessels }))}
                      >
                        {viewerSettings.showVessels ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Weather Overlay</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setViewerSettings((prev) => ({ ...prev, showWeatherOverlay: !prev.showWeatherOverlay }))
                        }
                      >
                        {viewerSettings.showWeatherOverlay ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <Button className="w-full">Save Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
