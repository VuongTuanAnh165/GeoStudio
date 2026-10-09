import type {
  HandDetection,
  HandFeatures,
  FingerState,
  HandOrientation,
  NormalizedLandmark
} from '../types/input';

interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export class GestureFeatureExtractor {
  private lastStates: Map<string, { position: Vector3D; timestamp: number }> = new Map();

  /**
   * Extract high-level features from a MediaPipe HandDetection result.
   */
  public extract(detection: HandDetection, timestamp: number): HandFeatures {
    const { landmarks, handedness } = detection;

    // We need all 21 landmarks
    if (landmarks.length < 21) {
      throw new Error('Invalid hand detection: missing landmarks');
    }

    const palmPosition = this.computePalmPosition(landmarks);
    const palmVelocity = this.computeVelocity(handedness.categoryName, palmPosition, timestamp);

    const orientation = this.computeOrientation(landmarks);

    const thumb = this.computeFingerState(landmarks, 1, 2, 3, 4, palmPosition, true);
    const index = this.computeFingerState(landmarks, 5, 6, 7, 8, palmPosition, false);
    const middle = this.computeFingerState(landmarks, 9, 10, 11, 12, palmPosition, false);
    const ring = this.computeFingerState(landmarks, 13, 14, 15, 16, palmPosition, false);
    const pinky = this.computeFingerState(landmarks, 17, 18, 19, 20, palmPosition, false);

    const pinchDistance = this.distance(landmarks[4]!, landmarks[8]!);
    
    // Pointer position: midway between index tip and thumb tip
    const pointerPosition = {
      x: (landmarks[4]!.x + landmarks[8]!.x) / 2,
      y: (landmarks[4]!.y + landmarks[8]!.y) / 2,
      z: (landmarks[4]!.z + landmarks[8]!.z) / 2
    };

    return {
      handedness: handedness.categoryName,
      fingers: { thumb, index, middle, ring, pinky },
      pinchDistance,
      palmPosition,
      palmVelocity,
      pointerPosition,
      orientation
    };
  }

  /**
   * Clear tracked states (e.g., when no hands are detected for a while).
   */
  public reset(): void {
    this.lastStates.clear();
  }

  // ── Private Helpers ─────────────────────────────────────────────────

  private computePalmPosition(landmarks: NormalizedLandmark[]): Vector3D {
    // The palm center can be approximated as the centroid of wrist + MCPs
    const indices = [0, 5, 9, 13, 17];
    let x = 0, y = 0, z = 0;
    
    for (const idx of indices) {
      x += landmarks[idx]!.x;
      y += landmarks[idx]!.y;
      z += landmarks[idx]!.z;
    }
    
    return {
      x: x / indices.length,
      y: y / indices.length,
      z: z / indices.length
    };
  }

  private computeVelocity(handId: string, currentPos: Vector3D, timestamp: number): Vector3D {
    const last = this.lastStates.get(handId);
    
    if (!last) {
      this.lastStates.set(handId, { position: currentPos, timestamp });
      return { x: 0, y: 0, z: 0 };
    }

    const dt = (timestamp - last.timestamp) / 1000; // in seconds
    
    // If dt is too large (e.g. tracking lost and regained), reset velocity
    if (dt <= 0 || dt > 1.0) {
      this.lastStates.set(handId, { position: currentPos, timestamp });
      return { x: 0, y: 0, z: 0 };
    }

    const velocity = {
      x: (currentPos.x - last.position.x) / dt,
      y: (currentPos.y - last.position.y) / dt,
      z: (currentPos.z - last.position.z) / dt
    };

    this.lastStates.set(handId, { position: currentPos, timestamp });
    
    return velocity;
  }

  private computeFingerState(
    landmarks: NormalizedLandmark[],
    mcpIdx: number,
    pipIdx: number,
    dipIdx: number,
    tipIdx: number,
    palmPosition: Vector3D,
    isThumb: boolean
  ): FingerState {
    const wrist = landmarks[0]!;
    const mcp = landmarks[mcpIdx]!;
    const pip = landmarks[pipIdx]!;
    const tip = landmarks[tipIdx]!;

    let isExtended = false;

    if (isThumb) {
      // Thumb is extended if its tip is further from the index MCP (5) than its IP (3)
      // or using a simple distance metric to the wrist
      const distTipToIndexMcp = this.distance(tip, landmarks[5]!);
      const distIpToIndexMcp = this.distance(landmarks[3]!, landmarks[5]!);
      isExtended = distTipToIndexMcp > distIpToIndexMcp;
    } else {
      // Other fingers: extended if the distance from wrist to tip is greater than wrist to PIP
      const distTipToWrist = this.distance(tip, wrist);
      const distPipToWrist = this.distance(pip, wrist);
      
      // Additional check: tip must be further from MCP than PIP is from MCP
      const distTipToMcp = this.distance(tip, mcp);
      const distPipToMcp = this.distance(pip, mcp);
      
      isExtended = distTipToWrist > distPipToWrist && distTipToMcp > distPipToMcp;
    }

    return {
      isExtended,
      tipDistanceToPalm: this.distance(tip, palmPosition)
    };
  }

  private computeOrientation(landmarks: NormalizedLandmark[]): HandOrientation {
    const wrist = landmarks[0]!;
    const indexMcp = landmarks[5]!;
    const pinkyMcp = landmarks[17]!;

    // Compute basis vectors for the hand coordinate system
    // Y-axis: vector from wrist to middle MCP (approximate up direction for the hand)
    const middleMcp = landmarks[9]!;
    const yAxis = this.normalize(this.subtract(middleMcp, wrist));

    // X-axis: vector from pinky MCP to index MCP (across the palm)
    let xAxis = this.normalize(this.subtract(indexMcp, pinkyMcp));

    // Z-axis: cross product of X and Y (normal to the palm)
    let zAxis = this.cross(xAxis, yAxis);

    // Re-orthogonalize X to ensure a perfect right-handed coordinate system
    xAxis = this.cross(yAxis, zAxis);

    // Pitch: rotation around X axis (nodding up/down)
    const pitch = Math.asin(Math.max(-1, Math.min(1, yAxis.z)));
    
    // Yaw: rotation around Y axis (turning left/right)
    const yaw = Math.atan2(-zAxis.x, zAxis.z);
    
    // Roll: rotation around Z axis (tilting side to side)
    const roll = Math.atan2(xAxis.y, xAxis.x);

    // If zAxis.z < 0, the palm normal is pointing towards the camera
    const facingCamera = zAxis.z < 0;

    return { pitch, yaw, roll, facingCamera };
  }

  // ── Math Utils ──────────────────────────────────────────────────────

  private distance(p1: Vector3D, p2: Vector3D): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const dz = p1.z - p2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  private subtract(p1: Vector3D, p2: Vector3D): Vector3D {
    return { x: p1.x - p2.x, y: p1.y - p2.y, z: p1.z - p2.z };
  }

  private cross(v1: Vector3D, v2: Vector3D): Vector3D {
    return {
      x: v1.y * v2.z - v1.z * v2.y,
      y: v1.z * v2.x - v1.x * v2.z,
      z: v1.x * v2.y - v1.y * v2.x
    };
  }

  private normalize(v: Vector3D): Vector3D {
    const length = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    if (length === 0) return { x: 0, y: 0, z: 0 };
    return { x: v.x / length, y: v.y / length, z: v.z / length };
  }
}
