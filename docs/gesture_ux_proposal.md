# Tầm Nhìn Kiến Trúc Tương Tác Cử Chỉ: GeoStudio Spatial OS (Dài Hạn & Mở Rộng)

Bạn hoàn toàn chính xác. Việc chỉ gán "1 ngón = Điểm, 2 ngón = Đường thẳng" là một giải pháp tình thế (hack), chỉ giải quyết được bề nổi. Khi GeoStudio có tới 30-50 công cụ hình học (Góc, Trung điểm, Đường trung trực, Quỹ tích...), việc dùng số lượng ngón tay hay Radial Menu tĩnh sẽ ngay lập tức **phá sản** vì giới hạn trí nhớ người dùng và không gian hiển thị.

Để tạo ra một UI/UX trên Camera thực sự mang tính cách mạng, dễ dùng, không mỏi tay (Gorilla Arm) và **mở rộng vô hạn**, chúng ta cần đập bỏ tư duy "dùng tay thay chuột" và thay bằng **Tư duy Không Gian (Spatial & Contextual UX)** như cách Apple Vision Pro hoặc các phần mềm CAD hiện đại (Shapr3D) đang làm.

Dưới đây là **Kiến trúc Tương tác Dài hạn** cho hệ thống Camera của GeoStudio:

---

## 1. Vấn Đề Cốt Lõi Của Camera Hiện Tại
1. **Gorilla Arm (Mỏi tay):** Mapping 1-1 buộc người dùng phải vung tay ra tận góc màn hình để chạm vào Toolbar. Rất mỏi và thiếu chính xác.
2. **Jitter khi Click:** Khi kẹp ngón tay (Pinch), bàn tay tự nhiên bị rung nhẹ làm trỏ chuột trượt khỏi mục tiêu.
3. **Quá nhiều Công cụ:** Giao diện truyền thống có quá nhiều nút bấm bé xíu, không phù hợp cho thao tác bằng tay trong không gian.

---

## 2. Giải Pháp UX Đột Phá: Contextual Geometry (Hình Học Ngữ Cảnh)

Để mở rộng vô hạn số lượng công cụ mà không cần nhồi nhét vào Menu, chúng ta sẽ **Xóa bỏ khái niệm "Chọn Công Cụ Trước" (Pre-selection)**. Thay vào đó, áp dụng **"Chọn Đối Tượng Trước, Chức Năng Sau" (Post-selection Context)**.

**Cách hoạt động:**
- Bạn luôn ở chế độ **Mặc định (Select/Move)**.
- Bạn kẹp ngón tay vào khoảng trống -> Tạo ra một **Điểm**.
- Bạn chọn Điểm A, sau đó chọn Điểm B. Lập tức, một **Bảng Gợi Ý Nhỏ (Context Menu)** nổi lên ngay tại con trỏ tay của bạn với các nút cực to:
  - 📏 Tạo Đường Thẳng (Line)
  - ➖ Tạo Đoạn Thẳng (Segment)
  - ⏺️ Tạo Đường Tròn tâm A qua B
  - ➗ Lấy Trung Điểm (Midpoint)
- Bạn chọn 2 Đường thẳng -> Menu nổi lên gợi ý: Tạo Giao Điểm (Intersect), Đo Góc (Angle).

**Ưu điểm vượt trội:** 
- Bạn KHÔNG BAO GIỜ phải di chuyển tay ra mép màn hình để chọn Tool. Mọi thao tác diễn ra ngay tại trung tâm bản vẽ.
- Mở rộng vô hạn: Có 100 tính năng cũng được, vì hệ thống chỉ hiển thị các tính năng hợp lệ dựa trên những gì bạn vừa chọn.

---

## 3. Hệ Thống Điều Hướng Mới (Precision Navigation)

Để khắc phục rung lắc và mỏi tay, chúng ta nâng cấp Engine:

### A. Relative Acceleration (Gia tốc tương đối như Chuột máy tính)
- Thay vì map tọa độ tay 1-1 với màn hình (bắt buộc phải vung tay rộng), chúng ta tính toán **Gia tốc**. 
- Nếu bạn vẩy nhẹ cổ tay nhanh, trỏ chuột bay vèo sang bên kia màn hình. Nếu bạn di chuyển chậm, trỏ chuột di chuyển từng pixel. 
- **Kết quả:** Bạn có thể để khuỷu tay tựa lên bàn (hoàn toàn không mỏi) và chỉ cần lắc nhẹ cổ tay để điều khiển toàn bộ màn hình.

### B. Magnetic Snapping (Lực Hút Nam Châm)
- Khi con trỏ tiến gần đến một Điểm, Đường thẳng, hoặc Nút bấm, con trỏ sẽ bị **"hút" (snap)** dính chặt vào đối tượng đó.
- Dù tay bạn có rung, con trỏ vẫn nằm ngoan ngoãn trên mục tiêu.

### C. Pinch-Lock (Khóa rung khi Click)
- Ngay khoảnh khắc hệ thống nhận diện bạn đang kẹp tay (Pinch), tọa độ con trỏ sẽ bị **đóng băng (freeze) trong 150ms**. Điều này triệt tiêu hoàn toàn hiện tượng "vừa click vừa bị trượt" do rung tay.

---

## 4. Tích Hợp Ký Hiệu Tay Trái (Quick Gestures / Muscle Memory)

Những công cụ dùng nhiều nhất (chiếm 80% thời gian) vẫn cần đường tắt cực nhanh (như ý tưởng của bạn):
Tay trái sẽ là bộ **Macro (Phím tắt)**:
- **Giơ 1 ngón:** Kích hoạt vẽ nhanh liên tục (Polyline).
- **Giơ 2 ngón (V):** Chế độ Thước đo (Đo khoảng cách/Góc).
- **Nắm Đấm (Fist):** Kích hoạt Pan (Kéo dời toàn bộ bản vẽ). Tay phải cứ thế vuốt để cuộn.
- **Hai Tay Chạm Xa/Gần:** Zoom In/Out mượt mà.

---

## 5. Lộ Trình Triển Khai (Roadmap)

Nếu làm theo hướng này, GeoStudio sẽ sở hữu hệ thống Gesture đỉnh nhất hiện nay trên Web. Lộ trình code:

**Giai đoạn 1: Sửa lõi Core Movement (Giải quyết mỏi & khó dùng)**
1. Viết lại `CursorFilter.ts` để tích hợp **Gia Tốc (Acceleration)** và **Relative Mode**.
2. Thêm logic **Pinch-Lock** (chống rung khi click).

**Giai đoạn 2: Xây dựng Contextual Logic (Mở rộng công cụ)**
1. Sửa đổi `GestureDOMBridge` để không bấm nút Toolbar nữa, mà tập trung vào Select đối tượng trên JSXGraph.
2. Thiết kế Component `ContextualFloatingMenu.vue`: Hiển thị các chức năng dựa trên mảng các object đang được Select.

**Giai đoạn 3: Bảng Hướng Dẫn Hoàn Thiện (UI/UX)**
1. Tạo màn hình Welcome/Onboarding khi bật Camera: Hướng dẫn người dùng tư thế để tay, cách vẩy cổ tay thay vì vung tay.
2. Hiển thị HUD xịn xò.

---

Bạn đánh giá thế nào về **Tầm Nhìn Kiến Trúc** này? Nó không chỉ giải quyết cái khó dùng hiện tại bằng Gia tốc + Nam châm, mà còn giải quyết bài toán "Mở rộng Scale" bằng Context Menu. 

Nếu bạn duyệt, tôi sẽ đóng các file hiện tại và bắt tay ngay vào **Giai đoạn 1: Chế tạo Relative Mouse & Pinch-Lock (để thao tác trỏ và click mượt và nhạy như thật)**!
