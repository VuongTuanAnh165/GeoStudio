Dự án này được xem như **một "hệ điều hành cho việc dạy hình học"**, chứ không phải một website vẽ hình có thêm camera.

Điểm quyết định thành bại là: **đừng xây "gesture → vẽ pixel"**. Hãy xây:

> **Gesture / Mouse / Touch / Pen → Intent → Geometry Command → Geometry Engine → Render**

Khi đó camera chỉ là **một phương thức nhập liệu**. Sau này bạn có thể thêm chuột, bút cảm ứng, giọng nói, AI… mà không phải đập lại phần hình học.

Chương trình Toán phổ thông Việt Nam cũng xác định mạch **"Hình học và Đo lường" từ lớp 1 đến lớp 12**, đồng thời chương trình được thiết kế theo hướng mở rộng và nâng cao dần. ([Bộ Giáo dục và Đào tạo][1])

---

# 1. Tầm nhìn sản phẩm

> **GeoStudio**
>
> Interactive Geometry Teaching Platform
>
> _Bộ công cụ chuyên nghiệp cho giáo viên — Bảng vẽ hình học — Tạo/dựng hình học — Không gian hình học_

**Sứ mệnh:** Cung cấp cho giáo viên Toán Việt Nam một nền tảng hình học tương tác chuyên nghiệp, miễn phí, hoạt động hoàn toàn trên trình duyệt, hỗ trợ từ lớp 1 đến lớp 12, mở rộng tốt sang 3D, và cho phép điều khiển bằng cử chỉ tay qua camera.

**Đối tượng sử dụng chính:**
- Giáo viên Toán phổ thông (Tiểu học, THCS, THPT)
- Giáo viên dạy thêm, gia sư
- Sinh viên sư phạm Toán
- Học sinh tự học (đối tượng phụ)

Người giáo viên đứng trước màn hình:

```text
             CAMERA
                │
                ▼
       ┌─────────────────┐
       │  Hand Tracking   │
       │  Gesture Engine  │
       └────────┬────────┘
                │
                ▼
        Input / Intent Layer
                │
                ▼
       ┌───────────────────┐
       │  Geometry Engine  │
       └─────────┬─────────┘
                 │
         ┌───────┴────────┐
         ▼                ▼
     2D Renderer       3D Renderer
         │                │
         └───────┬────────┘
                 ▼
          BẢNG HÌNH HỌC
```

Ví dụ giáo viên:

```text
☝️ chọn điểm A
☝️ chọn điểm B
```

→ hệ thống tạo **Point A, Point B**

Sau đó:

```text
✌️ + kéo A → B
```

→ tạo **đoạn AB**

Sau đó:

```text
gesture "perpendicular"
       +
chọn AB
       +
chọn C
```

→ hệ thống dựng **đường thẳng qua C vuông góc AB**.

Hình được tạo phải là **hình học thực**, không phải nét vẽ.

---

# 2. Nguyên tắc kiến trúc quan trọng nhất

## Không được làm thế này

```text
Camera
 ↓
Nhận dạng tay
 ↓
Vẽ canvas
 ↓
Lưu canvas
```

Vì vài năm sau bạn sẽ gặp:

> "Làm sao biết đoạn này vuông góc?"

> "Làm sao kéo điểm A thì đường cao tự chạy?"

> "Làm sao tính diện tích?"

> "Làm sao dựng tiếp đường tròn ngoại tiếp?"

> "Làm sao chuyển hình 2D thành hình 3D?"

Lúc đó kiến trúc sẽ rất khó cứu.

---

## Phải làm thế này

```text
                 INPUT
       ┌──────────┼──────────┐
       │          │          │
    Camera      Mouse       Touch
       │          │          │
       └──────────┼──────────┘
                  ▼
           Input Normalizer
                  ▼
            Intent Engine
                  ▼
          Command Dispatcher
                  ▼
          Geometry Engine
                  ▼
         Construction Graph
                  ▼
        ┌─────────┴─────────┐
        ▼                   ▼
    2D Renderer          3D Renderer
```

Ví dụ:

```ts
{
  command: "CREATE_PERPENDICULAR_LINE",
  args: {
    throughPoint: "C",
    baseLine: "AB"
  }
}
```

Geometry Engine hiểu:

```text
C
│
│
│
└──────────
    AB
```

Và tự tính toán.

---

# 3. Geometry Engine — trái tim của hệ thống

Đây là phần **phải thiết kế chuẩn ngay từ ngày đầu**.

Chia Geometry Engine thành 7 tầng:

```text
geometry-core/
│
├── primitives/
├── constructions/
├── constraints/
├── measurements/
├── transformations/
├── intersections/
└── solver/
```

---

# 4. Hệ thống đối tượng hình học

Không tạo hàng trăm class riêng lẻ. Nên có một **Geometry Object Model** thống nhất.

```ts
type GeometryObject =
  | Point
  | Line
  | Segment
  | Ray
  | Circle
  | Arc
  | Polygon
  | Vector
  | Plane
  | Solid
  | ...
```

Mỗi object phải có:

```ts
{
  id,
  type,
  parents,
  definition,
  constraints,
  style,
  metadata,
  dimension    // 2 | 3 — cho phép mở rộng 3D
}
```

Ví dụ điểm:

```json
{
  "id": "P1",
  "type": "point",
  "dimension": 2,
  "definition": {
    "kind": "free",
    "x": 100,
    "y": 200
  }
}
```

Đường thẳng:

```json
{
  "id": "L1",
  "type": "line",
  "dimension": 2,
  "definition": {
    "kind": "through-points",
    "p1": "A",
    "p2": "B"
  },
  "parents": ["A", "B"]
}
```

Đường vuông góc:

```json
{
  "id": "L2",
  "type": "line",
  "dimension": 2,
  "definition": {
    "kind": "perpendicular-through-point",
    "line": "L1",
    "point": "C"
  },
  "parents": ["L1", "C"]
}
```

Như vậy khi `C` di chuyển:

```text
C thay đổi
   ↓
L2 tự tính lại
   ↓
mọi object phụ thuộc L2
   ↓
tự cập nhật
```

Đây gọi là **dependency/construction graph**.

---

# 5. Construction Graph — Chi tiết kỹ thuật

Construction Graph là DAG (Directed Acyclic Graph) quản lý quan hệ phụ thuộc giữa các đối tượng hình học. Đây là **xương sống** của toàn bộ Dynamic Geometry.

## 5.1 Cấu trúc Node

```ts
interface ConstructionNode {
  id: string
  object: GeometryObject
  parents: string[]          // các node mà node này phụ thuộc
  children: string[]         // các node phụ thuộc node này
  computeOrder: number       // thứ tự tính toán (topological sort)
  isDirty: boolean           // cần tính lại?
  lastComputed: number       // timestamp
}
```

## 5.2 Quy tắc bất biến

1. **Không cycle**: Graph phải là DAG. Trước khi thêm edge mới, phải kiểm tra cycle bằng DFS/BFS.
2. **Topological sort**: Khi update, phải tính lại theo đúng thứ tự topological — parent trước, child sau.
3. **Dirty propagation**: Khi một node thay đổi, tất cả descendants đều được đánh dấu dirty.
4. **Lazy evaluation**: Chỉ tính lại các node dirty khi cần render, không tính ngay khi đánh dấu.
5. **Batch update**: Nhiều thay đổi trong cùng một thao tác (ví dụ move + constraint resolve) được gom thành một batch, chỉ tính lại graph một lần.

## 5.3 Ví dụ

```text
A (free point)
│
├── B (free point)
│   │
│   └── AB (segment: A, B)
│       │
│       ├── M (midpoint: AB)
│       │
│       └── L (perpendicular bisector: AB)
│           │
│           └── P (intersection: L, Circle_O)
│
└── C (free point)
    │
    └── AC (segment: A, C)
```

Khi kéo A:
1. A.isDirty = true
2. Propagate: AB, M, L, P, AC đều dirty
3. Topological sort: A → B → AB → M → L → P → C → AC
4. Tính lại theo thứ tự
5. Render một lần

## 5.4 Xử lý xóa

Khi xóa một object:
- **Cascade delete**: Xóa tất cả dependants (hỏi user xác nhận)
- **Hoặc Orphan**: Chuyển dependants thành free objects (mất ràng buộc)
- User được chọn hành vi mặc định trong Settings

---

# 6. Bộ đối tượng phải hướng tới

Để phục vụ lớp 1 → 12, thiết kế taxonomy ngay từ đầu.

## A. Cơ bản

```text
Point
Segment
Line
Ray
Polyline
Polygon
Circle
Arc
Sector
Vector
Angle
```

## B. Điểm đặc biệt

```text
Midpoint
Intersection
Projection
Foot
Centroid
Circumcenter
Incenter
Excenter
Orthocenter
Reflection Point
Rotation Point
Translation Point
```

## C. Đường đặc biệt

```text
Parallel Line
Perpendicular Line
Perpendicular Bisector
Angle Bisector
Median
Altitude
Tangent
Secant
Center Line
Euler Line
```

## D. Tam giác

```text
Triangle
Equilateral Triangle
Isosceles Triangle
Right Triangle
Scalene Triangle

Circumcircle
Incircle
Excircle

Median
Altitude
Angle Bisector
Perpendicular Bisector

Orthocenter
Circumcenter
Incenter
Centroid
```

## E. Tứ giác

```text
Quadrilateral
Trapezoid
Parallelogram
Rectangle
Rhombus
Square
Kite
```

và các tính chất liên quan.

## F. Đường cong (Coordinate Geometry)

```text
Parabola
Ellipse
Hyperbola
Parametric Curve
Conic Section
Function Graph
```

## G. Hình không gian 3D

```text
Point3D
Line3D
Segment3D
Ray3D
Plane
Prism
Cube
Cuboid (Rectangular Prism)
Pyramid
Tetrahedron
Cylinder
Cone
Sphere
Frustum
Torus (nâng cao)
```

---

# 7. Các phép dựng hình

Đây phải là **Construction Registry**, không hard-code rải rác.

Ví dụ:

```ts
constructionRegistry.register({
  id: "perpendicular-line",
  name: { vi: "Đường vuông góc", en: "Perpendicular Line" },
  inputs: [
    { type: "point", label: "throughPoint" },
    { type: "line",  label: "baseLine" }
  ],
  output: "line",
  validate: (inputs) => { /* kiểm tra inputs hợp lệ */ },
  compute: (inputs) => { /* tính toán kết quả */ }
})
```

Sau đó có thể mở rộng:

```text
Construct
├── Point
├── Midpoint
├── Intersection
├── Parallel
├── Perpendicular
├── Bisector
├── Tangent
├── Circumcircle
├── Incircle
├── Copy Segment
├── Copy Angle
├── Regular Polygon
├── Reflection
├── Rotation
├── Translation
├── Homothety
├── Locus
├── Section Plane (3D)
├── Cross Section (3D)
├── Net (3D khai triển → 2D)
└── ...
```

Điểm hay là sau này chỉ việc thêm:

```text
new construction
```

chứ không sửa camera engine.

---

# 8. Constraint Engine

Đây là phần giúp hình **"thông minh"**.

Hỗ trợ:

```text
Coincident
Collinear
Parallel
Perpendicular
Equal Length
Equal Angle
Fixed Length
Fixed Angle
Point On Line
Point On Circle
Tangent
Concentric
Symmetry
Midpoint
Horizontal
Vertical
```

Ví dụ:

```text
A──────B
```

constraint:

```text
length(AB) = 5
```

Giáo viên kéo B:

```text
A────────B
```

hệ thống vẫn đảm bảo:

```text
AB = 5
```

Đây là sự khác biệt giữa:

> **phần mềm hình học**

và

> **phần mềm vẽ hình**.

### Constraint Solver Strategy

Sử dụng **iterative relaxation** hoặc **Newton-Raphson** cho hệ constraints:

```text
1. Thu thập tất cả constraints đang active
2. Xác định bậc tự do (DOF) của hệ
3. Nếu over-constrained → báo lỗi / highlight conflict
4. Nếu under-constrained → cho phép tự do
5. Giải hệ phi tuyến bằng iterative method
6. Nếu không hội tụ sau N bước → rollback + thông báo
```

---

# 9. Error Handling & Edge Cases trong Geometry

Geometry Engine **phải xử lý tốt các trường hợp suy biến** (degenerate cases):

```text
Hai đường thẳng song song → không có giao điểm
   → trả về null, không crash

Đường tròn bán kính 0
   → cảnh báo user, không tạo

3 điểm thẳng hàng → không dựng được đường tròn ngoại tiếp
   → thông báo "3 điểm thẳng hàng, không tạo được circumcircle"

Hai điểm trùng nhau → không tạo được đoạn thẳng
   → bỏ qua hoặc thông báo

Giá trị rất lớn / rất nhỏ → overflow
   → clamp to reasonable range

Floating point precision
   → dùng EPSILON = 1e-10 cho so sánh
   → abs(a - b) < EPSILON thay vì a === b
```

### Numerical Tolerance Configuration

```ts
const GEOMETRY_TOLERANCE = {
  POINT_COINCIDENCE: 1e-10,    // hai điểm trùng nhau
  COLLINEARITY: 1e-8,          // ba điểm thẳng hàng
  ANGLE_ZERO: 1e-8,            // góc bằng 0
  LENGTH_ZERO: 1e-10,          // độ dài bằng 0
  SNAP_DISTANCE: 5,            // pixel — khoảng snap
  CONSTRAINT_TOLERANCE: 1e-6,  // sai số constraint solver
  MAX_SOLVER_ITERATIONS: 100   // giới hạn vòng lặp solver
}
```

---

# 10. Đừng phụ thuộc vào tọa độ pixel

Không nên lưu:

```text
A = x: 300, y: 200
B = x: 500, y: 200
```

như toàn bộ ý nghĩa của hình.

Nên lưu:

```text
A = Point
B = Point

AB = Segment(A,B)

L = Perpendicular(C, AB)

M = Midpoint(A,B)
```

Tức là:

> **lưu ý nghĩa toán học, không lưu ảnh của hình.**

Hệ tọa độ nội bộ nên dùng **tọa độ toán học** (math coordinates), renderer chịu trách nhiệm chuyển đổi sang tọa độ screen:

```text
Math Coordinates ←→ Screen Coordinates
  (y tăng lên)       (y tăng xuống)
```

---

# 11. Toàn bộ hệ thống thao tác phải có Command

Chuẩn hóa command:

```text
CREATE_POINT
MOVE_POINT
DELETE_OBJECT

CREATE_LINE
CREATE_SEGMENT
CREATE_RAY

CREATE_CIRCLE
CREATE_ARC

CREATE_TRIANGLE
CREATE_POLYGON

CREATE_PARALLEL
CREATE_PERPENDICULAR
CREATE_BISECTOR
CREATE_MEDIAN
CREATE_ALTITUDE

CREATE_INTERSECTION
CREATE_MIDPOINT

ROTATE
REFLECT
TRANSLATE
SCALE
HOMOTHETY

MEASURE_DISTANCE
MEASURE_ANGLE
MEASURE_AREA
MEASURE_PERIMETER

SHOW_LABEL
HIDE_LABEL
TOGGLE_VISIBILITY

SET_STYLE
ADD_CONSTRAINT
REMOVE_CONSTRAINT

GROUP_OBJECTS
UNGROUP_OBJECTS
```

Sau đó:

```text
Mouse
 ─┐
Touch
 ─┼──→ Command
Camera
 ─┤
Voice
 ─┤
Keyboard
 ─┘
```

### Command Interface

```ts
interface GeometryCommand {
  id: string             // UUID
  type: string           // e.g. "CREATE_POINT"
  args: Record<string, unknown>
  timestamp: number
  source: 'mouse' | 'touch' | 'gesture' | 'keyboard' | 'voice' | 'ai' | 'script'
  undoable: boolean
  
  execute(state: GeometryState): GeometryState
  undo(state: GeometryState): GeometryState
  validate(state: GeometryState): ValidationResult
}
```

---

# 12. Event System (Event Bus)

Toàn bộ hệ thống cần một **Event Bus** để giải phóng sự phụ thuộc trực tiếp giữa các module:

```ts
type GeoEvent =
  // Geometry events
  | { type: 'object:created',   payload: { object: GeometryObject } }
  | { type: 'object:moved',     payload: { id: string, from: Position, to: Position } }
  | { type: 'object:deleted',   payload: { id: string } }
  | { type: 'object:selected',  payload: { ids: string[] } }
  | { type: 'object:deselected', payload: { ids: string[] } }
  | { type: 'object:styleChanged', payload: { id: string, style: StyleProps } }
  
  // Construction events
  | { type: 'construction:started',   payload: { constructionType: string } }
  | { type: 'construction:completed', payload: { objects: GeometryObject[] } }
  | { type: 'construction:cancelled', payload: {} }
  
  // Command events
  | { type: 'command:executed', payload: { command: GeometryCommand } }
  | { type: 'command:undone',  payload: { command: GeometryCommand } }
  | { type: 'command:redone',  payload: { command: GeometryCommand } }
  
  // Input events
  | { type: 'gesture:recognized', payload: { gesture: GestureResult } }
  | { type: 'tool:changed',      payload: { tool: ToolType } }
  
  // Document events
  | { type: 'document:saved',   payload: { documentId: string } }
  | { type: 'document:loaded',  payload: { document: GeoDocument } }
  | { type: 'document:exported', payload: { format: string } }
  
  // View events
  | { type: 'view:zoomed',   payload: { scale: number } }
  | { type: 'view:panned',   payload: { offset: Position } }
  | { type: 'view:switched', payload: { mode: '2d' | '3d' } }
```

### Event Bus Implementation

```ts
class EventBus {
  private listeners: Map<string, Set<Function>>

  on(event: string, handler: Function): () => void  // returns unsubscribe
  off(event: string, handler: Function): void
  emit(event: GeoEvent): void
  once(event: string, handler: Function): void
}
```

Mỗi engine/module chỉ giao tiếp qua Event Bus, không gọi trực tiếp:

```text
Gesture Engine ──emit──→ Event Bus ──notify──→ Command Engine
Command Engine ──emit──→ Event Bus ──notify──→ Geometry Core
Geometry Core  ──emit──→ Event Bus ──notify──→ Renderer
Renderer       ──emit──→ Event Bus ──notify──→ UI Components
```

---

# 13. Gesture Engine

MediaPipe hiện cung cấp **Hand Landmarker cho web/JavaScript**, trả về landmarks của bàn tay và hỗ trợ chế độ video/live camera; kết quả có 21 landmarks cho mỗi bàn tay. Google cũng cung cấp Gesture Recognizer riêng cho nhận diện gesture thời gian thực. ([Google AI for Developers][2])

Package web hiện tại là:

```bash
npm install @mediapipe/tasks-vision
```

([Google AI for Developers][2])

**Không sử dụng Gesture Recognizer có sẵn làm toàn bộ hệ thống gesture**. Nó chỉ nên là tầng thấp.

---

# 14. Gesture Engine nên chia thành 4 tầng

```text
Camera Frame
     ↓
Hand Landmarks
     ↓
Gesture Features
     ↓
Gesture State
     ↓
Intent
```

Ví dụ:

```text
21 landmarks
     ↓
Index finger extended
Thumb/index distance
Palm velocity
Finger angles
Hand rotation
     ↓
PINCH
     ↓
SELECT / DRAG
```

---

# 15. Gesture không nên tương đương trực tiếp với hành động

Ví dụ:

```text
🤏 PINCH
```

không có nghĩa luôn luôn là:

```text
SELECT
```

Mà phải phụ thuộc **context**.

```text
Tool = Select
Pinch → Select

Tool = Draw Point
Pinch → Place Point

Tool = Circle
Pinch → Set center

Tool = Eraser
Pinch → Erase
```

Đây là **Contextual Gesture System**.

---

# 16. Bộ gesture ban đầu

Thiết kế khoảng 10–15 gesture semantic, nhưng chỉ bật một số ít trong MVP.

### Pointer

```text
☝️
```

→ con trỏ.

### Pinch

```text
🤏
```

→ select / grab / confirm.

### Drag

```text
🤏 + di chuyển
```

→ kéo.

### Open hand

```text
🖐️
```

→ neutral / cancel tùy context.

### Fist

```text
✊
```

→ delete/erase khi ở erase mode.

### Swipe

```text
← → ↑ ↓
```

→ chuyển trang / slide / view.

### Two hands pinch

```text
🤏      🤏
```

→ zoom.

### Hai tay xoay

→ rotate canvas / 3D.

Những gesture phức tạp hơn nên để giai đoạn sau.

---

# 17. Cực kỳ quan trọng: Gesture State Machine

Không được:

```ts
if (gesture === 'PINCH') {
  select()
}
```

vì camera liên tục gửi hàng chục frame/giây.

Phải có:

```text
IDLE
 ↓
HOVER
 ↓
PINCH_START
 ↓
PINCH_HOLD
 ↓
DRAGGING
 ↓
PINCH_RELEASE
 ↓
IDLE
```

Tương tự:

```text
DRAW_START
DRAWING
DRAW_END
```

### State Machine Implementation

```ts
interface GestureStateMachine {
  currentState: GestureState
  transition(event: GestureEvent): GestureState
  
  // Debounce / threshold configuration
  config: {
    pinchThreshold: number       // khoảng cách ngón để trigger pinch
    pinchHoldDuration: number    // ms giữ pinch trước khi thành HOLD
    dragThreshold: number        // pixel di chuyển để thành DRAG
    releaseDebounce: number      // ms debounce khi release
    swipeVelocityMin: number     // tốc độ tối thiểu cho swipe
    doublePinchWindow: number    // ms cửa sổ double pinch
  }
}
```

Điều này sẽ loại bỏ phần lớn lỗi:

> "Tôi chưa muốn chọn mà nó cứ click."

---

# 18. MediaPipe phải chạy Web Worker

Đây là một điểm phải làm **ngay từ đầu**.

Google ghi rõ các hàm `detect()` / `detectForVideo()` của Hand Landmarker chạy đồng bộ và có thể block UI thread; có thể đưa inference sang Web Worker để tránh tình trạng này. ([Google AI for Developers][2])

Kiến trúc:

```text
Main Thread
│
├── UI
├── Geometry
├── Rendering
│
└── Camera
      │
      ▼
 Web Worker
      │
      └── MediaPipe
             │
             ▼
        Hand Landmarks
```

### Worker Communication Protocol

```ts
// Main Thread → Worker
type WorkerMessage =
  | { type: 'init', config: MediaPipeConfig }
  | { type: 'process_frame', frame: ImageBitmap, timestamp: number }
  | { type: 'update_config', config: Partial<MediaPipeConfig> }
  | { type: 'destroy' }

// Worker → Main Thread
type WorkerResponse =
  | { type: 'ready' }
  | { type: 'landmarks', data: HandLandmarks[], timestamp: number, latencyMs: number }
  | { type: 'error', message: string }
  | { type: 'performance', fps: number, avgLatency: number }
```

Đừng để camera tracking làm lag bảng hình học.

---

# 19. Lớp "Smart Drawing"

Đây là nơi dự án bắt đầu thật sự mạnh.

Giáo viên có thể chọn:

```text
✎ Free Draw
```

và vẽ:

```text
  /\
 /  \
/____\
```

hệ thống đoán:

```text
Triangle
```

Nhưng **freehand recognition không được là lõi**.

Lõi phải là:

```text
Tool = Triangle
```

rồi gesture xác định các điểm.

Tức là:

> AI/recognizer giúp "hiểu" nét vẽ, nhưng Geometry Engine quyết định hình cuối cùng.

---

# 20. Smart Snap

Phải xây từ sớm.

Khi giáo viên di chuyển điểm:

```text
         C
         │
         │
A────────┼────────B
```

con trỏ gần:

```text
midpoint
intersection
line
circle
grid
```

thì hiện:

```text
SNAP → MIDPOINT
SNAP → INTERSECTION
SNAP → PERPENDICULAR
SNAP → GRID
```

Có thể dùng ưu tiên:

```text
Intersection
   ↓
Existing Point
   ↓
Special Point
   ↓
Line
   ↓
Grid
```

### Snap Configuration

```ts
interface SnapConfig {
  enabled: boolean
  gridSnap: boolean
  pointSnap: boolean
  lineSnap: boolean
  intersectionSnap: boolean
  midpointSnap: boolean
  perpendicularSnap: boolean
  
  snapRadius: number          // pixel
  gridSize: number            // math units
  showSnapIndicator: boolean  // visual feedback
  snapSound: boolean          // audio feedback (optional)
}
```

---

# 21. Hệ thống Undo/Redo dạng Command

Không snapshot toàn bộ canvas mỗi lần.

Dùng:

```text
Command History

AddPoint
CreateLine
MovePoint
CreateCircle
CreatePerpendicular
...
```

Sau đó:

```text
Undo
Redo
Replay
```

Điều này còn mở ra khả năng cực hay:

> giáo viên có thể **replay từng bước dựng hình**.

Ví dụ:

```text
Bước 1: Tạo A
Bước 2: Tạo B
Bước 3: Tạo AB
Bước 4: Dựng trung trực AB
Bước 5: Tạo O
Bước 6: Vẽ đường tròn
```

### Command History Implementation

```ts
interface CommandHistory {
  undoStack: GeometryCommand[]
  redoStack: GeometryCommand[]
  maxHistory: number          // giới hạn (mặc định 200)
  
  execute(command: GeometryCommand): void
  undo(): GeometryCommand | null
  redo(): GeometryCommand | null
  
  // Replay support
  getSteps(): GeometryCommand[]
  replayTo(stepIndex: number): void
  
  // Batch operations
  beginBatch(label: string): void
  endBatch(): void            // gom nhiều commands thành 1 undo step
}
```

Rất phù hợp giảng dạy.

---

# 22. Animation & Transition System

Đây là tính năng quan trọng cho giảng dạy mà cần thiết kế từ sớm:

### Construction Animation

Khi tạo một đối tượng mới, nó không nên xuất hiện đột ngột mà nên có animation:

```text
Point: fade in + scale from 0 → 1
Line: draw from start → end (progressive)
Circle: draw arc 0° → 360° (progressive)
Polygon: draw edges tuần tự
```

### Transform Animation

Khi thực hiện phép biến đổi:

```text
Rotation 60°: animate từ 0° → 60°
Translation: animate di chuyển smooth
Reflection: animate lật qua trục
```

### Transition Configuration

```ts
interface AnimationConfig {
  enabled: boolean
  duration: number           // ms (mặc định 300)
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'
  constructionAnimation: boolean   // animation khi tạo object
  transformAnimation: boolean      // animation khi biến đổi
  deleteAnimation: boolean         // fade out khi xóa
  replaySpeed: number              // tốc độ replay (1x, 2x, 0.5x)
}
```

### Step-by-step Presentation Mode

Giáo viên có thể:
1. Tạo construction sequence
2. Bấm Next/Previous để đi qua từng bước
3. Mỗi bước có animation mượt mà
4. Có thể thêm chú thích (annotation) cho mỗi bước
5. Auto-play mode với tốc độ có thể điều chỉnh

---

# 23. Renderer

### 2D

**JSXGraph + SVG**

JSXGraph hiện là thư viện interactive geometry dành cho trình duyệt, hỗ trợ hình học Euclid/projective 2D và 3D, transformation, point, line, polygon, circle..., chạy phía client và có giấy phép LGPL/MIT. ([JSXGraph][3])

Nó cũng hỗ trợ các phép biến đổi như:

```text
translation
rotation
reflection
scale
shear
```

([JSXGraph][4])

### 3D

Ban đầu **chưa cần Three.js**.

JSXGraph hiện đã có `View3D`, `Point3D`, `Line3D`, `Plane3D`, `Sphere3D`... ([JSXGraph][5])

Sau này nếu muốn 3D đẹp hơn:

```text
Geometry Core
     │
     ├── JSXGraph 2D
     │
     ├── JSXGraph 3D
     │
     └── Three.js Renderer
```

### Renderer Abstraction Layer

```ts
interface GeometryRenderer {
  init(container: HTMLElement): void
  destroy(): void
  
  // Object rendering
  renderObject(object: GeometryObject): void
  removeObject(id: string): void
  updateObject(id: string, changes: Partial<GeometryObject>): void
  
  // View control
  setViewport(bounds: BoundingBox): void
  zoom(factor: number, center?: Point): void
  pan(offset: Vector): void
  
  // Interaction
  hitTest(screenPos: Point): GeometryObject | null
  getScreenPosition(mathPos: Point): Point
  getMathPosition(screenPos: Point): Point
  
  // Export
  exportSVG(): string
  exportPNG(): Promise<Blob>
}
```

Như vậy không khóa kiến trúc vào một renderer cụ thể.

---

# 24. Vì sao không dùng GeoGebra làm nền?

GeoGebra cực mạnh, và API embedding tồn tại. ([GeoGebra][6])

Nhưng **không chọn nó làm lõi của sản phẩm mới**.

Lý do là license của GeoGebra có những điều kiện khác nhau giữa source code, web services/materials và mục đích thương mại; trang license chính thức nói rõ việc sử dụng cho mục đích thương mại cần license phù hợp. ([GeoGebra][7])

Trong khi JSXGraph có dual license LGPL/MIT, với MIT phù hợp hơn cho hướng xây ứng dụng riêng. ([JSXGraph][3])

---

# 25. Mathematical Engine

Thêm:

```bash
npm install mathjs
```

Math.js hỗ trợ expression parsing, symbolic computation và các kiểu số/matrix/fraction/unit, chạy được trong browser và Node.js. ([Math.js][8])

Dùng cho:

```text
distance
angle
vector
matrix
coordinate
equation
area
volume
slope
intersection
determinant
cross product
dot product
```

Không để logic hình học phụ thuộc hoàn toàn vào mathjs.

```text
Geometry Core
      │
      ├── custom geometric algorithms
      │
      └── mathjs (utility cho linear algebra, expression)
```

---

# 26. Công thức / biểu thức toán

Dùng **KaTeX**.

Ví dụ:

```text
S = πr²
```

hay:

```text
\vec{AB} = (x_B-x_A, y_B-y_A)
```

KaTeX có browser API và render trực tiếp trong trình duyệt. ([KaTeX][9])

### Tích hợp với Geometry Engine

Khi hiển thị measurement, tự động format:

```text
|AB| = 5.00
∠ABC = 60°00'
S△ABC = 12.50
V_khối = 125.00
```

Hỗ trợ hiển thị:
- Measurement labels trên canvas
- Formula panel bên cạnh
- Step-by-step proof/solution (tương lai)

---

# 27. Hệ 3D phải nằm trong data model ngay từ đầu

Đừng làm:

```text
2D trước

sau này:
3D = viết lại toàn bộ
```

Ngay từ đầu object model phải cho phép:

```ts
// Base types
type Coords2D = { x: number, y: number }
type Coords3D = { x: number, y: number, z: number }
type Coords = Coords2D | Coords3D

// Objects sử dụng generic
interface GeoPoint<D extends 2 | 3 = 2> {
  id: string
  type: 'point'
  dimension: D
  coords: D extends 2 ? Coords2D : Coords3D
}
```

Các thao tác dùng abstraction chung:

```text
Transform
Measure
Intersection
Constraint
Construction
```

---

# 28. Bộ 3D cần hướng tới

```text
Point3D
Line3D
Segment3D
Ray3D
Plane

Prism
Cube
Cuboid
Pyramid
Tetrahedron
Cylinder
Cone
Sphere
Frustum

Section Plane
Cross Section
Net (hình khai triển)
```

Các phép đo:

```text
Length
Angle
Area
Surface Area
Volume
Distance Point-Line
Distance Point-Plane
Distance Line-Line
Angle Line-Line
Angle Line-Plane
Angle Plane-Plane
Dihedral Angle
```

và quan hệ:

```text
Parallel
Perpendicular
Intersect
Skew
Coplanar
```

---

# 29. Hệ biến đổi

Ngay từ đầu:

```text
Translation
Rotation (2D: around point, 3D: around axis)
Reflection (2D: across line, 3D: across plane)
Scaling
Homothety
Symmetry (point symmetry, axial symmetry)
Projection (orthogonal, perspective)
```

Ví dụ:

```text
Triangle ABC
       │
       ▼
Rotation 60°
       │
       ▼
Triangle A'B'C'
```

Điểm này rất cần cho THCS/THPT.

### Transform as Construction

Mỗi phép biến đổi tạo ra objects mới trong Construction Graph:

```ts
interface Transform {
  type: 'translation' | 'rotation' | 'reflection' | 'scaling' | 'homothety'
  inputObjects: string[]
  parameters: TransformParams
  outputObjects: string[]   // objects mới, phụ thuộc vào input
}
```

Khi input thay đổi → output tự cập nhật (dynamic transform).

---

# 30. Coordinate Geometry

Phải có:

```text
Cartesian Plane
X axis
Y axis
Origin
Grid
Coordinates
Vector
Slope

Line Equation
Circle Equation
Parabola
Ellipse
Hyperbola

Parametric Curve
Polar Coordinates (nâng cao)
```

Đặc biệt:

```text
y = ax + b

x² + y² = r²

y = ax² + bx + c

x²/a² + y²/b² = 1

x²/a² - y²/b² = 1
```

Sau này mới mở rộng analytic geometry.

### Equation ↔ Geometry Bridge

Quan trọng: user có thể tạo hình từ phương trình và ngược lại:

```text
Nhập phương trình → Vẽ đồ thị
Vẽ hình → Hiển thị phương trình
Kéo hình → Phương trình cập nhật real-time
Sửa phương trình → Hình cập nhật real-time
```

---

# 31. Dynamic Geometry

Một tính năng cực kỳ quan trọng đối với giáo viên:

```text
Slider
```

Ví dụ:

```text
a = 1 → 10
```

Hình thay đổi theo `a`.

Giáo viên kéo slider:

```text
a = 2
```

→ hình cập nhật.

Đây là thứ biến phần mềm từ:

> "vẽ hình"

thành:

> **"khám phá hình học"**.

### Slider Implementation

```ts
interface Slider {
  id: string
  name: string
  min: number
  max: number
  value: number
  step: number
  animating: boolean
  animationSpeed: number     // units per second
  animationMode: 'once' | 'loop' | 'bounce'
}
```

---

# 32. Locus

Sau khi core ổn định, phải có:

```text
Locus
```

Ví dụ:

```text
P nằm trên đường tròn
Q = midpoint(AP)

cho A di chuyển

→ quỹ tích Q
```

Hệ thống có thể vẽ quỹ tích.

Đây là nền cho nhiều bài THPT nâng cao.

### Locus Implementation

```text
1. User chọn "Trace" cho điểm Q
2. User kéo điểm P dọc theo constraint (vd: trên đường tròn)
3. Hệ thống sample vị trí Q tại mỗi vị trí P
4. Vẽ curve qua các điểm sample
5. Có thể fitting curve để tìm phương trình quỹ tích
```

---

# 33. Curriculum Engine

Đây là một layer riêng:

```text
curriculum/
├── grade-01
├── grade-02
├── ...
└── grade-12
```

Nhưng **không hard-code Geometry Engine theo lớp**.

Ví dụ:

```json
{
  "id": "triangle-basic",
  "grades": [3, 4, 5, 6],
  "concepts": [
    "triangle",
    "side",
    "vertex",
    "angle"
  ],
  "tools": [
    "point",
    "segment",
    "angle",
    "measure"
  ],
  "prerequisites": ["point-basic", "segment-basic"],
  "learningObjectives": [
    "Nhận biết tam giác",
    "Phân loại tam giác theo cạnh",
    "Phân loại tam giác theo góc"
  ]
}
```

Như vậy khi chương trình/sách giáo khoa thay đổi, chỉ sửa:

```text
curriculum data
```

không sửa core.

Điều này rất phù hợp với thực tế chương trình GDPT 2018 có cấu trúc mở rộng, đồng tâm xoáy ốc. ([Bộ Giáo dục và Đào tạo][1])

---

# 34. Không hard-code "bài lớp 7"

Thay vào đó:

```text
Concept
   ↓
Required Objects
   ↓
Required Constructions
   ↓
Required Measurements
   ↓
Grade mapping
```

Ví dụ:

```text
"Đường trung trực"

Objects:
Point
Segment
Line

Operations:
Midpoint
Perpendicular

Constraints:
Perpendicular
Equal distance
```

Sau đó có thể map:

```text
Grade 6
Grade 7
...
```

---

# 35. UI của giáo viên

Workspace:

```text
┌──────────────────────────────────────────────────────────┐
│ GeoStudio                             Camera ● Ready     │
├────────┬──────────────────────────────────────┬──────────┤
│        │                                      │          │
│  Tools │                                      │ Object   │
│        │                                      │ Panel    │
│  ●     │                                      │          │
│  /     │              CANVAS                  │ A Point  │
│  —     │                                      │ B Point  │
│  ⭕     │                △                     │ AB Line  │
│  ⟂     │               / \                    │          │
│  ∠     │              /   \                   │          │
│  →     │             /_____\                  │          │
│        │                                      │          │
├────────┴──────────────────────────────────────┴──────────┤
│ Gesture: ☝️ Pointer     🤏 Select       ✊ Delete        │
│ Status Bar: Objects: 5 | Constraints: 2 | Zoom: 100%    │
└──────────────────────────────────────────────────────────┘
```

Ở **Presentation Mode**:

```text
┌──────────────────────────────────────────────┐
│                                              │
│                                              │
│                    A                         │
│                   /|\                        │
│                  / | \                       │
│                 /  |  \                      │
│                B───H───C                     │
│                                              │
│                                              │
│  ◀ Step 3/6 ▶                    [Exit]      │
└──────────────────────────────────────────────┘
```

Không hiện UI thừa. Chỉ hiện step navigation nếu đang ở Construction Replay.

---

# 36. Keyboard Shortcuts

Giáo viên cần thao tác nhanh mà không phải tìm trên toolbar:

```text
General:
  Ctrl+Z          Undo
  Ctrl+Y          Redo
  Ctrl+S          Save
  Ctrl+Shift+S    Save As
  Ctrl+O          Open
  Delete / Backspace   Delete selected
  Escape          Cancel current operation / Deselect all
  Ctrl+A          Select all
  Ctrl+D          Duplicate selected

Tools:
  V               Select tool (pointer)
  P               Point tool
  L               Line tool
  S               Segment tool
  C               Circle tool
  T               Triangle tool
  R               Rectangle tool
  G               Polygon tool
  M               Measure tool
  N               Perpendicular tool
  H               Parallel tool

View:
  Ctrl++          Zoom in
  Ctrl+-          Zoom out
  Ctrl+0          Reset zoom
  Space+drag      Pan canvas
  F               Fit all to view
  F11             Fullscreen / Presentation mode

3D (khi ở chế độ 3D):
  Arrow keys      Rotate view
  Shift+Arrows    Pan view
```

Shortcuts phải có thể tùy chỉnh và hiển thị bảng shortcuts (Ctrl+/).

---

# 37. Mouse/Touch bắt buộc phải tồn tại

Đây là một nguyên tắc rất quan trọng.

Không được biến sản phẩm thành:

> "Camera không hoạt động → website vô dụng."

Phải có:

```text
Camera
Mouse
Touchscreen
Stylus
Keyboard
```

cùng đi vào một Input API:

```ts
interface InputIntent {
  type: 'pointer' | 'select' | 'drag' | 'zoom' | 'pan' | 'cancel'
  position: { x: number, y: number }
  source: 'mouse' | 'touch' | 'stylus' | 'gesture' | 'keyboard'
  modifiers: { shift: boolean, ctrl: boolean, alt: boolean }
  pressure?: number         // cho stylus
  timestamp: number
}
```

Camera chỉ là phương thức nhập liệu ưu tiên.

---

# 38. Accessibility

Có giáo viên:

* không muốn dùng camera
* ánh sáng phòng học kém
* webcam chất lượng thấp
* đeo kính
* đứng quá xa
* có chuyển động nhiều phía sau
* có khuyết tật vận động

Vì thế luôn có:

```text
Camera Mode
Touch Mode
Mouse Mode
Presentation Mode
Keyboard-only Mode
```

### WCAG Compliance (mục tiêu)

- Color contrast ratio ≥ 4.5:1
- Tất cả interactive elements có keyboard focus
- ARIA labels cho screen readers (tối thiểu cho toolbar)
- Có thể phóng to UI elements (không chỉ canvas)
- Hỗ trợ high contrast mode

---

# 39. Internationalization (i18n)

Hệ thống phải hỗ trợ đa ngôn ngữ ngay từ đầu, tối thiểu **Tiếng Việt** và **English**:

### Phạm vi i18n

```text
UI Labels (toolbar, menus, panels)
Tool names & descriptions
Error messages
Measurement units / formats
Construction step descriptions
Curriculum content
Keyboard shortcut labels
Help / documentation
```

### Implementation

Sử dụng `@nuxtjs/i18n` module:

```ts
// i18n structure
locales/
├── vi.json    // Tiếng Việt (default)
└── en.json    // English

// Ví dụ
{
  "tools": {
    "point": "Điểm",
    "line": "Đường thẳng",
    "segment": "Đoạn thẳng",
    "circle": "Đường tròn",
    "perpendicular": "Vuông góc",
    "parallel": "Song song"
  },
  "actions": {
    "undo": "Hoàn tác",
    "redo": "Làm lại",
    "save": "Lưu",
    "export": "Xuất"
  }
}
```

### Thuật ngữ toán học

Đặc biệt quan trọng: thuật ngữ hình học phải **chính xác theo SGK Việt Nam**:

```text
Perpendicular bisector → Đường trung trực
Altitude → Đường cao
Median → Đường trung tuyến
Angle bisector → Đường phân giác
Circumcircle → Đường tròn ngoại tiếp
Incircle → Đường tròn nội tiếp
Orthocenter → Trực tâm
Circumcenter → Tâm đường tròn ngoại tiếp
Incenter → Tâm đường tròn nội tiếp
Centroid → Trọng tâm
```

---

# 40. Theme & Styling System

### Design Tokens

```ts
interface ThemeTokens {
  // Colors
  primary: string
  secondary: string
  background: string
  surface: string
  text: string
  textSecondary: string
  
  // Geometry colors
  pointColor: string
  lineColor: string
  segmentColor: string
  circleColor: string
  angleColor: string
  constructionColor: string   // màu nét dựng hình phụ
  highlightColor: string
  selectionColor: string
  snapIndicatorColor: string
  
  // Typography
  fontFamily: string
  fontSize: { sm: string, md: string, lg: string }
  
  // Spacing & sizing
  pointRadius: number
  lineWidth: number
  constructionLineWidth: number
  
  // Canvas
  gridColor: string
  axisColor: string
  backgroundColor: string
}
```

### Built-in Themes

```text
Light (default)     — cho giảng dạy ban ngày
Dark                — cho giảng dạy trong phòng tối / projector
High Contrast       — cho accessibility
Presentation        — tối giản, nổi bật hình vẽ
Print               — tối ưu cho in ấn (nền trắng, nét đen)
```

### Custom Theme Support

Giáo viên có thể tùy chỉnh màu sắc từ Settings panel.

---

# 41. Performance Budget & Optimization

### Performance Targets

```text
First Contentful Paint: < 1.5s
Time to Interactive:    < 3s
Canvas FPS:             ≥ 30fps (target 60fps)
Gesture latency:        < 100ms (from hand move → canvas update)
Object limit:           ≥ 500 objects trên canvas trước khi lag
```

### Optimization Strategies

```text
1. Canvas Rendering
   - Chỉ re-render dirty regions, không full canvas
   - RequestAnimationFrame thay vì setInterval
   - Object culling — không render objects ngoài viewport

2. Construction Graph
   - Lazy evaluation — chỉ tính dirty nodes
   - Batch updates — gom nhiều changes
   - Web Worker cho solver nặng (nếu cần)

3. MediaPipe
   - Chạy Web Worker (bắt buộc)
   - Throttle frame rate camera (15-30fps đủ cho gesture)
   - Skip frames khi main thread busy

4. Memory
   - Object pooling cho temporary calculations
   - Dispose unused renderer objects
   - Limit undo history (mặc định 200)

5. Bundle Size
   - Dynamic import cho 3D renderer (chỉ load khi cần)
   - Dynamic import cho MediaPipe (chỉ load khi bật camera)
   - Tree-shake mathjs (chỉ import hàm cần dùng)
```

---

# 42. Document Model & Versioning

### Document Schema

```json
{
  "version": "1.0.0",
  "schemaVersion": 1,
  "metadata": {
    "id": "uuid-here",
    "title": "Đường cao tam giác",
    "description": "Bài dựng đường cao trong tam giác ABC",
    "author": "Nguyễn Văn A",
    "createdAt": "2026-10-06T12:00:00Z",
    "updatedAt": "2026-10-06T14:30:00Z",
    "grade": 7,
    "tags": ["tam giác", "đường cao", "THCS"],
    "locale": "vi"
  },
  "settings": {
    "theme": "light",
    "gridVisible": true,
    "axisVisible": true,
    "snapEnabled": true,
    "dimension": 2
  },
  "viewport": {
    "xMin": -10,
    "xMax": 10,
    "yMin": -10,
    "yMax": 10
  },
  "objects": [ /* GeometryObject[] */ ],
  "constraints": [ /* Constraint[] */ ],
  "sliders": [ /* Slider[] */ ],
  "annotations": [ /* Annotation[] */ ],
  "constructionSteps": [ /* step order for replay */ ]
}
```

### Schema Migration

Khi schema thay đổi giữa các phiên bản:

```ts
const migrations: Record<number, (doc: any) => any> = {
  // Schema v1 → v2
  2: (doc) => {
    // Thêm field mới, transform data cũ
    doc.objects.forEach(obj => {
      if (!obj.dimension) obj.dimension = 2
    })
    doc.schemaVersion = 2
    return doc
  },
  // Schema v2 → v3
  3: (doc) => { /* ... */ }
}

function migrateDocument(doc: any): GeoDocument {
  let current = doc.schemaVersion || 1
  while (current < CURRENT_SCHEMA_VERSION) {
    current++
    doc = migrations[current](doc)
  }
  return doc
}
```

---

# 43. Privacy

**Không upload hình camera lên server.**

Luồng:

```text
Camera
 ↓
Browser
 ↓
MediaPipe
 ↓
Landmarks
 ↓
Gesture
```

Không:

```text
Camera
 ↓
Server
```

MediaPipe chạy trên web, nên hoàn toàn có thể thiết kế xử lý gesture ở client. ([Google AI for Developers][2])

Các model/WASM nên được chuẩn bị local/static để giảm phụ thuộc runtime vào CDN.

### Data Privacy Policy

```text
- Camera data: NEVER leaves browser
- Geometry documents: stored locally (IndexedDB) by default
- Cloud sync (tương lai): opt-in, encrypted
- Analytics (tương lai): anonymous usage metrics only
- No third-party tracking
```

---

# 44. Công nghệ chốt

## Frontend

```text
Nuxt 4
Vue 3
TypeScript
Pinia
VueUse
```

Nuxt hiện có deploy Vercel chính thức và Vercel có zero-configuration cho Nuxt; push Git lên Vercel sẽ tự tạo Preview và Production deployment. ([Nuxt][10])

---

## Geometry

```text
JSXGraph
```

làm renderer/interactive geometry layer.

---

## Computer Vision

```text
@mediapipe/tasks-vision
```

---

## Math

```text
mathjs
```

---

## Formula rendering

```text
KaTeX
```

---

## 3D

Giai đoạn đầu:

```text
JSXGraph View3D
```

Giai đoạn sau có thể thêm:

```text
Three.js
```

---

## State

```text
Pinia
```

---

## Validation

```text
Zod
```

Dùng để validate document/geometry JSON.

---

## i18n

```text
@nuxtjs/i18n
```

---

## Icons

```text
@nuxt/icon + Iconify
```

---

## Local storage

```text
IndexedDB (via idb library)
```

---

## Testing

```text
Vitest (unit + integration)
Playwright (E2E)
fast-check (property-based testing cho geometry)
```

---

# 45. Repo nên thiết kế như thế này

```text
geostudio/
│
├── app/
│   ├── pages/
│   │   ├── index.vue              # Landing / Dashboard
│   │   ├── workspace.vue          # Main geometry workspace
│   │   └── settings.vue           # Settings page
│   │
│   ├── components/
│   │   ├── canvas/
│   │   │   ├── GeoCanvas.vue      # Main canvas component
│   │   │   ├── CanvasOverlay.vue   # Snap indicators, labels
│   │   │   └── Canvas3D.vue       # 3D view (lazy loaded)
│   │   │
│   │   ├── toolbar/
│   │   │   ├── Toolbar.vue
│   │   │   ├── ToolButton.vue
│   │   │   └── ToolGroup.vue
│   │   │
│   │   ├── panels/
│   │   │   ├── ObjectPanel.vue    # Object list & properties
│   │   │   ├── PropertyEditor.vue # Edit object properties
│   │   │   ├── MeasurementPanel.vue
│   │   │   └── ConstructionSteps.vue
│   │   │
│   │   ├── camera/
│   │   │   ├── CameraView.vue     # Camera preview
│   │   │   ├── GestureHUD.vue     # Gesture visual feedback
│   │   │   └── CalibrationModal.vue
│   │   │
│   │   ├── common/
│   │   │   ├── Modal.vue
│   │   │   ├── Dropdown.vue
│   │   │   ├── Slider.vue
│   │   │   └── Toast.vue
│   │   │
│   │   └── formula/
│   │       └── FormulaDisplay.vue # KaTeX rendering
│   │
│   ├── layouts/
│   │   ├── default.vue
│   │   └── workspace.vue          # Full-screen workspace layout
│   │
│   └── composables/
│       ├── useGeometry.ts         # Geometry state & operations
│       ├── useCanvas.ts           # Canvas interaction
│       ├── useCamera.ts           # Camera & gesture
│       ├── useCommands.ts         # Command execution & history
│       ├── useDocument.ts         # Document save/load/export
│       ├── useKeyboard.ts         # Keyboard shortcuts
│       ├── useSnap.ts             # Snap logic
│       └── useTheme.ts            # Theme management
│
├── core/
│   │
│   ├── geometry/
│   │   ├── primitives/
│   │   │   ├── Point.ts
│   │   │   ├── Line.ts
│   │   │   ├── Segment.ts
│   │   │   ├── Ray.ts
│   │   │   ├── Circle.ts
│   │   │   ├── Arc.ts
│   │   │   ├── Polygon.ts
│   │   │   ├── Angle.ts
│   │   │   ├── Vector.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── constructions/
│   │   │   ├── registry.ts
│   │   │   ├── Midpoint.ts
│   │   │   ├── Perpendicular.ts
│   │   │   ├── Parallel.ts
│   │   │   ├── Bisector.ts
│   │   │   ├── Tangent.ts
│   │   │   ├── Circumcircle.ts
│   │   │   ├── Incircle.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── constraints/
│   │   │   ├── ConstraintSolver.ts
│   │   │   ├── Coincident.ts
│   │   │   ├── Parallel.ts
│   │   │   ├── Perpendicular.ts
│   │   │   ├── EqualLength.ts
│   │   │   ├── FixedLength.ts
│   │   │   ├── PointOnLine.ts
│   │   │   ├── PointOnCircle.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── measurements/
│   │   │   ├── Distance.ts
│   │   │   ├── Angle.ts
│   │   │   ├── Area.ts
│   │   │   ├── Perimeter.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── transformations/
│   │   │   ├── Translation.ts
│   │   │   ├── Rotation.ts
│   │   │   ├── Reflection.ts
│   │   │   ├── Scaling.ts
│   │   │   ├── Homothety.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── intersections/
│   │   │   ├── LineLineIntersection.ts
│   │   │   ├── LineCircleIntersection.ts
│   │   │   ├── CircleCircleIntersection.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── graph/
│   │   │   ├── ConstructionGraph.ts
│   │   │   ├── TopologicalSort.ts
│   │   │   └── DirtyPropagation.ts
│   │   │
│   │   ├── 3d/                    # 3D extensions (Phase 8)
│   │   │   ├── Point3D.ts
│   │   │   ├── Line3D.ts
│   │   │   ├── Plane.ts
│   │   │   ├── Solids.ts
│   │   │   └── index.ts
│   │   │
│   │   └── index.ts
│   │
│   ├── commands/
│   │   ├── CommandEngine.ts
│   │   ├── CommandHistory.ts
│   │   ├── commands/
│   │   │   ├── CreatePoint.ts
│   │   │   ├── CreateSegment.ts
│   │   │   ├── CreateLine.ts
│   │   │   ├── CreateCircle.ts
│   │   │   ├── MoveObject.ts
│   │   │   ├── DeleteObject.ts
│   │   │   ├── CreateConstruction.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── input/
│   │   ├── InputEngine.ts
│   │   ├── MouseHandler.ts
│   │   ├── TouchHandler.ts
│   │   ├── KeyboardHandler.ts
│   │   └── index.ts
│   │
│   ├── gesture/
│   │   ├── GestureEngine.ts
│   │   ├── GestureStateMachine.ts
│   │   ├── GestureFeatureExtractor.ts
│   │   ├── ContextualGestureMapper.ts
│   │   ├── worker/
│   │   │   ├── mediapipe.worker.ts
│   │   │   └── types.ts
│   │   └── index.ts
│   │
│   ├── renderer/
│   │   ├── RendererInterface.ts
│   │   ├── JSXGraphRenderer.ts
│   │   ├── ThreeJSRenderer.ts      # Phase 8+
│   │   └── index.ts
│   │
│   ├── document/
│   │   ├── DocumentModel.ts
│   │   ├── DocumentStorage.ts       # IndexedDB
│   │   ├── DocumentExport.ts        # PNG, SVG, JSON, PDF
│   │   ├── DocumentMigration.ts
│   │   └── index.ts
│   │
│   ├── events/
│   │   ├── EventBus.ts
│   │   └── types.ts
│   │
│   └── types/
│       ├── geometry.ts
│       ├── commands.ts
│       ├── events.ts
│       ├── input.ts
│       └── document.ts
│
├── content/
│   ├── curriculum/
│   │   ├── grade-01/
│   │   ├── ...
│   │   └── grade-12/
│   └── constructions/
│       ├── perpendicular-bisector.json
│       ├── circumcircle.json
│       └── ...
│
├── locales/
│   ├── vi.json
│   └── en.json
│
├── public/
│   ├── models/                     # MediaPipe WASM + model files
│   ├── icons/
│   └── fonts/
│
├── tests/
│   ├── unit/
│   │   ├── geometry/
│   │   ├── commands/
│   │   └── gesture/
│   ├── integration/
│   └── e2e/
│
├── nuxt.config.ts
├── package.json
└── tsconfig.json
```

---

# 46. Data của một bài học

Ví dụ bài:

> Dựng đường cao tam giác ABC.

Không lưu hình ảnh. Lưu:

```json
{
  "version": "1.0.0",
  "schemaVersion": 1,
  "metadata": {
    "id": "lesson-altitude-001",
    "title": "Đường cao tam giác",
    "grade": 7,
    "tags": ["tam giác", "đường cao"]
  },

  "objects": [
    {
      "id": "A",
      "type": "point",
      "definition": { "kind": "free", "x": 2, "y": 5 },
      "style": { "color": "#2196F3", "size": 4 }
    },
    {
      "id": "B",
      "type": "point",
      "definition": { "kind": "free", "x": 0, "y": 0 }
    },
    {
      "id": "C",
      "type": "point",
      "definition": { "kind": "free", "x": 6, "y": 0 }
    },
    {
      "id": "AB",
      "type": "segment",
      "parents": ["A", "B"]
    },
    {
      "id": "BC",
      "type": "segment",
      "parents": ["B", "C"]
    },
    {
      "id": "AC",
      "type": "segment",
      "parents": ["A", "C"]
    },
    {
      "id": "H",
      "type": "point",
      "definition": {
        "kind": "projection",
        "point": "A",
        "line": "BC"
      },
      "parents": ["A", "BC"]
    },
    {
      "id": "AH",
      "type": "segment",
      "parents": ["A", "H"],
      "style": { "color": "#F44336", "dashStyle": "dashed" }
    }
  ],

  "constructionSteps": [
    { "step": 1, "action": "create", "objectId": "A", "description": "Đặt điểm A" },
    { "step": 2, "action": "create", "objectId": "B", "description": "Đặt điểm B" },
    { "step": 3, "action": "create", "objectId": "C", "description": "Đặt điểm C" },
    { "step": 4, "action": "create", "objectId": "AB", "description": "Nối A với B" },
    { "step": 5, "action": "create", "objectId": "BC", "description": "Nối B với C" },
    { "step": 6, "action": "create", "objectId": "AC", "description": "Nối A với C" },
    { "step": 7, "action": "create", "objectId": "H", "description": "Dựng chân đường cao H (hình chiếu của A lên BC)" },
    { "step": 8, "action": "create", "objectId": "AH", "description": "Nối A với H — đây là đường cao" }
  ]
}
```

Renderer chỉ đọc document này.

---

# 47. Export

Ngay giai đoạn đầu nên có:

```text
Save (IndexedDB)
Load (IndexedDB)
Undo
Redo

Export PNG
Export SVG
Export JSON (document format)
Print
```

Sau đó:

```text
Export PDF (via html2canvas + jsPDF hoặc SVG → PDF)
Share link (URL with encoded minimal state)
Lesson Package (.geo bundle)
Import from JSON
Import from GeoGebra format (tương lai)
```

PDF không nhất thiết cần server; có thể xây từ SVG/print pipeline ở client.

---

# 48. AI chưa nên nằm trong MVP

**Đừng bắt đầu bằng LLM.**

MVP:

```text
Geometry Engine
+
Command Engine
+
Rendering
+
Mouse/Touch Input
```

đã đủ cực lớn.

Sau đó AI mới thêm:

```text
"Vẽ tam giác ABC"

"Chứng minh ABC cân"

"Thêm đường cao từ A"

"Giải thích tại sao AB ⟂ CH"

"Biến hình này thành một bài tập"
```

AI chỉ chuyển:

```text
Natural Language
       ↓
Geometry Intent
       ↓
Command
```

Geometry Engine vẫn là nguồn sự thật.

---

# 49. Có thể thêm Voice về sau

Ví dụ:

> "Tạo điểm A."

→

```text
CREATE_POINT(A)
```

> "Kẻ đường thẳng qua C vuông góc AB."

→

```text
CREATE_PERPENDICULAR_LINE(
  point=C,
  line=AB
)
```

Như vậy:

```text
Gesture
Voice
Mouse
Touch
AI
Keyboard
```

đều điều khiển **cùng một Command Engine**.

Đó mới là kiến trúc mở rộng tốt.

---

# 50. Plugin Architecture (tương lai)

Cho phép cộng đồng mở rộng:

```ts
interface GeoPlugin {
  id: string
  name: string
  version: string
  
  // Đăng ký thêm constructions
  constructions?: ConstructionDefinition[]
  
  // Đăng ký thêm tools
  tools?: ToolDefinition[]
  
  // Đăng ký thêm commands
  commands?: CommandDefinition[]
  
  // Custom UI panel
  panels?: PanelDefinition[]
  
  // Lifecycle
  onActivate?(context: PluginContext): void
  onDeactivate?(): void
}
```

Ví dụ plugin:
- **Trigonometry Plugin**: thêm unit circle, trig functions
- **Statistics Plugin**: thêm histogram, scatter plot
- **Physics Plugin**: thêm force vectors, trajectories
- **3D Advanced Plugin**: thêm boolean operations, surface rendering

---

# 51. Mobile & PWA Support

### Progressive Web App

GeoStudio nên là PWA để:
- Cài đặt trên điện thoại/tablet
- Hoạt động offline (service worker cache)
- Fullscreen experience trên tablet

### Responsive Design

```text
Desktop (≥1024px):  Full workspace với side panels
Tablet (768-1023px): Collapsible panels, larger touch targets
Mobile (< 768px):   Simplified UI, bottom sheet panels
```

### Touch Optimization cho Tablet

```text
- Larger hit areas cho points (≥ 44px)
- Pinch-to-zoom native
- Two-finger pan
- Long press context menu
- Palm rejection
```

---

# 52. Collaboration Protocol (tương lai)

Chuẩn bị sẵn kiến trúc cho real-time collaboration:

```text
Teacher A ─────┐
               │
Teacher B ─────┼──→ CRDT / OT Engine ──→ Shared Document
               │
Student C ────┘
```

### Implementation Options (khi cần)

```text
1. Y.js (CRDT library) — peer-to-peer, offline-first
2. Liveblocks — managed service
3. Supabase Realtime — khi đã dùng Supabase
```

Quan trọng: Document Model phải serializable và mergeable từ đầu.

---

# 53. Security Considerations

```text
1. XSS Prevention
   - Sanitize tất cả user input (tên object, annotations)
   - CSP headers

2. Document Validation
   - Zod validate khi load document
   - Reject malformed documents

3. Import Safety
   - Validate imported JSON trước khi apply
   - Size limits cho imported files

4. Camera Permissions
   - Explicit user consent
   - Clear visual indicator khi camera đang active
   - Easy way to revoke permission

5. Third-party Dependencies
   - Regular audit (npm audit)
   - Lock file cho reproducible builds
```

---

# 54. Monitoring & Error Tracking (Production)

```text
1. Client-side Error Logging
   - Sentry hoặc tương tự (khi đã production)
   - Geometry Engine errors (degenerate cases)
   - Rendering errors
   - MediaPipe initialization failures

2. Performance Monitoring
   - Canvas FPS
   - Gesture latency
   - Bundle size tracking

3. Usage Analytics (anonymous, opt-in)
   - Các tools hay dùng nhất
   - Các construction phổ biến
   - Device/browser distribution
```

---

# 55. Lộ trình xây dựng

## PHASE 0 — Specification

**Chưa code nhiều.**

Tạo tài liệu:

```text
01-product-spec.md
02-geometry-model.md
03-command-system.md
04-gesture-spec.md
05-curriculum-map.md
06-renderer-spec.md
07-testing-strategy.md
```

Đặc biệt phải xây **Geometry Capability Matrix**.

Ví dụ:

| Capability    | Core | 2D | 3D | Gesture | Grade |
| ------------- | ---: | -: | -: | ------: | ----- |
| Point         |    ✅ |  ✅ |  ✅ |       ✅ | 1–12  |
| Segment       |    ✅ |  ✅ |  ✅ |       ✅ | 1–12  |
| Circle        |    ✅ |  ✅ |    |       ✅ | 3–12  |
| Perpendicular |    ✅ |  ✅ |  ✅ |       ✅ | 6–12  |
| Triangle      |    ✅ |  ✅ |    |       ✅ | 1–12  |
| Vector        |    ✅ |  ✅ |  ✅ |       ✅ | 10–12 |
| Plane         |    ✅ |    |  ✅ |       ✅ | 11–12 |

Bảng này phải trở thành **bản đồ sản phẩm**.

---

# 56. Geometry Capability Matrix — Đầy đủ theo Chương trình GDPT 2018

### Tiểu học (Lớp 1–5)

| Khái niệm                    | Lớp | Objects cần          | Constructions        |
| ----------------------------- | --- | -------------------- | -------------------- |
| Nhận dạng hình phẳng          | 1–2 | Point, Segment       | —                    |
| Hình vuông, HCN, tam giác    | 1–3 | Polygon              | Regular Polygon      |
| Hình tròn                    | 2–3 | Circle               | Circle by center+r   |
| Đo độ dài                    | 2–3 | Segment, Measure     | Distance             |
| Chu vi                       | 3   | Polygon, Circle      | Perimeter            |
| Diện tích HCN, HV            | 3–4 | Polygon, Measure     | Area                 |
| Diện tích tam giác           | 4–5 | Triangle, Measure    | Area                 |
| Diện tích hình tròn          | 5   | Circle, Measure      | Area                 |
| Góc                          | 3–4 | Angle, Measure       | Angle                |
| Góc vuông                    | 3   | Angle, Perpendicular | Perpendicular        |
| Đối xứng trục (nhận biết)    | 4–5 | Reflection           | Axial Symmetry       |
| Khối hộp CN, khối lập phương | 5   | Cuboid, Cube         | 3D View              |

### THCS (Lớp 6–9)

| Khái niệm                    | Lớp | Objects cần               | Constructions             |
| ----------------------------- | --- | ------------------------- | ------------------------- |
| Đoạn thẳng, trung điểm      | 6   | Segment, Midpoint         | Midpoint                  |
| Tia, đường thẳng             | 6   | Ray, Line                 | Through-points            |
| Góc, tia phân giác           | 6   | Angle, Bisector           | Angle Bisector            |
| Hai đường thẳng song song    | 7   | Parallel Line             | Parallel                  |
| Hai đường thẳng vuông góc    | 7   | Perpendicular Line        | Perpendicular             |
| Tam giác                     | 7   | Triangle, Angle, Segment  | Triangle by 3 points      |
| Tam giác bằng nhau           | 7   | Triangle, Congruence      | Copy Triangle             |
| Đường trung tuyến            | 7   | Median, Centroid          | Median                    |
| Đường cao                    | 7   | Altitude, Orthocenter     | Altitude                  |
| Đường trung trực             | 7   | Perpendicular Bisector    | Perpendicular Bisector    |
| Đường tròn ngoại tiếp        | 7   | Circumcircle, Circumcenter| Circumcircle              |
| Đường tròn nội tiếp          | 7   | Incircle, Incenter        | Incircle                  |
| Tứ giác                      | 8   | Quadrilateral             | 4-point Polygon           |
| Hình bình hành               | 8   | Parallelogram             | Parallel sides            |
| Hình thoi                    | 8   | Rhombus                   | Equal sides               |
| Hình chữ nhật                | 8   | Rectangle                 | Right angles              |
| Hình vuông                   | 8   | Square                    | Square construction       |
| Hình thang                   | 8   | Trapezoid                 | One pair parallel         |
| Đường tròn                   | 9   | Circle, Tangent, Secant   | Tangent, Secant            |
| Đường tròn + đường thẳng     | 9   | Circle, Line, Intersection| Tangent from point         |
| Hai đường tròn               | 9   | Circle, Circle, Intersection | Common tangent          |
| Tam giác đồng dạng           | 8   | Triangle, Scaling          | Homothety                |
| Hình lăng trụ, hình chóp     | 8   | Prism, Pyramid            | 3D construction           |
| Hình trụ, hình nón, hình cầu | 9   | Cylinder, Cone, Sphere    | 3D construction           |

### THPT (Lớp 10–12)

| Khái niệm                    | Lớp  | Objects cần               | Constructions            |
| ----------------------------- | ---- | ------------------------- | ------------------------ |
| Vectơ                        | 10   | Vector                    | Vector by 2 points       |
| Tích vô hướng                | 10   | Vector, Angle             | Dot product              |
| Hệ trục tọa độ              | 10   | Cartesian Plane, Axis     | Coordinate System        |
| Phương trình đường thẳng     | 10   | Line, Equation            | Line by equation         |
| Phương trình đường tròn      | 10   | Circle, Equation          | Circle by equation       |
| Elip                         | 10   | Ellipse                   | Ellipse by equation      |
| Hyperbol                     | 10   | Hyperbola                 | Hyperbola by equation    |
| Parabol                      | 10   | Parabola                  | Parabola by equation     |
| Phép biến hình               | 11   | Transform                 | Translation, Rotation... |
| Phép tịnh tiến               | 11   | Translation               | Translate by vector      |
| Phép quay                    | 11   | Rotation                  | Rotate around point      |
| Phép đối xứng trục           | 11   | Reflection                | Reflect across line      |
| Phép đối xứng tâm            | 11   | Point Reflection          | Reflect through point    |
| Phép vị tự                   | 11   | Homothety                 | Homothety                |
| Đường thẳng trong không gian | 11   | Line3D                    | 3D Line                  |
| Mặt phẳng                    | 11   | Plane                     | Plane by 3 points        |
| Quan hệ song song (KG)      | 11   | Parallel (3D)             | Parallel line/plane      |
| Quan hệ vuông góc (KG)      | 11   | Perpendicular (3D)        | Perp line/plane          |
| Khoảng cách trong KG         | 11   | Distance 3D               | Point-Line, Point-Plane  |
| Góc trong không gian         | 11   | Angle 3D                  | Line-Line, Line-Plane    |
| Thể tích khối đa diện       | 12   | Polyhedron, Volume        | Volume                   |
| Khối tròn xoay               | 12   | Cylinder, Cone, Sphere    | Volume, Surface Area     |
| Phương trình mặt phẳng       | 12   | Plane, Equation           | Plane by equation        |
| Phương trình đường thẳng KG  | 12   | Line3D, Equation          | Line by parametric       |
| Tọa độ hóa hình không gian   | 12   | Coordinate 3D             | 3D coordinate system     |

---

# 57. Calibration Mode

Lần đầu:

```text
Camera calibration

┌─────────────────────┐
│                     │
│       ✋            │
│                     │
│          ●          │
│                     │
└─────────────────────┘
```

Hệ thống học:

```text
Camera bounds
Canvas bounds
Mirror
Hand position
Distance
```

Có:

```text
Left-handed
Right-handed
```

### Calibration Steps

```text
1. "Đưa tay vào vùng camera"        → detect hand presence
2. "Chạm góc trên-trái của canvas"   → map camera → canvas corner
3. "Chạm góc dưới-phải của canvas"   → complete mapping
4. "Thực hiện pinch"                 → calibrate pinch threshold
5. "Di chuyển tay chậm"             → calibrate velocity thresholds
6. "Hoàn tất!"                      → save calibration to localStorage
```

---

# 58. Gesture phải có visual feedback

Ví dụ giáo viên giơ ngón tay:

```text
             ☝️
              ●
              │
              │
     Gesture: POINTER
```

Pinch:

```text
Gesture: SELECT
```

Đừng để giáo viên không biết hệ thống đang hiểu gì.

Có HUD nhỏ:

```text
┌─────────────────┐
│ ✋ Camera Ready  │
│ Gesture: PINCH  │
│ Tool: Perp ⟂    │
│ Confidence: 95% │
└─────────────────┘
```

Có thể tắt HUD trong presentation mode.

---

# 59. Free stack / chi phí

MVP có thể gần như **0 đồng tiền server**.

```text
GitHub
   ↓
Vercel
   ↓
Nuxt
   ↓
Browser
   ├── MediaPipe
   ├── JSXGraph
   ├── mathjs
   ├── KaTeX
   └── IndexedDB
```

Không cần database ở giai đoạn đầu.

Vercel Hobby hiện miễn phí và có HTTPS, Git integration, Preview deployments; tuy nhiên trang chính thức hiện ghi rõ Hobby dành cho personal/non-commercial use. Hobby hiện có giới hạn như 100 deployments/ngày và 1 triệu function invocations trong mức bao gồm. ([Vercel][11])

**Vì vậy:**

```text
Prototype / cá nhân / nghiên cứu
        ↓
Vercel Hobby ✅

Sản phẩm thương mại
        ↓
Cần xem lại license/plan
```

---

# 60. Có cần Supabase ngay không?

**Không.**

Ban đầu:

```text
IndexedDB
+
Export JSON
```

là đủ.

Sau này khi cần:

```text
Teacher account
Lesson cloud
Library
Sharing
Student
Class
```

thêm Supabase.

Free tier hiện có:

```text
500 MB database
1 GB storage
50,000 MAU
5 GB egress
```

nhưng free project có thể bị pause sau 1 tuần không hoạt động. ([Supabase][12])

Vì vậy không biến Supabase thành dependency của Geometry Engine.

---

# 61. Deployment architecture

```text
GitHub
   │
   ▼
Vercel
   │
   ├── Nuxt App
   │
   ├── Static Assets
   │      ├── MediaPipe WASM + Model
   │      ├── Fonts
   │      └── Icons
   │
   └── Optional API (tương lai)
          │
          └── Supabase
```

Nuxt có hỗ trợ Vercel chính thức và việc deploy qua Git được tài liệu Nuxt mô tả là zero-configuration. ([Nuxt][10])

---

# 62. Thứ tự công nghệ chốt

| Thành phần    | Công nghệ                            | Ghi chú                         |
| ------------- | ------------------------------------- | -------------------------------- |
| Framework     | **Nuxt 4 + Vue 3**                   | SSR/SSG ready                    |
| Language      | **TypeScript**                        | Strict mode                      |
| Geometry      | **JSXGraph**                          | MIT license                      |
| Math          | **mathjs**                            | Tree-shakeable import            |
| Formula       | **KaTeX**                             | Fast rendering                   |
| Hand tracking | **MediaPipe**                         | Web Worker required              |
| Gesture       | **Custom Gesture Engine**             | State machine + context          |
| State         | **Pinia**                             | Vue ecosystem                    |
| Validation    | **Zod**                               | Runtime type safety              |
| i18n          | **@nuxtjs/i18n**                      | Vi + En                         |
| Local data    | **IndexedDB (idb)**                   | Offline-first                    |
| 3D ban đầu    | **JSXGraph View3D**                   | Tích hợp sẵn                    |
| 3D nâng cao   | **Three.js**                          | Lazy loaded                      |
| Tests         | **Vitest + Playwright + fast-check**  | Unit + E2E + Property            |
| Git           | **GitHub**                            | CI/CD via GitHub Actions         |
| Hosting       | **Vercel**                            | Zero-config for Nuxt             |
| Cloud sau này | **Supabase**                          | Auth + DB + Storage              |

Tất cả những thành phần cốt lõi này đều có thể bắt đầu theo hướng miễn phí/open-source; JSXGraph đặc biệt có license MIT/LGPL, còn MediaPipe cung cấp package trực tiếp cho Web/JS. ([JSXGraph][3])

---

# 63. Những thứ tuyệt đối không nên làm

### ❌ Không lưu hình dưới dạng canvas bitmap

Phải lưu Geometry Model.

### ❌ Không cho Gesture Engine gọi trực tiếp JSXGraph

Phải:

```text
Gesture
 ↓
Intent
 ↓
Command
 ↓
Geometry Core
 ↓
Renderer
```

### ❌ Không xây 3D từ đầu

Tận dụng renderer hiện có. 3D là Phase 8.

### ❌ Không đưa LLM vào Geometry Core

LLM chỉ tạo intent/command.

### ❌ Không làm 100 gesture ngay

Làm ít nhưng ổn định (5-8 gestures cho MVP).

### ❌ Không bỏ mouse

Mouse là fallback và công cụ debug.

### ❌ Không đưa camera inference lên server

Giữ xử lý ở client.

### ❌ Không bỏ qua error handling

Geometry Engine phải xử lý mọi degenerate case.

### ❌ Không skip unit tests cho geometry

Property-based testing bắt buộc cho tính toán hình học.

### ❌ Không hard-code strings

Dùng i18n ngay từ đầu.

---

# 64. "Foundation Complete" ≠ "Feature Complete"

Bạn đang muốn:

> lớp 1 → lớp 12, tất cả trường hợp.

Điều đó **không nên hiểu là phải làm hết 12 lớp trước khi deploy**.

Mục tiêu release đầu nên là:

```text
GEOMETRY FOUNDATION COMPLETE
```

chứ chưa phải:

```text
GRADE 1-12 COMPLETE
```

Ví dụ bản `v0.1` đã phải có kiến trúc:

```text
Point
Line
Segment
Circle
Triangle
Angle
Polygon

Intersection
Midpoint
Perpendicular
Parallel
Bisector

Measure
Snap
Undo
Redo

Mouse
Touch

Save
Load
Export
```

Sau đó:

```text
v0.2 → quadrilateral + special quadrilaterals
v0.3 → transformation (translate, rotate, reflect)
v0.4 → coordinate geometry + equation ↔ geometry
v0.5 → camera + gesture engine
v0.6 → 3D basics (point, line, plane, simple solids)
v0.7 → curriculum mapping + lesson builder
v0.8 → dynamic geometry (sliders, locus)
v0.9 → teacher features (presentation, replay, annotation)
v1.0 → full platform + polish + accessibility
```

**Nhưng toàn bộ các version vẫn chạy trên cùng Geometry Core.**

---

# 65. Kiến trúc cuối cùng

```text
                         ┌────────────────────┐
                         │     TEACHER UI     │
                         └─────────┬──────────┘
                                   │
             ┌─────────────────────┼─────────────────────┐
             │                     │                     │
           Mouse                 Touch                Camera
             │                     │                     │
             │                     │              MediaPipe Worker
             │                     │                     │
             └─────────────────────┼─────────────────────┘
                                   ▼
                         ┌──────────────────┐
                         │  INPUT ENGINE    │
                         └────────┬─────────┘
                                  ▼
                         ┌──────────────────┐
                         │  INTENT ENGINE   │
                         └────────┬─────────┘
                                  ▼
                         ┌──────────────────┐
                         │ COMMAND ENGINE   │──→ Command History (Undo/Redo)
                         └────────┬─────────┘
                                  ▼
              ┌──────────────────────────────────┐
              │         GEOMETRY CORE            │
              │                                  │
              │ Primitive                        │
              │ Construction                     │
              │ Constraint                       │
              │ Measurement                      │
              │ Transformation                   │
              │ Intersection                     │
              │ Solver                           │
              └───────────────┬──────────────────┘
                              ▼
                    Construction Graph (DAG)
                              │
                  ┌───────────┴───────────┐
                  ▼                       ▼
            2D Renderer               3D Renderer
            JSXGraph                 JSXGraph/Three
                  │                       │
                  └───────────┬───────────┘
                              ▼
                       ┌─────────────┐
                       │   CANVAS    │
                       └──────┬──────┘
                              │
                    ┌─────────┼─────────┐
                    ▼         ▼         ▼
              Measurement  Annotation  Animation
                    │         │         │
                    └─────────┼─────────┘
                              ▼
                  ┌───────────────────────┐
                  │    DOCUMENT MODEL     │
                  └───────────┬───────────┘
                              │
                    ┌─────────┼─────────┐
                    ▼         ▼         ▼
               IndexedDB   Export    Event Bus
                              │
                    ┌─────────┼─────────┐
                    ▼         ▼         ▼
                  PNG/SVG    JSON      PDF
```

Đây là kiến trúc cho phép đi từ một tam giác đơn giản đến dựng hình Euclid, hình giải tích, vector, tọa độ, mặt phẳng, hình không gian… mà **gesture không trở thành điểm nghẽn kiến trúc**.

Một hướng tham khảo rất gần với ý tưởng là **Sketchometry**, vốn đã sử dụng các gesture để tạo các đối tượng hình học; còn JSXGraph là nền interactive geometry mạnh hơn để làm engine/rendering. ([JSXGraph][3])

---

# 66. Auto-naming & Auto-labeling System

Mỗi đối tượng tạo mới phải được tự động đặt tên:

### Naming Convention

```text
Points:    A, B, C, ..., Z, A₁, B₁, ...
Lines:     a, b, c, ..., z, a₁, b₁, ...
Circles:   c₁, c₂, c₃, ...
Polygons:  Theo vertices — "△ABC", "◻ABCD"
Angles:    ∠ABC (vertex ở giữa)
Segments:  AB, CD (theo 2 endpoints)
```

### Special Point Auto-naming

```text
Midpoint of AB → M (hoặc M_AB nếu đã có M)
Orthocenter → H
Circumcenter → O
Incenter → I
Centroid → G
Foot of altitude from A → H_A
Projection of P onto line → P'
```

### Label Display Options

```ts
interface LabelConfig {
  visible: boolean
  position: 'auto' | 'top' | 'bottom' | 'left' | 'right'
  offset: { x: number, y: number }
  showCoordinates: boolean    // hiện tọa độ cạnh label
  showMeasurement: boolean    // hiện số đo cạnh label
  fontSize: number
  fontStyle: 'normal' | 'italic' | 'bold'
}
```

### Name Collision Handling

```text
1. Khi tạo Point mới → lấy tên tiếp theo chưa dùng (A→B→C)
2. Khi xóa Point "B" → "B" vẫn bị occupy (không reuse)
3. Khi import document → merge naming namespace
4. User có thể rename bất kỳ object nào
5. Rename tự update tất cả references
```

---

# 67. Object Style System

Mỗi đối tượng hình học cần style system đầy đủ:

### Point Styles

```ts
interface PointStyle {
  shape: 'circle' | 'square' | 'diamond' | 'cross' | 'plus' | 'triangle'
  size: number              // radius in pixels
  color: string
  fillColor: string
  opacity: number           // 0-1
  visible: boolean
}
```

### Line/Segment/Ray Styles

```ts
interface LineStyle {
  color: string
  width: number             // px
  dashPattern: 'solid' | 'dashed' | 'dotted' | 'dash-dot' | number[]
  opacity: number
  visible: boolean
  arrows: 'none' | 'end' | 'both'   // cho ray/vector
}
```

### Polygon/Circle Styles

```ts
interface FillStyle {
  fillColor: string
  fillOpacity: number       // 0 = no fill, 1 = solid
  fillPattern: 'solid' | 'hatch' | 'crosshatch' | 'dots' | 'none'
  hatchAngle?: number       // degrees for hatch pattern
  hatchSpacing?: number     // px
  borderColor: string
  borderWidth: number
  borderDash: 'solid' | 'dashed' | 'dotted'
}
```

### Angle Styles

```ts
interface AngleStyle {
  arcRadius: number         // px
  color: string
  fillColor: string
  fillOpacity: number
  showRightAngleSquare: boolean  // hiện vuông góc bằng ký hiệu □
  showValue: boolean        // hiện giá trị góc
  showArc: boolean          // hiện cung tròn
  tickCount: number         // số dấu tick (để đánh dấu góc bằng nhau)
}
```

### Construction Style Presets

```text
Main objects:        đậm, màu chính (blue/black)
Construction lines:  mỏng, nét đứt, màu nhạt (gray)
Highlighted:         đậm, màu highlight (orange/yellow)
Selected:            viền chọn (blue glow)
Result:              đậm, màu nhấn (red/green)
```

---

# 68. Multi-selection Behavior

```text
Click:              Chọn 1 object, bỏ chọn tất cả khác
Shift+Click:        Thêm/bỏ object vào selection
Ctrl+A:             Chọn tất cả
Drag (empty space): Box selection — chọn tất cả objects trong vùng
Escape:             Bỏ chọn tất cả
```

### Actions trên multi-selection

```text
Delete:             Xóa tất cả selected (confirm dialog nếu có dependants)
Move:               Di chuyển tất cả selected free points
Set Style:          Áp dụng style cho tất cả selected
Group:              Gom thành group
Hide/Show:          Toggle visibility
Copy:               Copy tất cả selected
```

### Selection Visual Feedback

```text
- Selected points: viền xanh + phóng to nhẹ
- Selected lines: highlight color + tăng width
- Selected polygons: highlight fill
- Selection count hiện trên status bar: "3 objects selected"
```

---

# 69. Grid System

Hỗ trợ nhiều loại grid:

### Grid Types

```text
1. Cartesian (mặc định) — lưới vuông
2. Isometric — lưới tam giác đều (cho hình học trực quan)
3. Polar — lưới tròn (cho tọa độ cực)
4. None — không lưới
```

### Grid Configuration

```ts
interface GridConfig {
  type: 'cartesian' | 'isometric' | 'polar' | 'none'
  visible: boolean
  majorSpacing: number       // khoảng cách lưới chính
  minorSpacing: number       // khoảng cách lưới phụ (optional)
  majorColor: string
  minorColor: string
  majorOpacity: number
  minorOpacity: number
  showLabels: boolean        // hiện số trên trục
  snapToGrid: boolean
}
```

### Axis Configuration

```ts
interface AxisConfig {
  visible: boolean
  xLabel: string             // mặc định "x"
  yLabel: string             // mặc định "y"
  color: string
  arrowVisible: boolean
  tickInterval: number
  showNumbers: boolean
  showOrigin: boolean        // hiện "O" tại gốc
}
```

---

# 70. Context Menu

Right-click (hoặc long-press trên touch) hiện context menu phù hợp:

### On Empty Canvas

```text
Paste                    (nếu clipboard có data)
Create Point Here
─────────────────
Zoom to Fit
Grid ▶ [Show/Hide | Cartesian | Isometric | Polar]
Axis ▶ [Show/Hide]
─────────────────
Settings
```

### On Point

```text
Rename
Edit Coordinates...
Set Style ▶
─────────────────
Snap to Grid
Make Free / Make Constrained
─────────────────
Construct ▶ [Midpoint | Perpendicular | Parallel | ...]
─────────────────
Hide / Show Label
Trace On/Off
─────────────────
Copy
Delete                   (with cascade warning)
```

### On Line/Segment

```text
Rename
Set Style ▶
─────────────────
Measure Length
Midpoint
Perpendicular...
Parallel...
Bisector...
─────────────────
Hide / Show Label
─────────────────
Copy
Delete
```

### On Circle

```text
Rename
Set Style ▶
─────────────────
Measure Radius
Measure Area
Measure Circumference
Tangent from Point...
─────────────────
Hide / Show Label
─────────────────
Copy
Delete
```

### On Polygon

```text
Rename
Set Style ▶
─────────────────
Measure Area
Measure Perimeter
Measure Angles
Diagonals
─────────────────
Classify ▶ [identify type: parallelogram, rectangle, etc.]
─────────────────
Copy
Delete
```

---

# 71. Copy/Paste System

Cho phép copy và paste geometry objects:

### Copy Behavior

```text
1. Copy 1 point:    paste → new free point tại offset (+20, +20)
2. Copy 1 segment:  paste → new segment (2 new free points) tại offset
3. Copy triangle:   paste → new triangle (3 new free points) giữ shape
4. Copy construction (vd: perpendicular): paste → replicate toàn bộ
   parent objects + construction relationships
```

### Clipboard Format

```ts
interface ClipboardData {
  type: 'geo-objects'
  objects: GeometryObject[]   // full object definitions
  relationships: Edge[]       // parent-child relationships
  offset: { x: number, y: number }  // paste offset
}
```

### Cross-document Copy

```text
- Copy từ workspace A → paste vào workspace B
- Sử dụng system clipboard (JSON format)
- Resolve naming conflicts khi paste (rename nếu trùng)
```

### Duplicate (Ctrl+D)

```text
Shortcut cho Copy + Paste ngay lập tức
Offset mặc định: (+20px, +20px)
```

---

## Bước tiếp theo

**Đừng bắt đầu code camera.**

Bước đầu tiên nên là:

1. **Setup project** với Nuxt 4 + TypeScript + cấu trúc thư mục chuẩn
2. **Xây Geometry Core** — primitives + construction graph + basic operations
3. **Xây Command Engine** — CRUD commands + undo/redo
4. **Xây 2D Renderer** — JSXGraph integration + mouse interaction
5. **Unit tests** — property-based testing cho geometry

Sau khi bước 1-5 chạy ổn → mới tiến tới Gesture Engine.

[1]: https://moet.gov.vn/content/vanban/Lists/VBPQ/Attachments/1483/vbhn-chuong-trinh-tong-the.pdf "CHƯƠNG TRÌNH GIÁO DỤC PHỔ THÔNG"
[2]: https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker/web_js "Hand landmarks detection guide for Web  |  Google AI Edge  |  Google for Developers"
[3]: https://www.jsxgraph.org/docs/ "Home - Documentation"
[4]: https://jsxgraph.org/docs/Transformation.html "Transformation - Documentation"
[5]: https://jsxgraph.org/docs/View3D.html "View3D - Documentation"
[6]: https://geogebra.github.io/docs/reference/en/GeoGebra_Apps_Embedding/ "GeoGebra Apps Embedding :: GeoGebra Manual"
[7]: https://www.geogebra.org/license "Licence - GeoGebra"
[8]: https://mathjs.org/docs/ "math.js | an extensive math library for JavaScript and Node.js"
[9]: https://katex.org/docs/browser.html "Browser · KaTeX"
[10]: https://nuxt.com/deploy/vercel "Deploy Nuxt to Vercel"
[11]: https://vercel.com/docs/plans/hobby "Vercel Hobby Plan"
[12]: https://supabase.com/pricing "Pricing & Fees | Supabase"
