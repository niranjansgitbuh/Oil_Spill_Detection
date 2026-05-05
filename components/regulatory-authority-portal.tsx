"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Shield,
  FileText,
  Users,
  Phone,
  Mail,
  Download,
  Upload,
  AlertTriangle,
  Clock,
  MapPin,
  Gavel,
  Building,
  Truck,
  Plane,
  Ship,
  Radio,
  Camera,
  Database,
} from "lucide-react"

interface IncidentReport {
  id: string
  title: string
  severity: "low" | "medium" | "high" | "critical"
  status: "reported" | "investigating" | "responding" | "contained" | "resolved"
  location: { lat: number; lng: number; name: string }
  reportedAt: string
  reportedBy: string
  vesselInvolved?: string
  estimatedSize: number
  responseTeams: string[]
  description: string
  evidence: string[]
}

interface ResponseTeam {
  id: string
  name: string
  type: "coast_guard" | "cleanup_crew" | "environmental" | "medical" | "logistics"
  status: "available" | "deployed" | "standby"
  location: string
  contact: string
  equipment: string[]
  personnel: number
}

interface ComplianceRecord {
  id: string
  vesselId: string
  vesselName: string
  violationType: "spill" | "discharge" | "navigation" | "safety" | "documentation"
  severity: "minor" | "major" | "severe"
  fineAmount: number
  status: "pending" | "paid" | "disputed" | "waived"
  issuedAt: string
  dueDate: string
  description: string
}

export function RegulatoryAuthorityPortal() {
  const [incidents, setIncidents] = useState<IncidentReport[]>([])
  const [responseTeams, setResponseTeams] = useState<ResponseTeam[]>([])
  const [complianceRecords, setComplianceRecords] = useState<ComplianceRecord[]>([])
  const [selectedIncident, setSelectedIncident] = useState<IncidentReport | null>(null)
  const [newIncidentForm, setNewIncidentForm] = useState({
    title: "",
    severity: "medium" as const,
    location: "",
    description: "",
    vesselInvolved: "",
    estimatedSize: 0,
  })

  // Initialize mock data
  useEffect(() => {
    const mockIncidents: IncidentReport[] = [
      {
        id: "inc001",
        title: "Oil Spill - Gulf Guardian Tanker",
        severity: "critical",
        status: "responding",
        location: { lat: 28.5383, lng: -94.0377, name: "Gulf of Mexico, 15nm SE of Houston" },
        reportedAt: new Date(Date.now() - 3600000).toISOString(),
        reportedBy: "Satellite Detection System",
        vesselInvolved: "GULF GUARDIAN (IMO: 9345678)",
        estimatedSize: 2.5,
        responseTeams: ["CG-001", "ENV-002", "CLN-003"],
        description:
          "Major oil spill detected via satellite imagery. Vessel appears to be listing. Immediate response required.",
        evidence: ["satellite_image_001.jpg", "ais_data_export.csv", "weather_report.pdf"],
      },
      {
        id: "inc002",
        title: "Suspicious Discharge - Marine Explorer",
        severity: "medium",
        status: "investigating",
        location: { lat: 19.1, lng: 72.9, name: "Mumbai Coast, 8nm W of Port" },
        reportedAt: new Date(Date.now() - 7200000).toISOString(),
        reportedBy: "Port Authority Mumbai",
        vesselInvolved: "MARINE EXPLORER (IMO: 9234567)",
        estimatedSize: 0.3,
        responseTeams: ["CG-002"],
        description: "Vessel reported unusual discharge. Investigation team dispatched.",
        evidence: ["port_report.pdf", "vessel_inspection.jpg"],
      },
    ]

    const mockResponseTeams: ResponseTeam[] = [
      {
        id: "CG-001",
        name: "Coast Guard Response Unit Alpha",
        type: "coast_guard",
        status: "deployed",
        location: "Gulf of Mexico",
        contact: "+1-555-0101",
        equipment: ["Response Vessel", "Containment Booms", "Skimmers"],
        personnel: 12,
      },
      {
        id: "ENV-002",
        name: "Environmental Assessment Team",
        type: "environmental",
        status: "deployed",
        location: "Houston Base",
        contact: "+1-555-0102",
        equipment: ["Water Testing Kit", "Wildlife Rescue Equipment", "Sampling Drones"],
        personnel: 8,
      },
      {
        id: "CLN-003",
        name: "Marine Cleanup Specialists",
        type: "cleanup_crew",
        status: "deployed",
        location: "Mobile Response Unit",
        contact: "+1-555-0103",
        equipment: ["Cleanup Vessels", "Absorbent Materials", "Dispersants"],
        personnel: 25,
      },
      {
        id: "CG-002",
        name: "Coast Guard Mumbai Division",
        type: "coast_guard",
        status: "available",
        location: "Mumbai Port",
        contact: "+91-22-555-0201",
        equipment: ["Patrol Boats", "Inspection Equipment", "Communication Systems"],
        personnel: 15,
      },
    ]

    const mockComplianceRecords: ComplianceRecord[] = [
      {
        id: "comp001",
        vesselId: "v003",
        vesselName: "GULF GUARDIAN",
        violationType: "spill",
        severity: "severe",
        fineAmount: 500000,
        status: "pending",
        issuedAt: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        description: "Major oil spill incident causing environmental damage",
      },
      {
        id: "comp002",
        vesselId: "v002",
        vesselName: "MARINE EXPLORER",
        violationType: "discharge",
        severity: "minor",
        fineAmount: 25000,
        status: "disputed",
        issuedAt: new Date(Date.now() - 86400000).toISOString(),
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        description: "Unauthorized discharge in restricted waters",
      },
    ]

    setIncidents(mockIncidents)
    setResponseTeams(mockResponseTeams)
    setComplianceRecords(mockComplianceRecords)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "reported":
        return "bg-blue-500"
      case "investigating":
        return "bg-yellow-500"
      case "responding":
        return "bg-orange-500"
      case "contained":
        return "bg-green-500"
      case "resolved":
        return "bg-gray-500"
      case "available":
        return "bg-green-500"
      case "deployed":
        return "bg-red-500"
      case "standby":
        return "bg-yellow-500"
      case "pending":
        return "bg-yellow-500"
      case "paid":
        return "bg-green-500"
      case "disputed":
        return "bg-orange-500"
      case "waived":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low":
      case "minor":
        return "bg-green-500"
      case "medium":
        return "bg-yellow-500"
      case "high":
      case "major":
        return "bg-orange-500"
      case "critical":
      case "severe":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getTeamIcon = (type: ResponseTeam["type"]) => {
    switch (type) {
      case "coast_guard":
        return <Shield className="h-4 w-4" />
      case "cleanup_crew":
        return <Truck className="h-4 w-4" />
      case "environmental":
        return <Camera className="h-4 w-4" />
      case "medical":
        return <Users className="h-4 w-4" />
      case "logistics":
        return <Building className="h-4 w-4" />
      default:
        return <Users className="h-4 w-4" />
    }
  }

  const handleCreateIncident = () => {
    const newIncident: IncidentReport = {
      id: `inc${String(incidents.length + 1).padStart(3, "0")}`,
      title: newIncidentForm.title,
      severity: newIncidentForm.severity,
      status: "reported",
      location: { lat: 0, lng: 0, name: newIncidentForm.location },
      reportedAt: new Date().toISOString(),
      reportedBy: "Manual Entry",
      vesselInvolved: newIncidentForm.vesselInvolved || undefined,
      estimatedSize: newIncidentForm.estimatedSize,
      responseTeams: [],
      description: newIncidentForm.description,
      evidence: [],
    }

    setIncidents((prev) => [newIncident, ...prev])
    setNewIncidentForm({
      title: "",
      severity: "medium",
      location: "",
      description: "",
      vesselInvolved: "",
      estimatedSize: 0,
    })
  }

  const activeIncidents = incidents.filter((i) => !["resolved", "contained"].includes(i.status)).length
  const deployedTeams = responseTeams.filter((t) => t.status === "deployed").length
  const pendingFines = complianceRecords.filter((c) => c.status === "pending").length
  const totalFinesAmount = complianceRecords
    .filter((c) => c.status === "pending")
    .reduce((sum, c) => sum + c.fineAmount, 0)

  return (
    <div className="space-y-6">
      {/* Authority Header */}
      <Card className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Gavel className="h-8 w-8" />
              <div>
                <CardTitle className="text-2xl">Regulatory Authority Portal</CardTitle>
                <CardDescription className="text-blue-100">
                  Maritime Environmental Protection & Compliance Division
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm opacity-90">Emergency Hotline</div>
              <div className="text-xl font-bold">1-800-OIL-SPILL</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{activeIncidents}</div>
            <p className="text-xs text-muted-foreground">Requiring attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deployed Teams</CardTitle>
            <Users className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{deployedTeams}</div>
            <p className="text-xs text-muted-foreground">Currently responding</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Fines</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingFines}</div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fines</CardTitle>
            <Database className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">${totalFinesAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Pending collection</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Portal Tabs */}
      <Tabs defaultValue="incidents" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="incidents">Incident Management</TabsTrigger>
          <TabsTrigger value="response">Response Coordination</TabsTrigger>
          <TabsTrigger value="compliance">Compliance & Fines</TabsTrigger>
          <TabsTrigger value="reports">Official Reports</TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
        </TabsList>

        <TabsContent value="incidents" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Incident List */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Active Incidents
                    </CardTitle>
                    <Button size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Import Data
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {incidents.map((incident) => (
                    <div
                      key={incident.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-accent/50 ${
                        selectedIncident?.id === incident.id ? "bg-accent" : ""
                      }`}
                      onClick={() => setSelectedIncident(incident)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{incident.title}</h3>
                        <div className="flex gap-2">
                          <Badge className={`${getSeverityColor(incident.severity)} text-white`}>
                            {incident.severity.toUpperCase()}
                          </Badge>
                          <Badge className={`${getStatusColor(incident.status)} text-white`}>
                            {incident.status.replace("_", " ").toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {incident.location.name}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(incident.reportedAt).toLocaleString()}
                        </div>
                      </div>
                      {incident.vesselInvolved && (
                        <div className="mt-2 text-sm">
                          <span className="text-muted-foreground">Vessel:</span> {incident.vesselInvolved}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Incident Details / New Incident Form */}
            <div className="space-y-4">
              {selectedIncident ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Incident Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">{selectedIncident.title}</h4>
                      <div className="flex gap-2 mb-3">
                        <Badge className={`${getSeverityColor(selectedIncident.severity)} text-white`}>
                          {selectedIncident.severity.toUpperCase()}
                        </Badge>
                        <Badge className={`${getStatusColor(selectedIncident.status)} text-white`}>
                          {selectedIncident.status.replace("_", " ").toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="font-medium">Location:</span>
                        <br />
                        {selectedIncident.location.name}
                      </div>
                      <div>
                        <span className="font-medium">Reported:</span>
                        <br />
                        {new Date(selectedIncident.reportedAt).toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">Reported By:</span>
                        <br />
                        {selectedIncident.reportedBy}
                      </div>
                      {selectedIncident.vesselInvolved && (
                        <div>
                          <span className="font-medium">Vessel:</span>
                          <br />
                          {selectedIncident.vesselInvolved}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Estimated Size:</span>
                        <br />
                        {selectedIncident.estimatedSize} km²
                      </div>
                      <div>
                        <span className="font-medium">Description:</span>
                        <br />
                        {selectedIncident.description}
                      </div>
                      <div>
                        <span className="font-medium">Response Teams:</span>
                        <br />
                        {selectedIncident.responseTeams.length > 0
                          ? selectedIncident.responseTeams.join(", ")
                          : "None assigned"}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button className="w-full" size="sm">
                        <Users className="h-4 w-4 mr-2" />
                        Assign Response Team
                      </Button>
                      <Button className="w-full bg-transparent" variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Generate Report
                      </Button>
                      <Button className="w-full bg-transparent" variant="outline" size="sm">
                        <Radio className="h-4 w-4 mr-2" />
                        Issue Public Notice
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Create New Incident</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="title">Incident Title</Label>
                      <Input
                        id="title"
                        value={newIncidentForm.title}
                        onChange={(e) => setNewIncidentForm((prev) => ({ ...prev, title: e.target.value }))}
                        placeholder="Brief description of incident"
                      />
                    </div>

                    <div>
                      <Label htmlFor="severity">Severity Level</Label>
                      <Select
                        value={newIncidentForm.severity}
                        onValueChange={(value: any) => setNewIncidentForm((prev) => ({ ...prev, severity: value }))}
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
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={newIncidentForm.location}
                        onChange={(e) => setNewIncidentForm((prev) => ({ ...prev, location: e.target.value }))}
                        placeholder="Geographic location description"
                      />
                    </div>

                    <div>
                      <Label htmlFor="vessel">Vessel Involved (Optional)</Label>
                      <Input
                        id="vessel"
                        value={newIncidentForm.vesselInvolved}
                        onChange={(e) => setNewIncidentForm((prev) => ({ ...prev, vesselInvolved: e.target.value }))}
                        placeholder="Vessel name and IMO number"
                      />
                    </div>

                    <div>
                      <Label htmlFor="size">Estimated Size (km²)</Label>
                      <Input
                        id="size"
                        type="number"
                        value={newIncidentForm.estimatedSize}
                        onChange={(e) =>
                          setNewIncidentForm((prev) => ({
                            ...prev,
                            estimatedSize: Number.parseFloat(e.target.value) || 0,
                          }))
                        }
                        placeholder="0.0"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newIncidentForm.description}
                        onChange={(e) => setNewIncidentForm((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="Detailed description of the incident"
                        rows={3}
                      />
                    </div>

                    <Button
                      className="w-full"
                      onClick={handleCreateIncident}
                      disabled={!newIncidentForm.title || !newIncidentForm.location}
                    >
                      Create Incident Report
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="response" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Response Team Coordination
              </CardTitle>
              <CardDescription>Manage and deploy emergency response teams</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {responseTeams.map((team) => (
                  <Card key={team.id} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getTeamIcon(team.type)}
                          <CardTitle className="text-base">{team.name}</CardTitle>
                        </div>
                        <Badge className={`${getStatusColor(team.status)} text-white`}>
                          {team.status.toUpperCase()}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-sm space-y-1">
                        <div>
                          <span className="font-medium">Location:</span> {team.location}
                        </div>
                        <div>
                          <span className="font-medium">Personnel:</span> {team.personnel}
                        </div>
                        <div>
                          <span className="font-medium">Contact:</span> {team.contact}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-sm">Equipment:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {team.equipment.map((item, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1">
                          <Phone className="h-3 w-3 mr-1" />
                          Contact
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                          <MapPin className="h-3 w-3 mr-1" />
                          Deploy
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gavel className="h-5 w-5" />
                Compliance & Enforcement
              </CardTitle>
              <CardDescription>Manage violations, fines, and regulatory compliance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {complianceRecords.map((record) => (
                  <div key={record.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{record.vesselName}</h3>
                        <p className="text-sm text-muted-foreground">Vessel ID: {record.vesselId}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">${record.fineAmount.toLocaleString()}</div>
                        <Badge className={`${getStatusColor(record.status)} text-white`}>
                          {record.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Violation Type:</span>
                        <br />
                        <Badge className={`${getSeverityColor(record.severity)} text-white mt-1`}>
                          {record.violationType.replace("_", " ").toUpperCase()}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">Issued:</span>
                        <br />
                        {new Date(record.issuedAt).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Due Date:</span>
                        <br />
                        {new Date(record.dueDate).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="mt-3">
                      <span className="font-medium text-sm">Description:</span>
                      <p className="text-sm text-muted-foreground mt-1">{record.description}</p>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline">
                        <FileText className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                      <Button size="sm" variant="outline">
                        <Mail className="h-3 w-3 mr-1" />
                        Send Notice
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-3 w-3 mr-1" />
                        Export
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Official Reports & Documentation
              </CardTitle>
              <CardDescription>Generate and manage regulatory reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="border-dashed">
                  <CardContent className="p-6 text-center">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">Incident Report</h3>
                    <p className="text-sm text-muted-foreground mb-4">Generate comprehensive incident documentation</p>
                    <Button size="sm" className="w-full">
                      Generate Report
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-dashed">
                  <CardContent className="p-6 text-center">
                    <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">Compliance Summary</h3>
                    <p className="text-sm text-muted-foreground mb-4">Monthly compliance and enforcement summary</p>
                    <Button size="sm" className="w-full">
                      Generate Report
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-dashed">
                  <CardContent className="p-6 text-center">
                    <Ship className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">Vessel Inspection</h3>
                    <p className="text-sm text-muted-foreground mb-4">Detailed vessel inspection and safety report</p>
                    <Button size="sm" className="w-full">
                      Generate Report
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Radio className="h-5 w-5" />
                Emergency Communications
              </CardTitle>
              <CardDescription>Coordinate with response teams and public notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Emergency Contacts</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-red-600" />
                        <span className="font-medium">Coast Guard Command</span>
                      </div>
                      <span className="font-mono">1-800-424-8802</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Plane className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">Air Support</span>
                      </div>
                      <span className="font-mono">1-800-AIR-HELP</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-green-600" />
                        <span className="font-medium">EPA Response</span>
                      </div>
                      <span className="font-mono">1-800-424-9346</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Public Notifications</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full justify-start">
                      <Radio className="h-4 w-4 mr-2" />
                      Issue Marine Safety Broadcast
                    </Button>
                    <Button className="w-full justify-start bg-transparent" variant="outline">
                      <Mail className="h-4 w-4 mr-2" />
                      Send Press Release
                    </Button>
                    <Button className="w-full justify-start bg-transparent" variant="outline">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Activate Emergency Alert System
                    </Button>
                    <Button className="w-full justify-start bg-transparent" variant="outline">
                      <Users className="h-4 w-4 mr-2" />
                      Notify Stakeholders
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
