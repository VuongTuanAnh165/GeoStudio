Mình nghĩ dự án này nên được xem như **một “hệ điều hành cho việc dạy hình học”**, chứ không phải một website vẽ hình có thêm camera.

Điểm quyết định thành bại là: **đừng xây “gesture → vẽ pixel”**. Hãy xây:

> **Gesture / Mouse / Touch / Pen → Intent → Geometry Command → Geometry Engine → Render**

Khi đó camera chỉ là **một phương thức nhập liệu**. Sau này bạn có thể thêm chuột, bút cảm ứng, giọng nói, AI… mà không phải đập lại phần hình học.

Chương trình Toán phổ thông Việt Nam cũng xác định mạch **“Hình học và Đo lường” từ lớp 1 đến lớp 12**, đồng thời chương trình được thiết kế theo hướng mở rộng và nâng cao dần. ([Bộ Giáo dục và Đào tạo][1])

---

# 1. Tầm nhìn sản phẩm

Tên tạm thời có thể là:

> **GeoGesture**
>
> Interactive Geometry Teaching Platform

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

> “Làm sao biết đoạn này vuông góc?”

> “Làm sao kéo điểm A thì đường cao tự chạy?”

> “Làm sao tính diện tích?”

> “Làm sao dựng tiếp đường tròn ngoại tiếp?”

> “Làm sao chuyển hình 2D thành hình 3D?”

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

Mình đề xuất chia Geometry Engine thành 7 tầng.

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

Bạn không nên tạo class kiểu:

```ts
Triangle
Circle
Rectangle
```

rồi càng ngày càng thêm hàng trăm class.

Nên có một **Geometry Object Model** thống nhất.

Ví dụ:

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

Nhưng mỗi object phải có:

```ts
{
  id,
  type,
  parents,
  definition,
  constraints,
  style,
  metadata
}
```

Ví dụ điểm:

```json
{
  "id": "P1",
  "type": "point",
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

Đây là nền tảng cực kỳ quan trọng.

---

# 5. Bộ đối tượng phải hướng tới

Để phục vụ lớp 1 → 12, mình sẽ thiết kế taxonomy ngay từ đầu.

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

---

# 6. Các phép dựng hình

Đây phải là **Construction Registry**, không hard-code rải rác.

Ví dụ:

```ts
constructionRegistry.register({
  id: "perpendicular-line",
  inputs: [
    "point",
    "line"
  ],
  output: "line"
})
```

Sau đó bạn có thể mở rộng:

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
└── ...
```

Điểm hay là sau này bạn chỉ việc thêm:

```text
new construction
```

chứ không sửa camera engine.

---

# 7. Constraint Engine

Đây là phần giúp hình **“thông minh”**.

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

---

# 8. Đừng phụ thuộc vào tọa độ pixel

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

---

# 9. Toàn bộ hệ thống thao tác phải có Command

Mình đề nghị chuẩn hóa command:

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

MEASURE_DISTANCE
MEASURE_ANGLE
MEASURE_AREA

SHOW_LABEL
HIDE_LABEL
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
 ─┘
```

Đây là kiến trúc cực kỳ quan trọng.

---

# 10. Gesture Engine

MediaPipe hiện cung cấp **Hand Landmarker cho web/JavaScript**, trả về landmarks của bàn tay và hỗ trợ chế độ video/live camera; kết quả có 21 landmarks cho mỗi bàn tay. Google cũng cung cấp Gesture Recognizer riêng cho nhận diện gesture thời gian thực. ([Google AI for Developers][2])

Package web hiện tại là:

```bash
npm install @mediapipe/tasks-vision
```

([Google AI for Developers][2])

Nhưng mình **không khuyên sử dụng Gesture Recognizer có sẵn làm toàn bộ hệ thống gesture**.

Nó chỉ nên là tầng thấp.

---

# 11. Gesture Engine nên chia thành 4 tầng

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

# 12. Gesture không nên tương đương trực tiếp với hành động

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

# 13. Bộ gesture ban đầu

Mình sẽ thiết kế khoảng 10–15 gesture semantic, nhưng chỉ bật một số ít trong MVP.

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

# 14. Cực kỳ quan trọng: Gesture State Machine

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

Điều này sẽ loại bỏ phần lớn lỗi:

> “Tôi chưa muốn chọn mà nó cứ click.”

---

# 15. MediaPipe phải chạy Web Worker

Đây là một điểm mình muốn bạn làm **ngay từ đầu**.

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

Đừng để camera tracking làm lag bảng hình học.

---

# 16. Lớp “Smart Drawing”

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

> AI/recognizer giúp “hiểu” nét vẽ, nhưng Geometry Engine quyết định hình cuối cùng.

---

# 17. Smart Snap

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

---

# 18. Hệ thống vẽ phải có Undo/Redo dạng Command

Không nên snapshot toàn bộ canvas mỗi lần.

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

Rất phù hợp giảng dạy.

---

# 19. Renderer

Mình khuyên:

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

Ban đầu mình **chưa cần Three.js**.

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

Như vậy không khóa kiến trúc.

---

# 20. Vì sao không dùng GeoGebra làm nền?

GeoGebra cực mạnh, và API embedding tồn tại. ([GeoGebra][6])

Nhưng mình **không chọn nó làm lõi của sản phẩm mới**.

Lý do là license của GeoGebra có những điều kiện khác nhau giữa source code, web services/materials và mục đích thương mại; trang license chính thức nói rõ việc sử dụng cho mục đích thương mại cần license phù hợp. ([GeoGebra][7])

Trong khi JSXGraph có dual license LGPL/MIT, với MIT phù hợp hơn cho hướng xây ứng dụng riêng. ([JSXGraph][3])

---

# 21. Mathematical Engine

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
```

Không để logic hình học phụ thuộc hoàn toàn vào mathjs.

```text
Geometry Core
      │
      ├── custom geometric algorithms
      │
      └── mathjs
```

---

# 22. Công thức / biểu thức toán

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

---

# 23. Hệ 3D phải nằm trong data model ngay từ đầu

Đừng làm:

```text
2D trước

sau này:
3D = viết lại toàn bộ
```

Ngay từ đầu object model phải cho phép:

```ts
Point2D
Point3D

Line2D
Line3D

Plane3D

Circle2D
Sphere3D

Polygon2D
Polyhedron3D
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

# 24. Bộ 3D cần hướng tới

```text
Point
Line
Segment
Plane

Prism
Cube
Cuboid
Pyramid
Cylinder
Cone
Sphere
Frustum

Section Plane
Cross Section
Net
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
Angle Line-Line
Angle Line-Plane
Angle Plane-Plane
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

# 25. Hệ biến đổi

Ngay từ đầu:

```text
Translation
Rotation
Reflection
Scaling
Homothety
Symmetry
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

---

# 26. Coordinate Geometry

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
```

Đặc biệt:

```text
y = ax + b

x² + y² = r²

y = ax² + bx + c
```

Sau này mới mở rộng analytic geometry.

---

# 27. Dynamic Geometry

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

> “vẽ hình”

thành:

> **“khám phá hình học”**.

---

# 28. Locus

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

---

# 29. Curriculum Engine

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

# 30. Mình sẽ không hard-code “bài lớp 7”

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

# 31. UI của giáo viên

Mình hình dung workspace như sau:

```text
┌──────────────────────────────────────────────────────────┐
│ GeoGesture                            Camera ● Ready     │
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
└──────────────────────────────────────────────┘
```

Không hiện UI thừa.

---

# 32. Mouse/Touch bắt buộc phải tồn tại

Đây là một nguyên tắc mình rất muốn giữ.

Không được biến sản phẩm thành:

> “Camera không hoạt động → website vô dụng.”

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
InputIntent
```

Camera chỉ là phương thức nhập liệu ưu tiên.

---

# 33. Accessibility

Có giáo viên:

* không muốn dùng camera
* ánh sáng phòng học kém
* webcam chất lượng thấp
* đeo kính
* đứng quá xa
* có chuyển động nhiều phía sau

Vì thế luôn có:

```text
Camera Mode
Touch Mode
Mouse Mode
Presentation Mode
```

---

# 34. Privacy

Mình khuyên **không upload hình camera lên server**.

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

---

# 35. Công nghệ mình chốt

## Frontend

```text
Nuxt
Vue 3
TypeScript
Pinia
VueUse
```

Mình nghiêng về **Nuxt hiện hành**; nếu bạn muốn giữ Nuxt 3 vì đã quen thì kiến trúc này vẫn áp dụng được.

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

## Local storage

```text
IndexedDB
```

và có thể dùng thư viện `idb`.

---

## Testing

```text
Vitest
Playwright
fast-check
```

---

# 36. Repo nên thiết kế như thế này

```text
geo-gesture/
│
├── app/
│   ├── pages/
│   ├── components/
│   ├── layouts/
│   └── composables/
│
├── packages/
│   │
│   ├── geometry-core/
│   │   ├── primitives/
│   │   ├── constructions/
│   │   ├── constraints/
│   │   ├── measurements/
│   │   ├── transformations/
│   │   ├── intersections/
│   │   ├── solver/
│   │   └── index.ts
│   │
│   ├── geometry-renderer/
│   │   ├── jsxgraph/
│   │   └── three/
│   │
│   ├── gesture-engine/
│   │   ├── landmarks/
│   │   ├── features/
│   │   ├── gestures/
│   │   ├── state-machine/
│   │   └── worker/
│   │
│   ├── input-engine/
│   │   ├── camera/
│   │   ├── mouse/
│   │   ├── touch/
│   │   └── stylus/
│   │
│   ├── command-engine/
│   │
│   ├── document-engine/
│   │
│   └── curriculum-engine/
│
├── content/
│   ├── grades/
│   │   ├── grade-01/
│   │   ├── ...
│   │   └── grade-12/
│   └── constructions/
│
├── public/
│   ├── models/
│   └── icons/
│
├── tests/
│   ├── geometry/
│   ├── gesture/
│   ├── commands/
│   └── e2e/
│
└── package.json
```

Đây là dạng monorepo nhưng vẫn rất dễ quản lý.

---

# 37. Data của một bài học

Ví dụ bài:

> Dựng đường cao tam giác ABC.

Không lưu hình ảnh.

Lưu:

```json
{
  "document": {
    "version": 1,
    "title": "Đường cao tam giác",
    "grade": 7
  },

  "objects": [
    {
      "id": "A",
      "type": "point"
    },
    {
      "id": "B",
      "type": "point"
    },
    {
      "id": "C",
      "type": "point"
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
      }
    }
  ]
}
```

Renderer chỉ đọc document này.

---

# 38. Export

Ngay giai đoạn đầu nên có:

```text
Save
Load
Undo
Redo

Export PNG
Export SVG
Export JSON
Print
```

Sau đó:

```text
Export PDF
PowerPoint
Lesson Package
```

PDF không nhất thiết cần server; có thể xây từ SVG/print pipeline ở client.

---

# 39. AI chưa nên nằm trong MVP

Mình nói điều này khá mạnh:

**Đừng bắt đầu bằng LLM.**

MVP:

```text
Geometry Engine
+
Gesture Engine
+
Rendering
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

# 40. Có thể thêm Voice về sau

Ví dụ:

> “Tạo điểm A.”

→

```text
CREATE_POINT(A)
```

> “Kẻ đường thẳng qua C vuông góc AB.”

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
```

đều điều khiển **cùng một Command Engine**.

Đó mới là kiến trúc mở rộng tốt.

---

# 41. Lộ trình xây dựng

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

# 42. PHASE 1 — Geometry Core

Làm trước:

```text
Point
Segment
Line
Ray
Circle
Arc
Polygon
Angle
Vector
```

Sau đó:

```text
Intersection
Distance
Angle
Area
Perimeter
```

Chưa camera.

Mọi thứ phải chạy bằng unit test.

---

# 43. PHASE 2 — Construction Engine

Xây:

```text
Midpoint
Projection
Parallel
Perpendicular
Bisector
Median
Altitude
Intersection
Circle through points
Circumcircle
Incircle
Tangent
```

Sau mỗi construction:

```text
Create
Move parents
Recalculate
Validate
```

---

# 44. PHASE 3 — 2D Renderer

Đưa Geometry Core lên UI.

Mục tiêu:

```text
Create
Select
Move
Delete
Snap
Measure
Label
Undo
Redo
```

bằng chuột.

**Nếu phiên bản chuột chưa tốt thì tuyệt đối chưa làm gesture.**

---

# 45. PHASE 4 — Command Engine

Khi user click:

```text
click A
click B
```

→ command:

```text
CREATE_SEGMENT(A,B)
```

Sau đó render.

Lúc này camera vẫn chưa cần tồn tại.

---

# 46. PHASE 5 — Gesture Engine

Lúc này mới:

```text
Camera
 ↓
MediaPipe
 ↓
Worker
 ↓
Landmarks
 ↓
Gesture State Machine
 ↓
Intent
 ↓
Command
```

Gesture chỉ được phép tạo Command.

Không được đụng trực tiếp renderer.

---

# 47. PHASE 6 — Smart Snap + Gesture Drawing

Thêm:

```text
Smart point
Smart line
Smart circle
Smart triangle
Smart angle
```

và:

```text
Freehand → shape recognition
```

nhưng recognition chỉ là helper.

---

# 48. PHASE 7 — Curriculum 1 → 12

Lúc này mới mapping:

```text
Grade 1
Grade 2
...
Grade 12
```

với:

```text
Concept
Objects
Construction
Measurement
Transformation
Exercise templates
```

Không cần viết lại Geometry Engine.

---

# 49. PHASE 8 — 3D

Thêm:

```text
Point3D
Line3D
Plane
Prism
Pyramid
Cylinder
Cone
Sphere
```

Sau đó:

```text
section
projection
distance
angle
volume
surface
```

---

# 50. PHASE 9 — Teacher Features

Làm:

```text
Lesson
Presentation
Save
Templates
Library
Export
```

và:

```text
Step-by-step construction
Replay
Hide/show construction
Annotations
Text
Formula
Images
```

---

# 51. PHASE 10 — AI Layer

Cuối cùng:

```text
Voice → Geometry
Text → Geometry
Image → Geometry
Geometry → Explanation
Geometry → Exercise
Geometry → Solution
```

Lúc đó AI không phá kiến trúc.

---

# 52. PHASE 11 — Production QA

Phải test ở 4 tầng.

### Geometry

```text
Unit tests
Property tests
Numerical tolerance
```

Ví dụ:

```text
Construct perpendicular(L,P)

assert angle(L,L2) ≈ 90°
```

---

### Gesture

Không nên test bằng webcam trong CI.

Thay vào đó lưu:

```text
gesture fixtures
```

Ví dụ:

```text
pinch-start.json
pinch-drag.json
swipe-left.json
point.json
fist.json
```

rồi replay.

---

### UI

Dùng:

```text
Playwright
```

để test:

```text
create point
create triangle
move point
undo
redo
save
load
export
```

---

### Camera Performance

Test:

```text
FPS
latency
CPU
memory
hand tracking stability
false positives
```

---

# 53. Một điều đặc biệt quan trọng với classroom

Phải có **Calibration Mode**.

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

---

# 54. Gesture phải có visual feedback

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
└─────────────────┘
```

Có thể tắt HUD trong presentation mode.

---

# 55. Free stack / chi phí

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

Điều này rất phù hợp cho prototype.

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

# 56. Có cần Supabase ngay không?

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

Vì vậy mình sẽ không biến Supabase thành dependency của Geometry Engine.

---

# 57. Deployment architecture

Cuối cùng:

```text
GitHub
   │
   ▼
Vercel
   │
   ├── Nuxt App
   │
   ├── Static Assets
   │      ├── MediaPipe WASM
   │      └── Model
   │
   └── Optional API
          │
          └── Supabase
```

Nuxt có hỗ trợ Vercel chính thức và việc deploy qua Git được tài liệu Nuxt mô tả là zero-configuration. ([Nuxt][10])

---

# 58. Thứ tự công nghệ mình chốt

| Thành phần    | Công nghệ                            |
| ------------- | ------------------------------------ |
| Framework     | **Nuxt + Vue 3**                     |
| Language      | **TypeScript**                       |
| Geometry      | **JSXGraph**                         |
| Math          | **mathjs**                           |
| Formula       | **KaTeX**                            |
| Hand tracking | **MediaPipe**                        |
| Gesture       | **Custom Gesture Engine**            |
| State         | **Pinia**                            |
| Validation    | **Zod**                              |
| Local data    | **IndexedDB**                        |
| 3D ban đầu    | **JSXGraph View3D**                  |
| 3D nâng cao   | **Three.js**                         |
| Tests         | **Vitest + Playwright + fast-check** |
| Git           | **GitHub**                           |
| Hosting       | **Vercel**                           |
| Cloud sau này | **Supabase**                         |

Tất cả những thành phần cốt lõi này đều có thể bắt đầu theo hướng miễn phí/open-source; JSXGraph đặc biệt có license MIT/LGPL, còn MediaPipe cung cấp package trực tiếp cho Web/JS. ([JSXGraph][3])

---

# 59. Những thứ tuyệt đối không nên làm

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

Tận dụng renderer hiện có.

### ❌ Không đưa LLM vào Geometry Core

LLM chỉ tạo intent/command.

### ❌ Không làm 100 gesture ngay

Làm ít nhưng ổn định.

### ❌ Không bỏ mouse

Mouse là fallback và công cụ debug.

### ❌ Không đưa camera inference lên server

Giữ xử lý ở client.

---

# 60. Một chiến lược rất quan trọng: “Foundation Complete” ≠ “Feature Complete”

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
Camera

Save
Load
Export
```

Sau đó:

```text
v0.2
→ quadrilateral

v0.3
→ transformation

v0.4
→ coordinate geometry

v0.5
→ 3D

v0.6
→ curriculum

v0.7
→ teacher lesson

v0.8
→ AI

v1.0
→ full platform
```

**Nhưng toàn bộ các version vẫn chạy trên cùng Geometry Core.**

---

# 61. Kiến trúc cuối cùng mình khuyên bạn chốt

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
                         │ COMMAND ENGINE   │
                         └────────┬─────────┘
                                  ▼
              ┌──────────────────────────────────┐
              │         GEOMETRY CORE            │
              │                                  │
              │ Primitive                        │
              │ Construction                     │
              │ Constraint                       │
              │ Measurement                       │
              │ Transformation                   │
              │ Intersection                     │
              │ Solver                           │
              └───────────────┬──────────────────┘
                              ▼
                    Construction Graph
                              │
                  ┌───────────┴───────────┐
                  ▼                       ▼
            2D Renderer               3D Renderer
            JSXGraph                 JSXGraph/Three
                  │                       │
                  └───────────┬───────────┘
                              ▼
                           CANVAS
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
               Measurement          Annotation
                    │                   │
                    └─────────┬─────────┘
                              ▼
                       DOCUMENT MODEL
                              │
                   ┌──────────┴──────────┐
                   ▼                     ▼
               IndexedDB              Export
```

Đây là kiến trúc mình cho rằng **đáng để bắt đầu ngay từ đầu**, vì nó cho phép bạn đi từ một tam giác đơn giản đến dựng hình Euclid, hình giải tích, vector, tọa độ, mặt phẳng, hình không gian… mà **gesture không trở thành điểm nghẽn kiến trúc**.

Một hướng tham khảo rất gần với ý tưởng của bạn là **Sketchometry**, vốn đã sử dụng các gesture để tạo các đối tượng hình học; còn JSXGraph là nền interactive geometry mạnh hơn để làm engine/rendering. ([JSXGraph][3])

![Image](https://images.openai.com/static-rsc-4/ru_Wn-hX4bRZhkRum5Nsa0DxUMQMACIipEHg10ummlP-REH-gyG3f4a4-rVDMF_OvJqJrxBph68zrCydWQXEMWtzirE4SUIxbDuwXqy46WrgHPNpVOM1k2MwA8GHnVrlPw0Htej1KWSZZm_isfguPcNy9SLXoF2V-LNa4hskUeXaT7SSBkDe0RnAankyAPak?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/_-S8XjBRArLeK7UZ-7p0n4EPB0Ff2tkn27lEyQu_qQzLCLfEllDOY7K-mTO6D8eKM7qkh7vVwQj_Ojl5x6jljKkXDT-xdUuEBLWuEsKuCQeVoKOP7d2gb7o_5l5F5SB1sWK7XDsZMUw34rKm0NCFwvqPOW41M_ozO6_0OnFmrVVAvETkIJBwM6E8kE99_OtP?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/zI4rx9VU2wixjUVv9FvnsZvcgf9TzhnL3C0oKgU0T_eN-yWJCptIz5oSj1bgZn9y6A1ZYBf7Snz4ypIqYpYzllNqN7zs-2OpBIZnbuoxlVNRsmadjceZJPfJb2ARdDitv8SevWGKmxadIaDEZxXb99198fSlHqsGj6nllMt3VF1NpZ9efZWQEsOWg1rAqtRR?purpose=fullsize)

## Bước mình khuyên làm ngay

**Đừng bắt đầu code camera.**

Bước đầu tiên nên là tạo một **“Geometry Capability Specification”**: mình sẽ cùng bạn liệt kê **toàn bộ các đối tượng + phép dựng + phép đo + phép biến đổi + trường hợp 2D/3D + gesture tương ứng từ lớp 1 → 12**, rồi chuyển nó thành **kiến trúc folder + TypeScript interfaces + `GeometryObject` schema + `Command` schema + `Construction Registry`**.

Đó sẽ là “bản thiết kế kỹ thuật” của dự án; sau khi chốt nó, phần code về sau sẽ có đường ray rất rõ.

[1]: https://moet.gov.vn/content/vanban/Lists/VBPQ/Attachments/1483/vbhn-chuong-trinh-tong-the.pdf?utm_source=chatgpt.com "CHƯƠNG TRÌNH GIÁO DỤC PHỔ THÔNG"
[2]: https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker/web_js "Hand landmarks detection guide for Web  |  Google AI Edge  |  Google for Developers"
[3]: https://www.jsxgraph.org/docs/?utm_source=chatgpt.com "Home - Documentation"
[4]: https://jsxgraph.org/docs/Transformation.html?utm_source=chatgpt.com "Transformation - Documentation"
[5]: https://jsxgraph.org/docs/View3D.html?utm_source=chatgpt.com "View3D - Documentation"
[6]: https://geogebra.github.io/docs/reference/en/GeoGebra_Apps_Embedding/?utm_source=chatgpt.com "GeoGebra Apps Embedding :: GeoGebra Manual"
[7]: https://www.geogebra.org/license?utm_source=chatgpt.com "Licence - GeoGebra"
[8]: https://mathjs.org/docs/?utm_source=chatgpt.com "math.js | an extensive math library for JavaScript and Node.js"
[9]: https://katex.org/docs/browser.html?utm_source=chatgpt.com "Browser · KaTeX"
[10]: https://nuxt.com/deploy/vercel?utm_source=chatgpt.com "Deploy Nuxt to Vercel"
[11]: https://vercel.com/docs/plans/hobby?utm_source=chatgpt.com "Vercel Hobby Plan"
[12]: https://supabase.com/pricing?utm_source=chatgpt.com "Pricing & Fees | Supabase"
