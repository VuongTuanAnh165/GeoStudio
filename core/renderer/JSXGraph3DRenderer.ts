import type { GeometryObject, Coords3D } from '../types/geometry';
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

  public renderObject(obj: GeometryObject | BaseSolid | Point3D | Line3D | Segment3D | Plane): void {
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
        name: obj.id,
        size: 4,
        strokeColor: '#2563eb',
        fillColor: '#60a5fa'
      });
      created.push(p);
    }
    // 2. Segment3D
    else if (obj instanceof Segment3D || obj.type === 'segment3d' || (obj.type === 'segment' && obj.dimension === 3)) {
      const p1 = 'p1' in obj ? (obj.p1 as Coords3D) : (obj.definition as any).p1;
      const p2 = 'p2' in obj ? (obj.p2 as Coords3D) : (obj.definition as any).p2;
      const seg = this.view.create('line3d', [[p1.x, p1.y, p1.z], [p2.x, p2.y, p2.z]], {
        strokeColor: '#3b82f6',
        strokeWidth: 2
      });
      created.push(seg);
    }
    // 3. Line3D
    else if (obj instanceof Line3D || obj.type === 'line3d' || (obj.type === 'line' && obj.dimension === 3)) {
      const pt = 'point' in obj ? (obj.point as Coords3D) : (obj.definition as any).point;
      const dir = 'direction' in obj ? (obj.direction as Coords3D) : (obj.definition as any).direction;
      const len = this.boxSize * 1.5;
      const p1: Coords3D = { x: pt.x - dir.x * len, y: pt.y - dir.y * len, z: pt.z - dir.z * len };
      const p2: Coords3D = { x: pt.x + dir.x * len, y: pt.y + dir.y * len, z: pt.z + dir.z * len };
      const line = this.view.create('line3d', [[p1.x, p1.y, p1.z], [p2.x, p2.y, p2.z]], {
        strokeColor: '#6366f1',
        strokeWidth: 2,
        dash: 2
      });
      created.push(line);
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
