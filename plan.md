# GeoStudio — Implementation Plan

> **Kế hoạch phát triển chi tiết theo từng giai đoạn**
>
> Mỗi Phase kết thúc bằng một bản deploy-ready trên Vercel.
> Nguyên tắc: **Foundation trước, Feature sau. Mouse trước, Gesture sau.**

---

## Tổng quan các Phase

```text
Phase 0: Project Setup & Specification               ██░░░░░░░░░░░░░░░░
Phase 1: Geometry Core (Primitives + Graph)           ████░░░░░░░░░░░░░░
Phase 2: Command Engine + Undo/Redo                   ██████░░░░░░░░░░░░
Phase 3: 2D Renderer + Mouse Interaction              ████████░░░░░░░░░░
Phase 4: Construction Engine + Constraints            ██████████░░░░░░░░
Phase 5: Smart Snap + Measurement + Export            ████████████░░░░░░
Phase 6: Gesture Engine (Camera + MediaPipe)          ██████████████░░░░
Phase 7: Dynamic Geometry (Slider, Locus, Animation)  ████████████████░░
Phase 8: 3D Geometry                                  ██████████████████
Phase 9: Curriculum + Teacher Features                ████████████████████
Phase 10: AI + Voice + Advanced                       ██████████████████████
```

---

## Phase Dependencies

```text
Phase 0  ──→  Phase 1  ──→  Phase 2  ──→  Phase 3  ──→  Phase 4  ──→  Phase 5
                                                                         │
                                                                         ▼
                        Phase 7  ←──  Phase 6  ←────────────────── Phase 5
                          │
                          ▼
                        Phase 8  ──→  Phase 9  ──→  Phase 10
```

**Có thể song song hóa:**
- Phase 7 (Dynamic Geometry) + Phase 8 (3D) — khác module
- Phase 9 (Curriculum) có thể bắt đầu data modeling song song Phase 8
- Phase 10 tasks (PWA, Mobile) có thể bắt đầu song song Phase 9

**Strictly sequential:**
- Phase 0 → 1 → 2 → 3 (foundation chain)
- Phase 3 → 6 (gesture needs stable mouse interaction)

---

## Phase 0 — Project Setup & Specification

**Mục tiêu:** Thiết lập nền tảng dự án, cấu trúc thư mục, tooling, và các TypeScript interfaces cốt lõi. Chưa có UI phức tạp.

### Tasks

#### 0.1 — Project Configuration
- [ ] Setup Nuxt 4 project (đã có)
- [ ] Cấu hình TypeScript strict mode
- [ ] Setup Pinia store
- [ ] Setup `@nuxtjs/i18n` với locales `vi.json` + `en.json`
- [ ] Setup `@nuxt/icon` + Iconify
- [ ] Setup Vitest + config
- [ ] Setup Playwright
- [ ] Setup ESLint + Prettier
- [ ] Tạo `.github/workflows/ci.yml` cho GitHub Actions (lint + test)
- [ ] Cấu hình Vercel deployment (vercel.json nếu cần)

#### 0.2 — Folder Structure
- [ ] Tạo cấu trúc thư mục theo docs.md Section 45:
  ```text
  core/
    ├── geometry/
    ├── commands/
    ├── input/
    ├── gesture/
    ├── renderer/
    ├── document/
    ├── events/
    └── types/
  ```
- [ ] Tạo barrel exports (`index.ts`) cho mỗi module

#### 0.3 — Core Type Definitions
- [ ] Định nghĩa `GeometryObject` type system (`core/types/geometry.ts`)
- [ ] Định nghĩa `GeometryCommand` interface (`core/types/commands.ts`)
- [ ] Định nghĩa `GeoEvent` types (`core/types/events.ts`)
- [ ] Định nghĩa `InputIntent` interface (`core/types/input.ts`)
- [ ] Định nghĩa `GeoDocument` schema (`core/types/document.ts`)
- [ ] Tạo Zod schemas cho document validation
- [ ] Định nghĩa `GEOMETRY_TOLERANCE` constants

#### 0.4 — Event Bus
- [ ] Implement `EventBus` class (`core/events/EventBus.ts`)
- [ ] Unit tests cho EventBus
- [ ] Tích hợp vào Pinia store (provide/inject)

#### 0.5 — Landing Page
- [ ] Tạo layout `default.vue`
- [ ] Tạo trang `index.vue` — landing page đơn giản với:
  - Logo + tên "GeoStudio"
  - Nút "Bắt đầu" → navigate tới workspace
  - Mô tả ngắn gọn
- [ ] Tạo layout `workspace.vue` (full-screen, không navbar)
- [ ] Tạo trang `workspace.vue` — placeholder canvas

### Deliverables
- ✅ Project chạy được `npm run dev`
- ✅ Deploy lên Vercel thành công
- ✅ Landing page + workspace page (placeholder)
- ✅ TypeScript types cho toàn bộ core concepts
- ✅ EventBus hoạt động với unit tests
- ✅ CI pipeline chạy lint + test

### Risks & Blockers
- ⚠️ Nuxt 4 breaking changes (mới release) → pin version chính xác
- ⚠️ i18n setup phức tạp hơn dự kiến → có thể defer i18n module, dùng simple composable trước
- ⚠️ JSXGraph type definitions chưa hoàn chỉnh → có thể cần tự viết `.d.ts`

### Definition of Done
- [ ] `npm run dev` chạy không lỗi
- [ ] `npm run build` thành công
- [ ] Deploy Vercel preview thành công
- [ ] Tất cả TypeScript types compile không lỗi
- [ ] EventBus unit tests pass (≥ 10 tests)
- [ ] CI pipeline (lint + type-check + test) green
- [ ] Landing page render đúng trên Chrome, Firefox, Safari

### Estimated Time: 3–4 ngày

---

## Phase 1 — Geometry Core (Primitives + Construction Graph)

**Mục tiêu:** Xây dựng Geometry Engine thuần logic — không UI. Mọi thứ phải chạy qua unit tests.

### Tasks

#### 1.1 — Primitives
- [ ] `Point` — free point, tọa độ (x, y)
- [ ] `Segment` — hai điểm, tính length
- [ ] `Line` — through 2 points, hoặc point + direction
- [ ] `Ray` — start point + direction
- [ ] `Circle` — center + radius, hoặc center + point
- [ ] `Arc` — center + start angle + end angle + radius
- [ ] `Angle` — 3 points (vertex ở giữa), tính measure
- [ ] `Vector` — from point to point, magnitude, direction
- [ ] `Polygon` — ordered list of points, tính perimeter + area

Mỗi primitive cần:
- [ ] Factory function
- [ ] toString() / toJSON()
- [ ] Unit tests (≥ 5 test cases/primitive)
- [ ] Property-based tests với fast-check

#### 1.2 — Intersection Module
- [ ] Line-Line intersection
- [ ] Line-Circle intersection (0, 1, 2 points)
- [ ] Circle-Circle intersection (0, 1, 2 points)
- [ ] Segment-Segment intersection
- [ ] Segment-Circle intersection
- [ ] Ray-Line/Circle intersection
- [ ] Degenerate case handling (parallel, coincident, tangent)
- [ ] Unit tests cho mọi trường hợp (bao gồm edge cases)

#### 1.3 — Measurement Module
- [ ] `distance(A, B)` — khoảng cách 2 điểm
- [ ] `distancePointToLine(P, L)` — khoảng cách điểm-đường thẳng
- [ ] `angle(A, B, C)` — góc tại B
- [ ] `area(polygon)` — diện tích đa giác (Shoelace formula)
- [ ] `perimeter(polygon)` — chu vi
- [ ] `arcLength(arc)` — độ dài cung
- [ ] `sectorArea(sector)` — diện tích hình quạt
- [ ] Unit tests + property-based tests

#### 1.4 — Construction Graph
- [ ] `ConstructionGraph` class
  - [ ] `addNode(object)` — thêm object
  - [ ] `removeNode(id)` — xóa + cascade hoặc orphan
  - [ ] `addEdge(parentId, childId)` — thêm dependency
  - [ ] `getDependants(id)` — lấy tất cả descendants
  - [ ] `getParents(id)` — lấy tất cả ancestors
  - [ ] `markDirty(id)` — đánh dấu dirty + propagate
  - [ ] `recalculate()` — tính lại tất cả dirty nodes theo topological sort
- [ ] `TopologicalSort` — sort DAG
- [ ] Cycle detection (throw error nếu có cycle)
- [ ] Batch update support
- [ ] Unit tests:
  - [ ] Basic add/remove
  - [ ] Dependency tracking
  - [ ] Dirty propagation
  - [ ] Topological order
  - [ ] Cycle detection
  - [ ] Cascade delete

### Deliverables
- ✅ Geometry primitives hoạt động độc lập (no UI dependency)
- ✅ Intersection module xử lý tất cả trường hợp
- ✅ Measurement module chính xác
- ✅ Construction Graph với topological sort + dirty propagation
- ✅ ≥ 100 unit tests pass
- ✅ Property-based tests cho numerical accuracy

### Risks & Blockers
- ⚠️ Floating point precision bugs → giải quyết bằng EPSILON + property-based tests
- ⚠️ Topological sort performance với graph lớn → benchmark ≥ 500 nodes
- ⚠️ Intersection edge cases rất nhiều → cần exhaustive test matrix

### Definition of Done
- [ ] Tất cả 9 primitives hoạt động với factory + toJSON/fromJSON
- [ ] Intersection module: ≥ 30 test cases bao gồm degenerate cases
- [ ] Measurement module: chính xác tới EPSILON (1e-10)
- [ ] Construction Graph: topological sort, dirty propagation, cycle detection hoạt động
- [ ] ≥ 100 unit tests pass
- [ ] Property-based tests pass (fast-check, ≥ 1000 iterations mỗi property)
- [ ] Zero runtime dependency on UI/renderer

### Estimated Time: 5–7 ngày

---

## Phase 2 — Command Engine + Undo/Redo

**Mục tiêu:** Xây dựng Command pattern cho mọi thao tác. Hỗ trợ Undo/Redo hoàn chỉnh.

### Tasks

#### 2.1 — Command Engine
- [ ] `CommandEngine` class
  - [ ] `execute(command)` — thực thi + push vào history
  - [ ] `validate(command)` — kiểm tra trước khi thực thi
- [ ] `CommandHistory` class
  - [ ] `undo()` — hoàn tác
  - [ ] `redo()` — làm lại
  - [ ] `clear()` — xóa history
  - [ ] `getSteps()` — trả về danh sách commands
  - [ ] Max history limit (200 mặc định)
  - [ ] Batch operations (beginBatch / endBatch)

#### 2.2 — Core Commands
- [ ] `CreatePointCommand`
- [ ] `CreateSegmentCommand`
- [ ] `CreateLineCommand`
- [ ] `CreateRayCommand`
- [ ] `CreateCircleCommand`
- [ ] `CreatePolygonCommand`
- [ ] `CreateTriangleCommand`
- [ ] `MovePointCommand` (kéo điểm → recalculate graph)
- [ ] `DeleteObjectCommand` (cascade delete dependants)
- [ ] `SetStyleCommand` (thay đổi màu, lineWidth, etc.)
- [ ] `ToggleVisibilityCommand`
- [ ] `ShowLabelCommand` / `HideLabelCommand`

Mỗi command cần:
- [ ] `execute()` method
- [ ] `undo()` method (inverse operation)
- [ ] `validate()` method
- [ ] Serializable (toJSON / fromJSON)

#### 2.3 — Pinia Integration
- [ ] `useGeometryStore` — Pinia store cho geometry state
  - [ ] `objects: Map<string, GeometryObject>`
  - [ ] `constructionGraph: ConstructionGraph`
  - [ ] `selectedIds: Set<string>`
  - [ ] `activeToolType: ToolType`
  - [ ] Actions: `executeCommand()`, `undo()`, `redo()`
  - [ ] Getters: `selectedObjects`, `canUndo`, `canRedo`

#### 2.4 — Tests
- [ ] Unit tests cho mỗi command (execute + undo)
- [ ] Integration tests: sequence of commands → undo all → verify empty state
- [ ] Batch undo tests
- [ ] Max history tests

### Deliverables
- ✅ Command Engine hoạt động
- ✅ 12+ commands implement
- ✅ Undo/Redo stack hoạt động chính xác
- ✅ Pinia store tích hợp
- ✅ ≥ 50 unit tests cho commands

### Risks & Blockers
- ⚠️ Command serialization phức tạp (circular refs) → dùng ID references thay vì object refs
- ⚠️ Undo cho cascade delete khó → lưu snapshot of deleted subgraph

### Definition of Done
- [ ] 12+ commands implement đầy đủ execute() + undo()
- [ ] Undo 50 lần liên tiếp → state khôi phục chính xác
- [ ] Batch undo/redo hoạt động
- [ ] Command serialization round-trip: toJSON → fromJSON → execute → same result
- [ ] ≥ 50 unit tests pass
- [ ] Pinia store reactive: UI tự update khi state thay đổi

### Estimated Time: 4–5 ngày

---

## Phase 3 — 2D Renderer + Mouse Interaction

**Mục tiêu:** Đưa Geometry Core lên UI. User có thể tạo, chọn, kéo, xóa các đối tượng bằng chuột.

### Tasks

#### 3.1 — JSXGraph Integration
- [ ] Install JSXGraph (`npm install jsxgraph`)
- [ ] Tạo `JSXGraphRenderer` class implement `GeometryRenderer` interface
  - [ ] `init(container)` — tạo board
  - [ ] `renderObject(obj)` — vẽ object lên board
  - [ ] `removeObject(id)` — xóa khỏi board
  - [ ] `updateObject(id, changes)` — cập nhật object
  - [ ] `hitTest(screenPos)` — tìm object tại vị trí
  - [ ] `getScreenPosition(mathPos)` / `getMathPosition(screenPos)`
- [ ] Tạo composable `useCanvas.ts` — wrapper cho renderer
- [ ] Style mapping: GeometryObject.style → JSXGraph attributes

#### 3.2 — Canvas Component
- [ ] `GeoCanvas.vue` — main canvas component
  - [ ] Mount JSXGraph board
  - [ ] Reactive render khi geometry store thay đổi
  - [ ] Grid toggle
  - [ ] Axis toggle
  - [ ] Zoom in/out (mouse wheel)
  - [ ] Pan (middle mouse button hoặc space+drag)
  - [ ] Fit to view

#### 3.3 — Mouse Interaction
- [ ] `MouseHandler` class
  - [ ] Click → đọc active tool → tạo intent → command
  - [ ] Drag → move object
  - [ ] Double-click → edit label
  - [ ] Right-click → context menu (simple)
  - [ ] Hover → highlight
  - [ ] Selection (click, shift+click for multi)
- [ ] Tool system:
  - [ ] Select tool (pointer)
  - [ ] Point tool
  - [ ] Segment tool
  - [ ] Line tool
  - [ ] Ray tool
  - [ ] Circle tool (center + radius point)
  - [ ] Polygon tool (click points, close on first point)
  - [ ] Triangle tool (3 points)
  - [ ] Delete tool

#### 3.4 — Toolbar
- [ ] `Toolbar.vue` — bên trái
  - [ ] Tool buttons với icons
  - [ ] Active tool highlight
  - [ ] Tool groups (collapsible)
  - [ ] Tooltip hiển thị shortcut
- [ ] `ToolButton.vue` — reusable

#### 3.5 — Object Panel
- [ ] `ObjectPanel.vue` — bên phải
  - [ ] Danh sách objects (tên, type, icon)
  - [ ] Click → select + focus
  - [ ] Toggle visibility (eye icon)
  - [ ] Delete button
- [ ] `PropertyEditor.vue`
  - [ ] Hiển thị properties của selected object
  - [ ] Edit: color, label, line width, point size

#### 3.6 — Status Bar
- [x] Hiển thị: object count, zoom level, active tool, cursor position

#### 3.7 — Theme System
- [x] `useTheme.ts` composable
- [x] Light theme (default)
- [x] Dark theme
- [x] CSS custom properties cho colors
- [x] Theme toggle button

#### 3.8 — Keyboard Shortcuts
- [x] `useKeyboard.ts` composable
- [x] Core shortcuts: Ctrl+Z, Ctrl+Y, Delete, Escape, Ctrl+A
- [x] Tool shortcuts: V, P, L, S, C, T, R, G
- [x] View shortcuts: Ctrl+0, F, F11

#### 3.9 — Context Menu
- [x] Right-click context menu component
- [x] Context-sensitive menu items (empty canvas vs point vs line vs polygon)
- [x] Long-press support cho touch
- [x] Construct sub-menu (hiện constructions khả dụng)

#### 3.10 — Auto-naming System
- [ ] `NameGenerator` class — tự đặt tên A, B, C... cho points
- [ ] Special naming (H, O, I, G, M cho các điểm đặc biệt)
- [ ] Rename functionality (double-click label)
- [ ] Name collision handling

### Deliverables
- ✅ Canvas hiển thị geometry objects
- ✅ Tạo Point, Segment, Line, Ray, Circle, Polygon, Triangle bằng chuột
- ✅ Chọn, kéo, xóa objects
- ✅ Undo/Redo hoạt động trên UI
- ✅ Toolbar + Object Panel + Property Editor
- ✅ Dark/Light theme
- ✅ Keyboard shortcuts
- ✅ Zoom/Pan
- ✅ Context menu hoạt động
- ✅ Auto-naming cho mọi object type
- ✅ **Đây là phiên bản đầu tiên có thể demo được**

### Risks & Blockers
- ⚠️ JSXGraph event handling có thể conflict với custom mouse handler → cần careful integration
- ⚠️ JSXGraph + Nuxt SSR không tương thích → phải `<ClientOnly>` wrapper
- ⚠️ JSXGraph bundle size lớn (~300KB) → lazy import

### Definition of Done
- [ ] Tạo tất cả 9 primitives bằng mouse + keyboard shortcut
- [ ] Kéo free point → dependants auto-update (visual confirmation)
- [ ] Undo/Redo 20 lần → canvas state đúng
- [ ] Zoom 10% → 500% → reset hoạt động
- [ ] Dark/Light theme switch không flicker
- [ ] Keyboard shortcut đúng cho tất cả tools
- [ ] No console errors trong normal workflow
- [ ] Render ≥ 100 objects không lag (≥ 30fps)

### Estimated Time: 7–10 ngày

---

## Phase 4 — Construction Engine + Constraints

**Mục tiêu:** Xây dựng các phép dựng hình quan trọng và hệ thống ràng buộc cơ bản. Hình "thông minh".

### Tasks

#### 4.1 — Construction Registry
- [ ] `ConstructionRegistry` class
  - [ ] `register(definition)` — đăng ký phép dựng
  - [ ] `getConstruction(id)` — lấy definition
  - [ ] `getAvailable(selectedObjects)` — liệt kê constructions khả dụng dựa trên selection
- [ ] Tích hợp vào UI: khi chọn objects, hiện menu constructions khả dụng

#### 4.2 — Constructions (Phase 1: THCS cơ bản)
- [ ] `Midpoint` — trung điểm đoạn thẳng
- [ ] `PerpendicularLine` — đường vuông góc qua điểm
- [ ] `ParallelLine` — đường song song qua điểm
- [ ] `AngleBisector` — đường phân giác
- [ ] `PerpendicularBisector` — đường trung trực
- [ ] `Median` — đường trung tuyến tam giác
- [ ] `Altitude` — đường cao tam giác
- [ ] `Intersection` — giao điểm (line-line, line-circle, circle-circle)
- [ ] `Circumcircle` — đường tròn ngoại tiếp tam giác
- [ ] `Incircle` — đường tròn nội tiếp tam giác
- [ ] `Tangent` — đường tiếp tuyến đường tròn qua điểm
- [ ] `Projection` — hình chiếu vuông góc

Mỗi construction:
- [ ] Register vào registry
- [ ] Tương ứng Command
- [ ] Auto-create trong Construction Graph (parents → child)
- [ ] Unit tests

#### 4.3 — Construction Tools trên UI
- [ ] Midpoint tool
- [ ] Perpendicular tool
- [ ] Parallel tool
- [ ] Bisector tool
- [ ] Intersection tool (auto-detect khi 2 objects giao nhau)
- [ ] Circumcircle tool (chọn 3 điểm hoặc tam giác)
- [ ] Incircle tool
- [ ] Tangent tool

#### 4.4 — Constraint System (cơ bản)
- [ ] `ConstraintSolver` class
- [ ] `FixedLength` constraint — giữ độ dài cố định
- [ ] `FixedAngle` constraint — giữ góc cố định
- [ ] `PointOnLine` constraint — điểm nằm trên đường thẳng
- [ ] `PointOnCircle` constraint — điểm nằm trên đường tròn
- [ ] `Horizontal` / `Vertical` constraint
- [ ] UI: hiển thị constraints trên object panel
- [ ] Unit tests

#### 4.5 — Smart Constructions
- [ ] Khi dựng perpendicular, tự hiển thị biểu tượng vuông góc (⊥)
- [ ] Khi dựng bisector, tự hiển thị dấu bằng trên 2 góc
- [ ] Khi dựng midpoint, tự hiển thị dấu bằng trên 2 đoạn
- [ ] Auto-label cho constructions (H, M, O, I, G cho các điểm đặc biệt)

### Deliverables
- ✅ 12+ phép dựng hình hoạt động
- ✅ Construction Graph tự cập nhật khi kéo điểm
- ✅ Constraint system cơ bản
- ✅ Construction tools trên toolbar
- ✅ Auto-labeling cho điểm đặc biệt
- ✅ **Giáo viên có thể dựng hình tam giác với đường cao, trung tuyến, phân giác, trung trực**

### Estimated Time: 7–9 ngày

---

## Phase 5 — Smart Snap + Measurement + Export

**Mục tiêu:** Hoàn thiện trải nghiệm editing. Thêm đo lường, snap, và export.

### Tasks

#### 5.1 — Smart Snap System
- [ ] `SnapEngine` class
  - [ ] Point snap (snap tới điểm gần nhất)
  - [ ] Intersection snap (snap tới giao điểm)
  - [ ] Midpoint snap
  - [ ] Line snap (snap tới đường thẳng)
  - [ ] Grid snap
  - [ ] Perpendicular snap
  - [ ] Snap priority (intersection > point > special > line > grid)
- [ ] Visual indicators:
  - [ ] Snap dot (hiện điểm snap)
  - [ ] Snap line (hiện đường dẫn)
  - [ ] Snap tooltip ("Midpoint of AB")
- [ ] `CanvasOverlay.vue` — overlay layer cho snap indicators
- [ ] Settings: toggle on/off từng loại snap

#### 5.2 — Measurement System
- [ ] Measurement tools trên toolbar:
  - [ ] Measure distance (chọn 2 điểm hoặc 1 segment)
  - [ ] Measure angle (chọn 3 điểm)
  - [ ] Measure area (chọn polygon)
  - [ ] Measure perimeter (chọn polygon)
- [ ] `MeasurementPanel.vue`:
  - [ ] Hiển thị tất cả measurements hiện tại
  - [ ] Auto-update khi kéo điểm
  - [ ] Copy value
- [ ] Measurement labels trên canvas:
  - [ ] Distance: "AB = 5.00"
  - [ ] Angle: "∠ABC = 60°"
  - [ ] Area: "S = 12.50"
- [ ] KaTeX integration cho formula display
- [ ] `FormulaDisplay.vue` — render formula

#### 5.3 — Document Save/Load
- [ ] `DocumentStorage` class — IndexedDB wrapper (via `idb`)
  - [ ] `save(document)` — lưu vào IndexedDB
  - [ ] `load(id)` — load từ IndexedDB
  - [ ] `list()` — liệt kê documents
  - [ ] `delete(id)` — xóa document
  - [ ] Auto-save (mỗi 30s hoặc sau mỗi command)
- [ ] `useDocument.ts` composable
- [ ] Save dialog (tên + mô tả)
- [ ] Open dialog (danh sách documents + preview)
- [ ] Auto-save indicator trên UI

#### 5.4 — Export System
- [ ] Export PNG (html2canvas hoặc JSXGraph's built-in)
- [ ] Export SVG
- [ ] Export JSON (document format)
- [ ] Print (window.print() với print-friendly CSS)
- [ ] Export dialog UI

#### 5.5 — Copy/Paste System
- [ ] `ClipboardManager` class
  - [ ] Copy selected objects → clipboard
  - [ ] Paste from clipboard → new objects at offset
  - [ ] Duplicate (Ctrl+D) — instant copy+paste
- [ ] Copy preserves construction relationships
- [ ] Name conflict resolution on paste
- [ ] Cross-tab copy via system clipboard (JSON)

#### 5.6 — Welcome / Dashboard
- [ ] Cập nhật `index.vue`:
  - [ ] Recent documents
  - [ ] "New workspace" button
  - [ ] Import JSON button
  - [ ] Quick templates (tam giác, tứ giác, đường tròn)

### Deliverables
- ✅ Smart Snap hoạt động mượt mà
- ✅ Measurement hiển thị trên canvas + panel
- ✅ KaTeX formula rendering
- ✅ Save/Load/Auto-save vào IndexedDB
- ✅ Export PNG/SVG/JSON
- ✅ Print support
- ✅ Dashboard với recent documents
- ✅ **Đây là phiên bản "usable" đầu tiên cho giáo viên (chỉ mouse)**

### Estimated Time: 6–8 ngày

---

## Phase 6 — Gesture Engine (Camera + MediaPipe)

**Mục tiêu:** Tích hợp camera + MediaPipe + gesture recognition. Giáo viên có thể dùng tay để điều khiển.

### Prerequisites
- Phase 3 phải hoàn thành và ổn định
- Mouse interaction phải hoạt động hoàn hảo trước

### Tasks

#### 6.1 — MediaPipe Web Worker
- [ ] Tạo `mediapipe.worker.ts`
  - [ ] Load Hand Landmarker model
  - [ ] Process video frames
  - [ ] Return landmarks + handedness
  - [ ] Performance metrics (FPS, latency)
- [ ] Worker communication protocol (messages)
- [ ] Model files → `public/models/` (static serving)
- [ ] Fallback khi WebWorker không khả dụng

#### 6.2 — Gesture Feature Extractor
- [ ] `GestureFeatureExtractor` class
  - [ ] Từ 21 landmarks → extract:
    - [ ] Finger states (extended / curled)
    - [ ] Thumb-index distance (pinch detection)
    - [ ] Palm position + velocity
    - [ ] Hand orientation
    - [ ] Finger angles

#### 6.3 — Gesture State Machine
- [ ] `GestureStateMachine` class
  - [ ] States: IDLE, HOVER, PINCH_START, PINCH_HOLD, DRAGGING, PINCH_RELEASE, SWIPE
  - [ ] Transitions with debounce/threshold
  - [ ] Configurable thresholds
- [ ] Unit tests cho state transitions
- [ ] Test với recorded gesture fixtures

#### 6.4 — Contextual Gesture Mapper
- [ ] `ContextualGestureMapper` class
  - [ ] Map (gesture state + active tool) → InputIntent
  - [ ] Configurable mapping table
  - [ ] Emit intents qua Event Bus

#### 6.5 — Camera UI
- [ ] `CameraView.vue` — camera preview (góc nhỏ)
  - [ ] Toggle camera on/off
  - [ ] Mirror toggle
  - [ ] Camera select (nếu nhiều webcam)
- [ ] `GestureHUD.vue` — gesture feedback overlay
  - [ ] Current gesture state
  - [ ] Active tool
  - [ ] Confidence indicator
  - [ ] Toggle-able
- [ ] Camera permission request flow
- [ ] Camera status indicator trên header

#### 6.6 — Calibration
- [ ] `CalibrationModal.vue`
  - [ ] Step-by-step calibration flow
  - [ ] Camera → Canvas mapping
  - [ ] Pinch threshold calibration
  - [ ] Save calibration to localStorage
  - [ ] Re-calibrate option

#### 6.7 — Integration
- [ ] Gesture Engine → InputIntent → Command Engine
- [ ] Gesture Engine hoạt động **song song** với Mouse (không thay thế)
- [ ] Performance optimization: throttle camera frames
- [ ] Input mode selector: Camera / Mouse / Touch

### Deliverables
- ✅ MediaPipe chạy trong Web Worker
- ✅ 5-8 gestures hoạt động: Pointer, Pinch, Drag, Open Hand, Fist, Swipe, Two-hand Zoom
- ✅ Gesture State Machine ổn định (ít false positives)
- ✅ Calibration flow
- ✅ HUD feedback
- ✅ Camera + Mouse cùng tồn tại
- ✅ Gesture latency < 100ms

### Estimated Time: 10–14 ngày

---

## Phase 7 — Dynamic Geometry (Slider, Locus, Animation)

**Mục tiêu:** Biến phần mềm từ "vẽ hình" thành "khám phá hình học".

### Tasks

#### 7.1 — Slider System
- [ ] `Slider` primitive trong Geometry Core
  - [ ] name, min, max, value, step
  - [ ] Liên kết với objects (ví dụ: radius = slider value)
- [ ] Slider UI component trên canvas
  - [ ] Drag to change value
  - [ ] Input box cho exact value
  - [ ] Animation: play/pause/loop/bounce
  - [ ] Speed control
- [ ] Objects phụ thuộc slider → auto update qua Construction Graph

#### 7.2 — Locus (Quỹ tích)
- [ ] `Locus` construction
  - [ ] Chọn điểm theo dõi + điểm driver
  - [ ] Sample positions khi driver di chuyển
  - [ ] Vẽ curve qua sample points
- [ ] Trace mode: toggle "trace" cho bất kỳ điểm nào
- [ ] Clear trace

#### 7.3 — Animation System
- [ ] Construction animation (fade in, progressive draw)
- [ ] Transform animation (smooth transition)
- [ ] Delete animation (fade out)
- [ ] Animation config (enable/disable, duration, easing)
- [ ] `AnimationConfig` trong Settings

#### 7.4 — Construction Replay
- [ ] `ConstructionSteps.vue` — hiển thị danh sách bước dựng hình
  - [ ] Mỗi bước: mô tả + highlight objects
  - [ ] Previous/Next navigation
  - [ ] Auto-play với speed control
  - [ ] Step indicators
- [ ] Presentation mode:
  - [ ] Fullscreen canvas
  - [ ] Step navigation (arrow keys + buttons)
  - [ ] Auto-hide UI
  - [ ] Exit button

#### 7.5 — Transformation Tools
- [ ] Translation tool (chọn object + vector)
- [ ] Rotation tool (chọn object + center + angle)
- [ ] Reflection tool (chọn object + line of reflection)
- [ ] Homothety tool (chọn object + center + ratio)
- [ ] Mỗi transform → tạo image objects trong graph

### Deliverables
- ✅ Slider hoạt động + animation
- ✅ Locus/Trace hoạt động
- ✅ Construction replay với step-by-step
- ✅ Presentation mode
- ✅ Transformation tools (translate, rotate, reflect, homothety)
- ✅ Smooth animations

### Estimated Time: 7–9 ngày

---

## Phase 8 — 3D Geometry

**Mục tiêu:** Mở rộng sang hình học không gian cho THPT.

### Tasks

#### 8.1 — 3D Primitives
- [ ] `Point3D` — điểm trong không gian
- [ ] `Line3D` — đường thẳng 3D
- [ ] `Segment3D` — đoạn thẳng 3D
- [ ] `Plane` — mặt phẳng (3 điểm, hoặc điểm + vector pháp tuyến)
- [ ] `Vector3D`
- [ ] Unit tests

#### 8.2 — 3D Solids
- [ ] `Prism` — hình lăng trụ
- [ ] `Cube` — hình lập phương
- [ ] `Cuboid` — hình hộp chữ nhật
- [ ] `Pyramid` — hình chóp
- [ ] `Tetrahedron` — tứ diện
- [ ] `Cylinder` — hình trụ
- [ ] `Cone` — hình nón
- [ ] `Sphere` — hình cầu
- [ ] `Frustum` — hình cụt (nâng cao)

#### 8.3 — 3D Measurements
- [ ] Distance point-line (3D)
- [ ] Distance point-plane
- [ ] Distance line-line (skew lines)
- [ ] Angle line-line (3D)
- [ ] Angle line-plane
- [ ] Angle plane-plane (dihedral angle)
- [ ] Volume
- [ ] Surface area

#### 8.4 — 3D Renderer
- [ ] JSXGraph View3D integration (`Canvas3D.vue`)
- [ ] Orbit camera (rotate, zoom, pan)
- [ ] Wireframe / Solid rendering toggle
- [ ] Transparency for planes
- [ ] Cross-section visualization
- [ ] Net (hình khai triển) — flatten 3D → 2D

#### 8.5 — 3D Constructions
- [ ] Section plane (mặt cắt)
- [ ] Cross section (thiết diện)
- [ ] Perpendicular from point to plane
- [ ] Parallel plane through point
- [ ] Intersection of 2 planes → line
- [ ] Projection of point onto plane

#### 8.6 — 2D ↔ 3D
- [ ] Toggle giữa 2D view và 3D view
- [ ] 2D objects vẫn hoạt động trong 3D mode (z=0)
- [ ] Smooth transition animation

### Deliverables
- ✅ 3D primitives + solids hoạt động
- ✅ 3D measurements chính xác
- ✅ 3D renderer với orbit camera
- ✅ Cross-section + Net visualization
- ✅ 2D ↔ 3D toggle mượt mà
- ✅ **Giáo viên có thể dựng hình khối, mặt cắt, tính thể tích**

### Estimated Time: 10–14 ngày

---

## Phase 9 — Curriculum + Teacher Features

**Mục tiêu:** Biến GeoStudio thành công cụ giảng dạy chuyên nghiệp.

### Tasks

#### 9.1 — Curriculum Engine
- [ ] Curriculum data structure (JSON files trong `content/curriculum/`)
- [ ] Grade selector (Lớp 1–12)
- [ ] Tool filtering theo grade (chỉ hiện tools phù hợp)
- [ ] Concept mapping (xem docs.md Section 56)
- [ ] Curriculum browser UI

#### 9.2 — Lesson Builder
- [ ] Create lesson (title, grade, description)
- [ ] Add construction steps with annotations
- [ ] Add text/formula annotations
- [ ] Reorder steps
- [ ] Preview lesson
- [ ] Save lesson to IndexedDB

#### 9.3 — Lesson Player
- [ ] Load lesson
- [ ] Step-by-step navigation
- [ ] Auto-play mode
- [ ] Teacher annotations hiển thị
- [ ] Fullscreen presentation

#### 9.4 — Template Library
- [ ] Pre-built templates:
  - [ ] Basic shapes (tam giác, tứ giác, đường tròn)
  - [ ] Triangle constructions (đường cao, trung tuyến, phân giác)
  - [ ] Circle theorems
  - [ ] 3D solids
- [ ] User-created templates
- [ ] Template browser UI

#### 9.5 — Annotation System
- [ ] Text annotations (free text trên canvas)
- [ ] Formula annotations (KaTeX)
- [ ] Arrow / highlight annotations
- [ ] Step labels ("Bước 1:", "Bước 2:")
- [ ] Hide/show annotations

#### 9.6 — Coordinate Geometry
- [ ] Cartesian plane toggle (hiện/ẩn trục tọa độ)
- [ ] Grid customization (size, style)
- [ ] Plot function: y = f(x)
- [ ] Line equation display
- [ ] Circle equation display
- [ ] Equation input → geometry
- [ ] Geometry → equation display

#### 9.7 — Export Enhancements
- [ ] Export PDF (via jsPDF + SVG)
- [ ] Lesson package (.geo JSON bundle)
- [ ] Share link (URL encoded minimal state)
- [ ] Import .geo files

### Deliverables
- ✅ Curriculum mapping cho 12 lớp
- ✅ Lesson builder + player
- ✅ Template library
- ✅ Annotation system
- ✅ Coordinate geometry + equation ↔ geometry
- ✅ PDF export
- ✅ Lesson sharing

### Estimated Time: 10–14 ngày

---

## Phase 10 — AI + Voice + Advanced Features

**Mục tiêu:** Tích hợp AI và các tính năng nâng cao. Hoàn thiện sản phẩm v1.0.

### Tasks

#### 10.1 — AI Layer
- [ ] Natural language → Geometry Command
  - [ ] "Vẽ tam giác ABC" → CREATE_TRIANGLE
  - [ ] "Dựng đường cao từ A" → CREATE_ALTITUDE
- [ ] LLM integration (API call, không ở client)
- [ ] AI command panel (text input)
- [ ] Safety: AI chỉ tạo commands, không trực tiếp modify state

#### 10.2 — Voice Input (optional)
- [ ] Web Speech API integration
- [ ] Voice → text → AI → command
- [ ] Voice feedback toggle
- [ ] Language: Vietnamese

#### 10.3 — PWA
- [ ] Service worker setup (Nuxt PWA module)
- [ ] Offline support (cache static assets + models)
- [ ] Install prompt
- [ ] App manifest

#### 10.4 — Advanced Constructions
- [ ] Excircle (đường tròn bàng tiếp)
- [ ] Euler line
- [ ] Nine-point circle
- [ ] Regular polygon (n-gon)
- [ ] Copy segment / copy angle
- [ ] Congruent triangle construction

#### 10.5 — Settings Page
- [ ] `settings.vue` — comprehensive settings
  - [ ] Language (vi/en)
  - [ ] Theme (light/dark/high-contrast)
  - [ ] Snap settings
  - [ ] Animation settings
  - [ ] Keyboard shortcuts customization
  - [ ] Camera settings
  - [ ] Auto-save interval
  - [ ] Performance settings

#### 10.6 — Mobile Optimization
- [ ] Responsive layout cho tablet
- [ ] Touch optimization (larger hit areas)
- [ ] Pinch-to-zoom native
- [ ] Bottom sheet panels cho mobile

#### 10.7 — Performance & Polish
- [ ] Bundle size optimization (dynamic imports)
- [ ] Canvas rendering optimization (dirty regions)
- [ ] Loading states cho heavy operations
- [ ] Error boundaries
- [ ] Comprehensive error messages (i18n)
- [ ] Onboarding tour (first-time user)

#### 10.8 — Documentation
- [ ] User guide (Tiếng Việt)
- [ ] API documentation (cho plugin developers)
- [ ] Contributing guide
- [ ] README.md update

### Deliverables
- ✅ AI text-to-geometry hoạt động
- ✅ PWA installable + offline
- ✅ Advanced constructions
- ✅ Settings page
- ✅ Mobile/Tablet responsive
- ✅ Performance optimized
- ✅ User documentation
- ✅ **GeoStudio v1.0 🎉**

### Estimated Time: 14–21 ngày

---

## Tổng ước tính thời gian

| Phase | Nội dung                          | Thời gian      |
| ----- | --------------------------------- | -------------- |
| 0     | Setup & Specification             | 3–4 ngày       |
| 1     | Geometry Core                     | 5–7 ngày       |
| 2     | Command Engine                    | 4–5 ngày       |
| 3     | 2D Renderer + Mouse               | 7–10 ngày      |
| 4     | Construction Engine               | 7–9 ngày       |
| 5     | Snap + Measurement + Export       | 6–8 ngày       |
| 6     | Gesture Engine                    | 10–14 ngày     |
| 7     | Dynamic Geometry                  | 7–9 ngày       |
| 8     | 3D Geometry                       | 10–14 ngày     |
| 9     | Curriculum + Teacher              | 10–14 ngày     |
| 10    | AI + Voice + Polish               | 14–21 ngày     |
|       | **TỔNG**                          | **83–115 ngày** |

> **Ghi chú:** Thời gian ước tính cho 1 developer làm full-time. Có thể song song hóa một số phases (ví dụ Phase 7 + Phase 8).

---

## Milestones chính

```text
🏁 M1 — "Hello Canvas"          sau Phase 3
   → Vẽ hình cơ bản bằng chuột, undo/redo, save/load
   → Demo-able cho stakeholders

🏁 M2 — "Smart Geometry"        sau Phase 5
   → Dựng hình, snap, đo lường, export
   → Usable cho giáo viên (mouse-only)

🏁 M3 — "Gesture Control"       sau Phase 6
   → Điều khiển bằng tay qua camera
   → WOW factor, press-worthy

🏁 M4 — "3D World"              sau Phase 8
   → Hình học không gian
   → Phục vụ THPT

🏁 M5 — "Teacher Platform"      sau Phase 9
   → Bài giảng, curriculum, presentation
   → Sản phẩm hoàn chỉnh

🏁 M6 — "v1.0"                  sau Phase 10
   → AI, voice, PWA, polish
   → Production ready
```

---

## Nguyên tắc phát triển

1. **Test First**: Viết unit tests TRƯỚC khi implement (đặc biệt Geometry Core)
2. **Mouse First**: Mọi tính năng phải hoạt động với mouse trước khi thêm gesture
3. **Foundation First**: Đừng nhảy tới feature mới khi foundation chưa vững
4. **Ship Early**: Deploy lên Vercel sau mỗi Phase, lấy feedback sớm
5. **Degenerate Cases**: Luôn xử lý edge cases trong geometry (song song, trùng, suy biến)
6. **i18n from Day 1**: Mọi string phải qua i18n, không hard-code
7. **No Regression**: CI phải chạy toàn bộ test suite trước khi merge
8. **Clean Imports**: Không import trực tiếp giữa packages — dùng barrel exports
9. **Single Responsibility**: Mỗi file ≤ 300 dòng, mỗi function ≤ 50 dòng
10. **Document Decisions**: Ghi lại ADR (Architecture Decision Records) cho mọi quyết định lớn

---

## Technical Debt Tracking

Ghi lại tech debt phát sinh trong quá trình phát triển:

| ID | Phase | Mô tả | Severity | Kế hoạch xử lý |
|----|-------|--------|----------|------------------|
| TD-001 | — | (ghi khi phát sinh) | Low/Med/High | Phase X |

### Ví dụ tech debt thường gặp

```text
- "TODO" comments trong code → dọn trước mỗi milestone
- Hardcoded values → chuyển thành config/constant
- Missing error handling → bổ sung ở polish phase
- Test coverage < 80% cho module → bổ sung tests
- Type assertions (as any) → fix type properly
- Duplicated logic → extract shared utility
```

### Quy tắc

1. Mỗi PR nếu tạo tech debt → phải ghi vào bảng trên
2. Trước mỗi Milestone (M1-M6) → review và xử lý High severity debt
3. Không merge PR với `as any` trừ khi có comment giải thích
4. Tech debt review meeting sau mỗi 2 phases
