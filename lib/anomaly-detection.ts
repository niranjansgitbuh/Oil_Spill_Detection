export interface VesselHistoryPoint {
  timestamp: string
  latitude: number
  longitude: number
  speed: number
  course: number
  heading: number
}

export interface AnomalyResult {
  type: "speed_anomaly" | "course_change" | "stop_anomaly" | "erratic_movement" | "zone_violation"
  severity: "low" | "medium" | "high" | "critical"
  confidence: number
  description: string
  parameters: Record<string, number>
}

export class VesselAnomalyDetector {
  private static readonly SPEED_THRESHOLDS = {
    SUDDEN_STOP: 2.0, // knots
    EXCESSIVE_SPEED: 25.0, // knots for most vessels
    SPEED_CHANGE_RATE: 5.0, // knots per minute
  }

  private static readonly COURSE_THRESHOLDS = {
    SUDDEN_TURN: 45, // degrees
    ERRATIC_THRESHOLD: 30, // degrees variation
    ZIGZAG_PATTERN: 3, // number of direction changes
  }

  private static readonly TIME_WINDOWS = {
    SHORT_TERM: 5 * 60 * 1000, // 5 minutes
    MEDIUM_TERM: 15 * 60 * 1000, // 15 minutes
    LONG_TERM: 60 * 60 * 1000, // 1 hour
  }

  static analyzeVesselBehavior(
    vesselId: string,
    currentData: VesselHistoryPoint,
    history: VesselHistoryPoint[],
  ): AnomalyResult[] {
    const anomalies: AnomalyResult[] = []

    // Speed anomaly detection
    const speedAnomalies = this.detectSpeedAnomalies(currentData, history)
    anomalies.push(...speedAnomalies)

    // Course change detection
    const courseAnomalies = this.detectCourseAnomalies(currentData, history)
    anomalies.push(...courseAnomalies)

    // Stop anomaly detection
    const stopAnomalies = this.detectStopAnomalies(currentData, history)
    anomalies.push(...stopAnomalies)

    // Erratic movement detection
    const movementAnomalies = this.detectErraticMovement(currentData, history)
    anomalies.push(...movementAnomalies)

    return anomalies
  }

  private static detectSpeedAnomalies(current: VesselHistoryPoint, history: VesselHistoryPoint[]): AnomalyResult[] {
    const anomalies: AnomalyResult[] = []

    if (history.length < 2) return anomalies

    const recentHistory = this.getRecentHistory(history, this.TIME_WINDOWS.SHORT_TERM)

    // Sudden stop detection
    if (current.speed < this.SPEED_THRESHOLDS.SUDDEN_STOP) {
      const avgPreviousSpeed = recentHistory.reduce((sum, point) => sum + point.speed, 0) / recentHistory.length

      if (avgPreviousSpeed > 5.0) {
        anomalies.push({
          type: "stop_anomaly",
          severity: avgPreviousSpeed > 15 ? "high" : "medium",
          confidence: Math.min(0.9, avgPreviousSpeed / 20),
          description: `Vessel suddenly stopped from ${avgPreviousSpeed.toFixed(1)} knots`,
          parameters: {
            previousSpeed: avgPreviousSpeed,
            currentSpeed: current.speed,
            speedDrop: avgPreviousSpeed - current.speed,
          },
        })
      }
    }

    // Excessive speed detection
    if (current.speed > this.SPEED_THRESHOLDS.EXCESSIVE_SPEED) {
      anomalies.push({
        type: "speed_anomaly",
        severity: current.speed > 35 ? "critical" : "high",
        confidence: Math.min(0.95, (current.speed - this.SPEED_THRESHOLDS.EXCESSIVE_SPEED) / 20),
        description: `Vessel exceeding safe speed limit at ${current.speed.toFixed(1)} knots`,
        parameters: {
          currentSpeed: current.speed,
          speedLimit: this.SPEED_THRESHOLDS.EXCESSIVE_SPEED,
          excess: current.speed - this.SPEED_THRESHOLDS.EXCESSIVE_SPEED,
        },
      })
    }

    // Rapid speed changes
    if (recentHistory.length > 0) {
      const lastPoint = recentHistory[recentHistory.length - 1]
      const timeDiff = (new Date(current.timestamp).getTime() - new Date(lastPoint.timestamp).getTime()) / (1000 * 60)
      const speedChange = Math.abs(current.speed - lastPoint.speed)
      const speedChangeRate = speedChange / Math.max(timeDiff, 0.1)

      if (speedChangeRate > this.SPEED_THRESHOLDS.SPEED_CHANGE_RATE) {
        anomalies.push({
          type: "speed_anomaly",
          severity: speedChangeRate > 10 ? "high" : "medium",
          confidence: Math.min(0.9, speedChangeRate / 15),
          description: `Rapid speed change: ${speedChangeRate.toFixed(1)} knots/min`,
          parameters: {
            speedChangeRate,
            speedChange,
            timeDiff,
          },
        })
      }
    }

    return anomalies
  }

  private static detectCourseAnomalies(current: VesselHistoryPoint, history: VesselHistoryPoint[]): AnomalyResult[] {
    const anomalies: AnomalyResult[] = []

    if (history.length < 2) return anomalies

    const recentHistory = this.getRecentHistory(history, this.TIME_WINDOWS.MEDIUM_TERM)

    // Sudden course change
    if (recentHistory.length > 0) {
      const lastPoint = recentHistory[recentHistory.length - 1]
      const courseChange = this.calculateCourseChange(lastPoint.course, current.course)

      if (Math.abs(courseChange) > this.COURSE_THRESHOLDS.SUDDEN_TURN) {
        anomalies.push({
          type: "course_change",
          severity: Math.abs(courseChange) > 90 ? "high" : "medium",
          confidence: Math.min(0.9, Math.abs(courseChange) / 180),
          description: `Sudden course change of ${Math.abs(courseChange).toFixed(1)}°`,
          parameters: {
            courseChange: Math.abs(courseChange),
            previousCourse: lastPoint.course,
            currentCourse: current.course,
          },
        })
      }
    }

    // Zigzag pattern detection
    if (recentHistory.length >= this.COURSE_THRESHOLDS.ZIGZAG_PATTERN) {
      const courseChanges = []
      for (let i = 1; i < recentHistory.length; i++) {
        const change = this.calculateCourseChange(recentHistory[i - 1].course, recentHistory[i].course)
        courseChanges.push(change)
      }

      const directionChanges = courseChanges.filter(
        (change, i) => i > 0 && Math.sign(change) !== Math.sign(courseChanges[i - 1]),
      ).length

      if (directionChanges >= this.COURSE_THRESHOLDS.ZIGZAG_PATTERN) {
        anomalies.push({
          type: "erratic_movement",
          severity: directionChanges > 5 ? "high" : "medium",
          confidence: Math.min(0.85, directionChanges / 8),
          description: `Erratic zigzag movement detected (${directionChanges} direction changes)`,
          parameters: {
            directionChanges,
            avgCourseChange: courseChanges.reduce((sum, change) => sum + Math.abs(change), 0) / courseChanges.length,
          },
        })
      }
    }

    return anomalies
  }

  private static detectStopAnomalies(current: VesselHistoryPoint, history: VesselHistoryPoint[]): AnomalyResult[] {
    const anomalies: AnomalyResult[] = []

    if (current.speed > this.SPEED_THRESHOLDS.SUDDEN_STOP) return anomalies

    const recentHistory = this.getRecentHistory(history, this.TIME_WINDOWS.LONG_TERM)
    const stoppedDuration = this.calculateStoppedDuration(recentHistory, current)

    // Extended stop in shipping lane (simplified - would need actual shipping lane data)
    if (stoppedDuration > 30 * 60 * 1000) {
      // 30 minutes
      anomalies.push({
        type: "stop_anomaly",
        severity: stoppedDuration > 2 * 60 * 60 * 1000 ? "critical" : "high", // 2 hours
        confidence: Math.min(0.9, stoppedDuration / (4 * 60 * 60 * 1000)), // 4 hours max
        description: `Vessel stopped for ${Math.round(stoppedDuration / (60 * 1000))} minutes`,
        parameters: {
          stoppedDuration: stoppedDuration / (60 * 1000), // in minutes
          location: { lat: current.latitude, lng: current.longitude },
        },
      })
    }

    return anomalies
  }

  private static detectErraticMovement(current: VesselHistoryPoint, history: VesselHistoryPoint[]): AnomalyResult[] {
    const anomalies: AnomalyResult[] = []

    if (history.length < 5) return anomalies

    const recentHistory = this.getRecentHistory(history, this.TIME_WINDOWS.MEDIUM_TERM)

    // Calculate movement consistency
    const distances = []
    const bearings = []

    for (let i = 1; i < recentHistory.length; i++) {
      const prev = recentHistory[i - 1]
      const curr = recentHistory[i]

      const distance = this.calculateDistance(prev.latitude, prev.longitude, curr.latitude, curr.longitude)
      const bearing = this.calculateBearing(prev.latitude, prev.longitude, curr.latitude, curr.longitude)

      distances.push(distance)
      bearings.push(bearing)
    }

    // Check for inconsistent movement patterns
    const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length
    const distanceVariance = distances.reduce((sum, d) => sum + Math.pow(d - avgDistance, 2), 0) / distances.length

    const bearingVariance = this.calculateBearingVariance(bearings)

    if (bearingVariance > 45 && distanceVariance > avgDistance * 0.5) {
      anomalies.push({
        type: "erratic_movement",
        severity: bearingVariance > 90 ? "high" : "medium",
        confidence: Math.min(0.8, bearingVariance / 120),
        description: `Erratic movement pattern detected`,
        parameters: {
          bearingVariance,
          distanceVariance,
          avgDistance,
        },
      })
    }

    return anomalies
  }

  private static getRecentHistory(history: VesselHistoryPoint[], timeWindow: number): VesselHistoryPoint[] {
    const cutoffTime = Date.now() - timeWindow
    return history.filter((point) => new Date(point.timestamp).getTime() > cutoffTime)
  }

  private static calculateCourseChange(course1: number, course2: number): number {
    let diff = course2 - course1
    if (diff > 180) diff -= 360
    if (diff < -180) diff += 360
    return diff
  }

  private static calculateStoppedDuration(history: VesselHistoryPoint[], current: VesselHistoryPoint): number {
    let stoppedSince = new Date(current.timestamp).getTime()

    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].speed > this.SPEED_THRESHOLDS.SUDDEN_STOP) {
        break
      }
      stoppedSince = new Date(history[i].timestamp).getTime()
    }

    return new Date(current.timestamp).getTime() - stoppedSince
  }

  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1)
    const dLon = this.toRadians(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private static calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const dLon = this.toRadians(lon2 - lon1)
    const y = Math.sin(dLon) * Math.cos(this.toRadians(lat2))
    const x =
      Math.cos(this.toRadians(lat1)) * Math.sin(this.toRadians(lat2)) -
      Math.sin(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * Math.cos(dLon)
    return this.toDegrees(Math.atan2(y, x))
  }

  private static calculateBearingVariance(bearings: number[]): number {
    if (bearings.length < 2) return 0

    const avgBearing = bearings.reduce((sum, b) => sum + b, 0) / bearings.length
    const variance =
      bearings.reduce((sum, b) => {
        let diff = Math.abs(b - avgBearing)
        if (diff > 180) diff = 360 - diff
        return sum + Math.pow(diff, 2)
      }, 0) / bearings.length

    return Math.sqrt(variance)
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  private static toDegrees(radians: number): number {
    return radians * (180 / Math.PI)
  }
}
