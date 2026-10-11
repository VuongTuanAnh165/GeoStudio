import type { GeometryObject, Coords3D, Coords2D } from '../types/geometry';
import { Point, Segment, Line, Ray, Circle, Polygon, Vector } from '../geometry/primitives/2d';
import { Point3D, Line3D, Segment3D, Plane, Vector3D } from '../geometry/primitives/3d';
import { BaseSolid, PolyhedronSolid, Cube, Cuboid, Tetrahedron, Pyramid, Prism, PyramidalFrustum, Sphere, Cylinder, Cone, Frustum } from '../geometry/3d/Solids';
import { computeCrossSection, type CrossSectionResult } from '../geometry/3d/CrossSection';
import { computeSolidNet, type NetResult } from '../geometry/3d/Net';
import JXG from 'jsxgraph';

export type RenderMode3D = 'wireframe' | 'solid';

export interface JSXGraph3DRendererOptions {
  renderMode?: RenderMode3D;
  planeOpacity?: number;
  solidOpacity?: number;
  boxSize?: number;
}

export class JSXGraph3DRenderer {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public board: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public view: any = null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private renderedElements: Map<string, any[]> = new Map();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private crossSectionElements: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private netElements: any[] = [];

  public renderMode: RenderMode3D = 'solid';
  public planeOpacity: number = 0.35;
  public solidOpacity: number = 0.65;
  public boxSize: number = 6;

  // Camera Orbit angles (in radians)
  public azimuth: number = 0.8; // ~45 deg
  public elevation: number = 0.55; // ~30 deg

  private isDraggingCamera = false;
  private lastMouseX = 0;
  private lastMouseY = 0;
  private cameraAnimationId: number | null = null;

  // Callback when camera moves
  public onCameraChange?: (az: number, el: number) => void;

  init(container: string | HTMLElement, options: JSXGraph3DRendererOptions = {}): void {
    if (options.renderMode) this.renderMode = options.renderMode;
    if (options.planeOpacity !== undefined) this.planeOpacity = options.planeOpacity;
    if (options.solidOpacity !== undefined) this.solidOpacity = options.solidOpacity;
    if (options.boxSize !== undefined) this.boxSize = options.boxSize;

    const containerId = typeof container === 'string' ? container : container.id;

    const bSize = this.boxSize;
    this.board = JXG.JSXGraph.initBoard(containerId, {
      boundingbox: [-bSize * 1.5, bSize * 1.5, bSize * 1.5, -bSize * 1.5],
      axis: false,
      grid: false,
      showCopyright: false,
      showNavigation: false,
      pan: { enabled: false },
      zoom: { wheel: true }
    });

    // Create View3D in JSXGraph
    this.view = this.board.create(
      'view3d',
      [
        [-bSize, -bSize],
        [2 * bSize, 2 * bSize],
        [[-bSize, bSize], [-bSize, bSize], [-bSize, bSize]]
      ],
      {
        x: { strokeColor: '#ef4444', strokeWidth: 1.5, name: 'X' },
        y: { strokeColor: '#10b981', strokeWidth: 1.5, name: 'Y' },
        z: { strokeColor: '#3b82f6', strokeWidth: 1.5, name: 'Z' },
        az: { slider: { visible: false } },
        el: { slider: { visible: false } }
      }
    );

    this.applyCameraAngles();
    this.setupOrbitEvents();
  }

  destroy(): void {
    if (this.cameraAnimationId !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.cameraAnimationId);
      this.cameraAnimationId = null;
    }
    if (this.board) {
      this.clear();
      JXG.JSXGraph.freeBoard(this.board);
      this.board = null;
      this.view = null;
    }
  }

  clear(): void {
    this.clearCrossSection();
    this.clearNet();
    this.renderedElements.forEach(els => {
      els.forEach(el => {
        try {
          if (this.board) this.board.removeObject(el);
        } catch {
          // ignore cleanup
        }
      });
    });
    this.renderedElements.clear();
  }

  // ==========================================
  // Camera Orbit Controls
  // ==========================================

  private setupOrbitEvents(): void {
    if (!this.board || !this.board.containerObj) return;

    const dom = this.board.containerObj as HTMLElement;

    const onMouseDown = (e: MouseEvent) => {
      // Left click or middle click for orbit rotate
      if (e.button === 0 || e.button === 1) {
        this.isDraggingCamera = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!this.isDraggingCamera) return;
      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;

      // Rotate camera angles: dx -> azimuth, dy -> elevation
      this.azimuth -= dx * 0.01;
      this.elevation += dy * 0.01;

      // Clamp elevation between -pi/2 + 0.05 and pi/2 - 0.05
      const maxEl = Math.PI / 2 - 0.05;
      this.elevation = Math.max(-maxEl, Math.min(maxEl, this.elevation));

      this.applyCameraAngles();
      if (this.onCameraChange) {
        this.onCameraChange(this.azimuth, this.elevation);
      }
    };

    const onMouseUp = () => {
      this.isDraggingCamera = false;
    };

    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  public setCameraAngles(azimuth: number, elevation: number): void {
    this.azimuth = azimuth;
    const maxEl = Math.PI / 2 - 0.05;
    this.elevation = Math.max(-maxEl, Math.min(maxEl, elevation));
    this.applyCameraAngles();
  }

  public rotateCamera(deltaAzimuth: number, deltaElevation: number): void {
    this.setCameraAngles(this.azimuth + deltaAzimuth, this.elevation + deltaElevation);
  }

  public resetCamera(): void {
    this.setCameraAngles(0.8, 0.55);
  }

  public animateCamera(
    targetAzimuth: number,
    targetElevation: number,
    duration: number = 500,
    onComplete?: () => void
  ): void {
    if (this.cameraAnimationId !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.cameraAnimationId);
      this.cameraAnimationId = null;
    }

    if (duration <= 0 || typeof requestAnimationFrame === 'undefined') {
      this.setCameraAngles(targetAzimuth, targetElevation);
      onComplete?.();
      return;
    }

    const startAz = this.azimuth;
    const startEl = this.elevation;
    const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, Math.max(0, elapsed / duration));
      // Ease in-out cubic
      const ease = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      const currentAz = startAz + (targetAzimuth - startAz) * ease;
      const currentEl = startEl + (targetElevation - startEl) * ease;
      this.setCameraAngles(currentAz, currentEl);

      if (progress < 1) {
        this.cameraAnimationId = requestAnimationFrame(step);
      } else {
        this.cameraAnimationId = null;
        onComplete?.();
      }
    };

    this.cameraAnimationId = requestAnimationFrame(step);
  }

  public zoomCamera(factor: number): void {
    if (!this.board) return;
    if (factor > 0 && typeof this.board.zoomIn === 'function') {
      this.board.zoomIn();
    } else if (factor < 0 && typeof this.board.zoomOut === 'function') {
      this.board.zoomOut();
    }
  }

  private applyCameraAngles(): void {
    if (!this.view || !this.board) return;
    try {
      if (this.view.az_slide) this.view.az_slide.Value = () => this.azimuth;
      if (this.view.el_slide) this.view.el_slide.Value = () => this.elevation;
      this.board.update();
    } catch {
      // safely handle
    }
  }

  // ==========================================
  // Render Settings & Toggles
  // ==========================================

  public setRenderMode(mode: RenderMode3D): void {
    this.renderMode = mode;
    this.updateAllRenderStyles();
  }

  public setPlaneOpacity(opacity: number): void {
    this.planeOpacity = Math.max(0, Math.min(1, opacity));
    this.updateAllRenderStyles();
  }

  public setSolidOpacity(opacity: number): void {
    this.solidOpacity = Math.max(0, Math.min(1, opacity));
    this.updateAllRenderStyles();
  }

  private updateAllRenderStyles(): void {
    if (!this.board) return;
    const isWireframe = this.renderMode === 'wireframe';

    this.renderedElements.forEach((els, id) => {
      els.forEach(el => {
        if (!el) return;
        if (el.elType === 'polygon' || (el as any).type === (JXG as any)?.OBJECT_TYPE_POLYGON) {
          el.setAttribute({
            fillOpacity: isWireframe ? 0.0 : this.solidOpacity,
            borders: { strokeWidth: isWireframe ? 2 : 1 }
          });
        }
      });
    });
    this.board.update();
  }

  // ==========================================
  // Object Rendering (Primitives & Solids)
  // ==========================================

  public renderObjects(objects: Iterable<GeometryObject>, objectsMap?: Map<string, GeometryObject>): void {
    const map = objectsMap || (objects instanceof Map ? (objects as Map<string, GeometryObject>) : undefined);
    for (const obj of objects) {
      this.renderObject(obj, map);
    }
  }

  private resolveCoords2D(id: string | undefined, objectsMap?: Map<string, GeometryObject>): Coords2D | null {
    if (!id || !objectsMap) return null;
    const obj = objectsMap.get(id);
    if (!obj) return null;
    if ((obj.definition as any)?.coords) return (obj.definition as any).coords;
    if (typeof (obj.definition as any)?.x === 'number' && typeof (obj.definition as any)?.y === 'number') {
      return { x: (obj.definition as any).x, y: (obj.definition as any).y };
    }
    if ('x' in obj && 'y' in obj && typeof (obj as any).x === 'number') {
      return { x: (obj as any).x, y: (obj as any).y };
    }
    return null;
  }

  public renderObject(
    obj: GeometryObject | BaseSolid | Point3D | Line3D | Segment3D | Plane | Point | Segment | Line | Ray | Circle | Polygon | Vector,
    objectsMap?: Map<string, GeometryObject>
  ): void {
    if (!this.view || !this.board) return;

    // Remove existing if re-rendering
    this.removeObject(obj.id);

    const created: any[] = [];
    const isWireframe = this.renderMode === 'wireframe';
    const fillOp = isWireframe ? 0.0 : this.solidOpacity;

    // 1. Point3D
    if (obj instanceof Point3D || obj.type === 'point3d' || (obj.type === 'point' && obj.dimension === 3)) {
      const coords = 'coords' in obj ? (obj.coords as Coords3D) : (obj.definition as any).coords;
      const p = this.view.create('point3d', [coords.x, coords.y, coords.z], {
        name: (obj as any).metadata?.label || obj.id,
        size: 4,
        strokeColor: (obj.style?.color as string) || '#2563eb',
        fillColor: (obj.style?.fillColor as string) || '#60a5fa'
      });
      created.push(p);
    }
    // 1b. Point (2D) -> map to (x, y, 0)
    else if (obj instanceof Point || obj.type === 'point') {
      let x = 0;
      let y = 0;
      if ('x' in obj && 'y' in obj && typeof (obj as any).x === 'number') {
        x = (obj as any).x;
        y = (obj as any).y;
      } else if ((obj.definition as any)?.coords) {
        x = (obj.definition as any).coords.x;
        y = (obj.definition as any).coords.y;
      } else if (typeof (obj.definition as any)?.x === 'number') {
        x = (obj.definition as any).x;
        y = (obj.definition as any).y;
      } else if (obj.parents && obj.parents.length >= 2 && objectsMap) {
        if (obj.definition?.kind === 'midpoint') {
          const p1 = this.resolveCoords2D(obj.parents[0], objectsMap);
          const p2 = this.resolveCoords2D(obj.parents[1], objectsMap);
          if (p1 && p2) {
            x = (p1.x + p2.x) / 2;
            y = (p1.y + p2.y) / 2;
          }
        }
      }
      const label = (obj as any).metadata?.label || obj.id;
      const p = this.view.create('point3d', [x, y, 0], {
        name: label,
        size: 4,
        strokeColor: (obj.style?.color as string) || '#2563eb',
        fillColor: (obj.style?.fillColor as string) || '#60a5fa'
      });
      created.push(p);
    }
    // 2. Segment3D
    else if (obj instanceof Segment3D || obj.type === 'segment3d' || (obj.type === 'segment' && obj.dimension === 3)) {
      const p1 = 'p1' in obj ? (obj.p1 as Coords3D) : (obj.definition as any).p1;
      const p2 = 'p2' in obj ? (obj.p2 as Coords3D) : (obj.definition as any).p2;
      const seg = this.view.create('line3d', [[p1.x, p1.y, p1.z], [p2.x, p2.y, p2.z]], {
        strokeColor: (obj.style?.color as string) || '#3b82f6',
        strokeWidth: (obj.style?.strokeWidth as number) || 2
      });
      created.push(seg);
    }
    // 2b. Segment (2D) -> map to z=0
    else if (obj instanceof Segment || obj.type === 'segment') {
      let p1 = (obj.definition as any)?.p1 || (obj as any).p1;
      let p2 = (obj.definition as any)?.p2 || (obj as any).p2;
      if ((!p1 || !p2) && obj.parents && obj.parents.length >= 2 && objectsMap) {
        p1 = this.resolveCoords2D(obj.parents[0], objectsMap);
        p2 = this.resolveCoords2D(obj.parents[1], objectsMap);
      }
      if (p1 && p2) {
        const seg = this.view.create('line3d', [[p1.x, p1.y, 0], [p2.x, p2.y, 0]], {
          strokeColor: (obj.style?.color as string) || '#3b82f6',
          strokeWidth: (obj.style?.strokeWidth as number) || 2
        });
        created.push(seg);
      }
    }
    // 3. Line3D
    else if (obj instanceof Line3D || obj.type === 'line3d' || (obj.type === 'line' && obj.dimension === 3)) {
      const pt = 'point' in obj ? (obj.point as Coords3D) : (obj.definition as any).point;
      const dir = 'direction' in obj ? (obj.direction as Coords3D) : (obj.definition as any).direction;
      const len = this.boxSize * 1.5;
      const p1: Coords3D = { x: pt.x - dir.x * len, y: pt.y - dir.y * len, z: pt.z - dir.z * len };
      const p2: Coords3D = { x: pt.x + dir.x * len, y: pt.y + dir.y * len, z: pt.z + dir.z * len };
      const line = this.view.create('line3d', [[p1.x, p1.y, p1.z], [p2.x, p2.y, p2.z]], {
        strokeColor: (obj.style?.color as string) || '#6366f1',
        strokeWidth: (obj.style?.strokeWidth as number) || 2,
        dash: 2
      });
      created.push(line);
    }
    // 3b. Line (2D) -> map to z=0
    else if (obj instanceof Line || obj.type === 'line') {
      let pt = (obj.definition as any)?.point || (obj as any).point;
      let dir = (obj.definition as any)?.direction || (obj as any).direction;
      if ((!pt || !dir) && obj.parents && obj.parents.length >= 2 && objectsMap) {
        const p1 = this.resolveCoords2D(obj.parents[0], objectsMap);
        const p2 = this.resolveCoords2D(obj.parents[1], objectsMap);
        if (p1 && p2) {
          pt = p1;
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const len = Math.hypot(dx, dy) || 1;
          dir = { x: dx / len, y: dy / len };
        }
      }
      if (pt && dir) {
        const len = this.boxSize * 1.5;
        const p1 = [pt.x - dir.x * len, pt.y - dir.y * len, 0];
        const p2 = [pt.x + dir.x * len, pt.y + dir.y * len, 0];
        const line = this.view.create('line3d', [p1, p2], {
          strokeColor: (obj.style?.color as string) || '#6366f1',
          strokeWidth: (obj.style?.strokeWidth as number) || 2,
          dash: 2
        });
        created.push(line);
      }
    }
    // 3c. Ray (2D) -> map to z=0
    else if (obj instanceof Ray || obj.type === 'ray') {
      let orig = (obj.definition as any)?.origin || (obj as any).origin;
      let dir = (obj.definition as any)?.direction || (obj as any).direction;
      if ((!orig || !dir) && obj.parents && obj.parents.length >= 2 && objectsMap) {
        const p1 = this.resolveCoords2D(obj.parents[0], objectsMap);
        const p2 = this.resolveCoords2D(obj.parents[1], objectsMap);
        if (p1 && p2) {
          orig = p1;
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const len = Math.hypot(dx, dy) || 1;
          dir = { x: dx / len, y: dy / len };
        }
      }
      if (orig && dir) {
        const len = this.boxSize * 1.5;
        const p1 = [orig.x, orig.y, 0];
        const p2 = [orig.x + dir.x * len, orig.y + dir.y * len, 0];
        const ray = this.view.create('line3d', [p1, p2], {
          strokeColor: (obj.style?.color as string) || '#8b5cf6',
          strokeWidth: (obj.style?.strokeWidth as number) || 2
        });
        created.push(ray);
      }
    }
    // 3d. Circle (2D) -> map to z=0
    else if (obj instanceof Circle || obj.type === 'circle') {
      let center = (obj.definition as any)?.center || (obj as any).center;
      let radius = (obj.definition as any)?.radius ?? (obj as any).radius;
      if ((!center || radius === undefined) && obj.parents && obj.parents.length >= 2 && objectsMap) {
        const p1 = this.resolveCoords2D(obj.parents[0], objectsMap);
        const p2 = this.resolveCoords2D(obj.parents[1], objectsMap);
        if (p1 && p2) {
          center = p1;
          radius = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        }
      }
      if (center && typeof radius === 'number') {
        const numSteps = 48;
        const pts: [number, number, number][] = [];
        for (let i = 0; i <= numSteps; i++) {
          const theta = (i / numSteps) * 2 * Math.PI;
          pts.push([center.x + radius * Math.cos(theta), center.y + radius * Math.sin(theta), 0]);
        }
        for (let i = 0; i < pts.length - 1; i++) {
          const seg = this.view.create('line3d', [pts[i], pts[i + 1]], {
            strokeColor: (obj.style?.color as string) || '#0ea5e9',
            strokeWidth: 2
          });
          created.push(seg);
        }
      }
    }
    // 3e. Polygon (2D) -> map to z=0
    else if (obj instanceof Polygon || obj.type === 'polygon' || obj.type === 'triangle') {
      let points = (obj.definition as any)?.points || (obj as any).points;
      if ((!points || points.length === 0) && obj.parents && obj.parents.length >= 3 && objectsMap) {
        points = obj.parents
          .map(pid => this.resolveCoords2D(pid, objectsMap))
          .filter((p): p is Coords2D => p !== null);
      }
      if (Array.isArray(points) && points.length >= 3) {
        const pts3d = points.map((p: Coords2D) => [p.x, p.y, 0]);
        // Wireframe borders
        for (let i = 0; i < pts3d.length; i++) {
          const next = (i + 1) % pts3d.length;
          const edge = this.view.create('line3d', [pts3d[i], pts3d[next]], {
            strokeColor: (obj.style?.color as string) || '#0284c7',
            strokeWidth: isWireframe ? 2.5 : 1.5
          });
          created.push(edge);
        }
        if (!isWireframe) {
          const polyFace = this.view.create('polygon3d', pts3d, {
            fillColor: (obj.style?.fillColor as string) || '#38bdf8',
            fillOpacity: fillOp,
            borders: { strokeColor: (obj.style?.color as string) || '#0284c7', strokeWidth: 1 }
          });
          created.push(polyFace);
        }
      }
    }
    // 3f. Vector (2D) -> map to z=0
    else if (obj instanceof Vector || obj.type === 'vector') {
      const vx = (obj.definition as any)?.x ?? (obj as any).x ?? 0;
      const vy = (obj.definition as any)?.y ?? (obj as any).y ?? 0;
      const arrow = this.view.create('line3d', [[0, 0, 0], [vx, vy, 0]], {
        strokeColor: (obj.style?.color as string) || '#10b981',
        strokeWidth: 2.5
      });
      created.push(arrow);
    }
    // 4. Plane
    else if (obj instanceof Plane || obj.type === 'plane') {
      const plane = obj instanceof Plane ? obj : Plane.fromPointAndNormal((obj.definition as any).point, (obj.definition as any).normal, obj.id);
      const elements = this.renderPlaneHelper(plane);
      created.push(...elements);
    }
    // 5. Polyhedral Solids (Cube, Cuboid, Tetrahedron, Pyramid, Prism, PyramidalFrustum)
    else if (obj instanceof PolyhedronSolid || (obj.type === 'solid' && 'faces' in obj)) {
      const poly = obj as PolyhedronSolid;
      const verts = poly.vertices;
      const faces = poly.faces;
      const edges = poly.edges;

      // Render wireframe edges
      for (const [i1, i2] of edges) {
        const v1 = verts[i1]?.coords || { x: 0, y: 0, z: 0 };
        const v2 = verts[i2]?.coords || { x: 0, y: 0, z: 0 };
        const edge = this.view.create('line3d', [[v1.x, v1.y, v1.z], [v2.x, v2.y, v2.z]], {
          strokeColor: '#1e293b',
          strokeWidth: isWireframe ? 2.5 : 1.2
        });
        created.push(edge);
      }

      // Render polygon faces
      if (!isWireframe) {
        for (const face of faces) {
          const facePts = face.map(idx => {
            const v = verts[idx]?.coords || { x: 0, y: 0, z: 0 };
            return [v.x, v.y, v.z];
          });
          const polyFace = this.view.create('polygon3d', facePts, {
            fillColor: '#38bdf8',
            fillOpacity: fillOp,
            borders: { strokeColor: '#0284c7', strokeWidth: 1 }
          });
          created.push(polyFace);
        }
      }
    }
    // 6. Curved Solids (Sphere, Cylinder, Cone, Frustum)
    else if (obj instanceof Sphere || (obj.type === 'solid' && (obj.definition as any)?.kind === 'sphere')) {
      const center = 'center' in obj ? (obj.center as Coords3D) : (obj.definition as any).center;
      const r = 'radius' in obj ? (obj.radius as number) : (obj.definition as any).radius;
      // JSXGraph sphere3d / circle slices
      const sph = this.renderSphereHelper(center, r, isWireframe);
      created.push(...sph);
    }
    else if (obj instanceof Cylinder || (obj.type === 'solid' && (obj.definition as any)?.kind === 'cylinder')) {
      const bCenter = 'bottomCenter' in obj ? (obj.bottomCenter as Coords3D) : (obj.definition as any).bottomCenter;
      const tCenter = 'topCenter' in obj ? (obj.topCenter as Coords3D) : (obj.definition as any).topCenter;
      const r = 'radius' in obj ? (obj.radius as number) : (obj.definition as any).radius;
      const cyl = this.renderCylinderHelper(bCenter, tCenter, r, isWireframe);
      created.push(...cyl);
    }
    else if (obj instanceof Cone || (obj.type === 'solid' && (obj.definition as any)?.kind === 'cone')) {
      const bCenter = 'baseCenter' in obj ? (obj.baseCenter as Coords3D) : (obj.definition as any).baseCenter;
      const apex = 'apex' in obj ? (obj.apex as Coords3D) : (obj.definition as any).apex;
      const r = 'radius' in obj ? (obj.radius as number) : (obj.definition as any).radius;
      const cone = this.renderConeHelper(bCenter, apex, r, isWireframe);
      created.push(...cone);
    }
    else if (obj instanceof Frustum || (obj.type === 'solid' && (obj.definition as any)?.kind === 'frustum')) {
      const bCenter = 'bottomCenter' in obj ? (obj.bottomCenter as Coords3D) : (obj.definition as any).bottomCenter;
      const tCenter = 'topCenter' in obj ? (obj.topCenter as Coords3D) : (obj.definition as any).topCenter;
      const r1 = 'bottomRadius' in obj ? (obj.bottomRadius as number) : (obj.definition as any).bottomRadius;
      const r2 = 'topRadius' in obj ? (obj.topRadius as number) : (obj.definition as any).topRadius;
      const frust = this.renderFrustumHelper(bCenter, tCenter, r1, r2, isWireframe);
      created.push(...frust);
    }

    this.renderedElements.set(obj.id, created);
    this.board.update();
  }

  public removeObject(id: string): void {
    const els = this.renderedElements.get(id);
    if (els && this.board) {
      els.forEach(el => {
        try {
          this.board.removeObject(el);
        } catch {
          // ignore
        }
      });
      this.renderedElements.delete(id);
      this.board.update();
    }
  }

  // ==========================================
  // Helper Renderers for Planes & Curves
  // ==========================================

  private renderPlaneHelper(plane: Plane): any[] {
    const list: any[] = [];
    const size = this.boxSize * 1.2;
    // Build a finite rectangular polygon representing the plane
    let ref = new Vector3D(0, 0, 1);
    if (Math.abs(plane.normal.dot(ref)) > 0.9) {
      ref = new Vector3D(1, 0, 0);
    }
    const u = plane.normal.cross(ref).normalize().scale(size);
    const v = plane.normal.cross(u).normalize().scale(size);

    const pt = plane.projectPoint({ x: 0, y: 0, z: 0 }).coords;
    const p1 = [pt.x - u.x - v.x, pt.y - u.y - v.y, pt.z - u.z - v.z];
    const p2 = [pt.x + u.x - v.x, pt.y + u.y - v.y, pt.z + u.z - v.z];
    const p3 = [pt.x + u.x + v.x, pt.y + u.y + v.y, pt.z + u.z + v.z];
    const p4 = [pt.x - u.x + v.x, pt.y - u.y + v.y, pt.z - u.z + v.z];

    const poly = this.view.create('polygon3d', [p1, p2, p3, p4], {
      fillColor: '#818cf8',
      fillOpacity: this.planeOpacity,
      borders: { strokeColor: '#6366f1', strokeWidth: 1.5, dash: 2 }
    });
    list.push(poly);
    return list;
  }

  private renderSphereHelper(center: Coords3D, r: number, isWireframe: boolean): any[] {
    const list: any[] = [];
    // Approximate sphere with 3 orthogonal circles and latitude circles
    const steps = 24;
    const makeCircle = (axis: 'xy' | 'xz' | 'yz') => {
      const pts: number[][] = [];
      for (let i = 0; i <= steps; i++) {
        const theta = (2 * Math.PI * i) / steps;
        if (axis === 'xy') pts.push([center.x + r * Math.cos(theta), center.y + r * Math.sin(theta), center.z]);
        else if (axis === 'xz') pts.push([center.x + r * Math.cos(theta), center.y, center.z + r * Math.sin(theta)]);
        else pts.push([center.x, center.y + r * Math.cos(theta), center.z + r * Math.sin(theta)]);
      }
      for (let i = 0; i < steps; i++) {
        const seg = this.view.create('line3d', [pts[i], pts[i + 1]], {
          strokeColor: '#0ea5e9',
          strokeWidth: isWireframe ? 2 : 1.2
        });
        list.push(seg);
      }
    };
    makeCircle('xy');
    makeCircle('xz');
    makeCircle('yz');
    return list;
  }

  private renderCylinderHelper(b: Coords3D, t: Coords3D, r: number, isWireframe: boolean): any[] {
    const list: any[] = [];
    const steps = 16;
    const bPts: number[][] = [];
    const tPts: number[][] = [];
    for (let i = 0; i < steps; i++) {
      const angle = (2 * Math.PI * i) / steps;
      bPts.push([b.x + r * Math.cos(angle), b.y + r * Math.sin(angle), b.z]);
      tPts.push([t.x + r * Math.cos(angle), t.y + r * Math.sin(angle), t.z]);
    }
    // Base circles & vertical generators
    for (let i = 0; i < steps; i++) {
      const next = (i + 1) % steps;
      list.push(this.view.create('line3d', [bPts[i], bPts[next]], { strokeColor: '#0d9488', strokeWidth: 1.5 }));
      list.push(this.view.create('line3d', [tPts[i], tPts[next]], { strokeColor: '#0d9488', strokeWidth: 1.5 }));
      if (i % 4 === 0) {
        list.push(this.view.create('line3d', [bPts[i], tPts[i]], { strokeColor: '#0d9488', strokeWidth: 1.5 }));
      }
    }
    return list;
  }

  private renderConeHelper(b: Coords3D, apex: Coords3D, r: number, isWireframe: boolean): any[] {
    const list: any[] = [];
    const steps = 16;
    const bPts: number[][] = [];
    for (let i = 0; i < steps; i++) {
      const angle = (2 * Math.PI * i) / steps;
      bPts.push([b.x + r * Math.cos(angle), b.y + r * Math.sin(angle), b.z]);
    }
    const aPt = [apex.x, apex.y, apex.z];
    for (let i = 0; i < steps; i++) {
      const next = (i + 1) % steps;
      list.push(this.view.create('line3d', [bPts[i], bPts[next]], { strokeColor: '#f59e0b', strokeWidth: 1.5 }));
      if (i % 4 === 0) {
        list.push(this.view.create('line3d', [bPts[i], aPt], { strokeColor: '#f59e0b', strokeWidth: 1.5 }));
      }
    }
    return list;
  }

  private renderFrustumHelper(b: Coords3D, t: Coords3D, r1: number, r2: number, isWireframe: boolean): any[] {
    const list: any[] = [];
    const steps = 16;
    const bPts: number[][] = [];
    const tPts: number[][] = [];
    for (let i = 0; i < steps; i++) {
      const angle = (2 * Math.PI * i) / steps;
      bPts.push([b.x + r1 * Math.cos(angle), b.y + r1 * Math.sin(angle), b.z]);
      tPts.push([t.x + r2 * Math.cos(angle), t.y + r2 * Math.sin(angle), t.z]);
    }
    for (let i = 0; i < steps; i++) {
      const next = (i + 1) % steps;
      list.push(this.view.create('line3d', [bPts[i], bPts[next]], { strokeColor: '#8b5cf6', strokeWidth: 1.5 }));
      list.push(this.view.create('line3d', [tPts[i], tPts[next]], { strokeColor: '#8b5cf6', strokeWidth: 1.5 }));
      if (i % 4 === 0) {
        list.push(this.view.create('line3d', [bPts[i], tPts[i]], { strokeColor: '#8b5cf6', strokeWidth: 1.5 }));
      }
    }
    return list;
  }

  // ==========================================
  // Cross-Section Visualization
  // ==========================================

  public renderCrossSection(solid: PolyhedronSolid, plane: Plane): CrossSectionResult | null {
    this.clearCrossSection();
    if (!this.view || !this.board) return null;

    const res = computeCrossSection(solid, plane);
    if (!res || res.vertices.length < 3) return null;

    const pts = res.vertices.map(v => [v.x, v.y, v.z]);
    const poly = this.view.create('polygon3d', pts, {
      fillColor: '#ef4444',
      fillOpacity: 0.65,
      borders: { strokeColor: '#b91c1c', strokeWidth: 2.5 }
    });
    this.crossSectionElements.push(poly);
    this.board.update();
    return res;
  }

  public clearCrossSection(): void {
    if (this.board && this.crossSectionElements.length > 0) {
      this.crossSectionElements.forEach(el => {
        try {
          this.board.removeObject(el);
        } catch {
          // ignore
        }
      });
      this.crossSectionElements = [];
      this.board.update();
    }
  }

  // ==========================================
  // Net (Hình khai triển) Visualization
  // ==========================================

  public renderNet(solid: PolyhedronSolid, foldRatio = 0): NetResult {
    this.clearNet();
    const net = computeSolidNet(solid, foldRatio);
    if (!this.view || !this.board) return net;

    for (const face of net.faces) {
      const pts = face.vertices.map(v => [v.x, v.y, v.z]);
      const poly = this.view.create('polygon3d', pts, {
        fillColor: '#a855f7',
        fillOpacity: 0.5,
        borders: { strokeColor: '#7e22ce', strokeWidth: 1.5 }
      });
      this.netElements.push(poly);
    }
    this.board.update();
    return net;
  }

  public clearNet(): void {
    if (this.board && this.netElements.length > 0) {
      this.netElements.forEach(el => {
        try {
          this.board.removeObject(el);
        } catch {
          // ignore
        }
      });
      this.netElements = [];
      this.board.update();
    }
  }
}
