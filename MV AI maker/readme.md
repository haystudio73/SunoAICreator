# Hướng dẫn làm MV Lipsync bằng AI — Claude.ai Project + Meta.ai

---

## 1. Thông tin

> Tài liệu nội dung chi tiết của video hướng dẫn **`Huong_dan_MV_Lipsync_AI.mp4`**, đi kèm file phụ đề **`Huong_dan_MV_Lipsync_AI.lrc`**.

---

## 2. Hướng dẫn chi tiết

### Bước 1 — Chuẩn bị nhạc & lyrics

- **File nhạc `.mp3`**: bản hoàn chỉnh (bản final từ Suno).
- **File lyrics đầy đủ**: trích xuất từ Suno bằng công cụ. Nên giữ **timecode từng câu** (định dạng `.lrc`, ví dụ `[00:12.40] Câu hát số 1…`). Có timecode, Claude chia scene khớp đúng câu hát và bạn cắt audio cho cảnh hát dễ hơn.
- **Ảnh ref có sẵn** (nếu có): ảnh ca sĩ, bối cảnh. Gom vào một thư mục, ví dụ `Anh_ref/`.
- Đặt tên file gọn, không dấu: `TenBai.mp3`, `TenBai_lyrics.lrc`.

### Bước 2 — Lập kế hoạch trên Claude.ai Project

**2.1 Tạo Project**
1. Trên Claude.ai, tạo Project mới, đặt tên theo bài hát, ví dụ **"MV – Tên bài hát"**.
2. Dán toàn bộ nội dung file **`MV_AI_Agent_Instruction.md`** vào phần **Instructions** của Project.
3. Mở chat trong Project, tải lên file `.mp3`, file lyrics và ảnh ref.
4. Gõ: **"Bắt đầu làm MV lipsync cho bài này"**. Claude tóm tắt bài hát rồi hỏi từng bước. Nếu Claude không đọc được audio, nó sẽ hỏi thời lượng và timecode: trả lời theo file lyrics có timecode.

**2.2 Trả lời câu hỏi của Claude**

| Câu hỏi | Chọn |
|---|---|
| Hướng storyboard | **2. MV ca sĩ lipsync** |
| Tỉ lệ khung hình | **16:9** (YouTube) hoặc **9:16** (Reels, TikTok) |
| Model video | **Meta AI**, mỗi scene tối đa **10 giây** |
| Có tạo audio trong clip? | **3. Lipsync**: prompt mỗi cảnh hát sẽ có dòng `LYRICS` |
| Phong cách, chất liệu điện ảnh | Chọn theo mood bài hát |
| Storyboard | Đọc kỹ cột **LIP** và lời hát từng scene rồi mới duyệt |

**2.3 Kiểm tra & điều chỉnh prompt.** Với mỗi scene, kiểm tra:
- Dòng **`LYRICS`** đúng câu hát và đúng mốc giây của scene.
- Có đủ các khóa: **CHARACTER / LOCATION / TIME / CAMERA / ANGLE LOCK**, và **PROP LOCK** nếu có đạo cụ.
- Thời lượng mỗi scene **≤ 10 giây**.
- Muốn sửa, nhắn thẳng cho Claude, ví dụ: *"Scene 5 đổi sang cận mặt, giữ nguyên lock"*.

### Bước 3 — Tạo ảnh tham chiếu

- Dùng **prompt ảnh trong Asset Sheet** mà Claude đã tạo.
- **Nhân vật**: ảnh xoay 4 góc (trước, 3/4, nghiêng, sau) + 1 ảnh chân dung cận mặt.
- **Bối cảnh**: toàn cảnh, không có người. **Vật thể**: đặt trên nền trơn.
- Đặt tên file theo ID: `CHAR_A.png`, `LOC_01.png`, `PROP_01.png`. Khi đính kèm trên Meta, bạn biết ngay ảnh nào là gì.
- Chọn ảnh **rõ mặt, đủ sáng, không chữ, không logo**: nhân vật sẽ ổn định hơn giữa các clip.

### Bước 4 — Tạo clip trên Meta.ai

**4.1 Tạo từng clip**
1. Mở **meta.ai**, đăng nhập.
2. Nhấn **dấu +** cạnh ô nhập để đính kèm ảnh ref của scene (nhân vật, bối cảnh, đạo cụ).
3. Dán prompt của scene, có đủ các dòng **LOCK** và **LYRICS**.
4. Gửi, chờ Meta render, rồi xem kỹ **khẩu hình**, nhân vật và bối cảnh.
5. Làm **lần lượt từng scene** theo thứ tự storyboard.

**4.2 Khi Meta tạo chưa đúng yêu cầu**
- Đừng sửa lan man trên clip lỗi: **đề nghị Meta tạo lại một clip MỚI**.
- Nói rõ điểm cần sửa và yêu cầu giữ nguyên phần còn lại (nhân vật, bối cảnh, góc máy).
- **Luôn đính kèm lại ảnh ref bằng dấu +** cùng prompt lock, kể cả khi tạo lại.
- Clip đạt thì ghi chú số scene, ví dụ `S05_ok`, để lúc tải về sắp đúng thứ tự.

### Bước 5 — Tải toàn bộ clip bằng extension Chrome

**5.1 Cài extension "Meta.AI Video Downloader — Bulk & Auto Queue"**
1. Mở repo **https://github.com/haystudio73/SunoAICreator**, bấm **Code → Download ZIP**.
2. Giải nén, tìm thư mục **`Download Meta Video`**.
3. Trong Chrome, mở **`chrome://extensions`**, bật **Developer mode** (góc trên bên phải).
4. Bấm **Load unpacked** → chọn thư mục `Download Meta Video`.
5. ⚠️ Extension xin quyền đọc **mọi trang web** (`<all_urls>`), ngoài `meta.ai` và `fbcdn.net`. Chỉ cài khi bạn tin nguồn này. Bạn có thể tắt extension khi không dùng.

**5.2 Tải clip hàng loạt**
1. Mở **meta.ai**, bấm icon extension để mở **Side Panel**.
2. Bấm **Scan Page**, rồi cuộn trang để extension nhận đủ các clip.
3. Tick chọn clip, dùng **Auto New Name** để đặt tên `01, 02, 03…` theo thứ tự từ trên xuống. Có các mẫu tên `clip_01.mp4`, `01_clip.mp4`, `01.mp4`. **Kiểm tra lại thứ tự so với storyboard**, vì trang Meta có thể xếp clip mới nhất lên đầu.
4. Bấm **Select Folder** để chọn thư mục lưu, rồi **Start Auto Queue**. Extension tải lần lượt **từng file một**, có Pause / Resume / Skip / Retry Failed.
5. Clip tải về là file `.mp4` gốc, **không bị watermark Meta AI đè lên**.

### Tip & trick — Cảnh hành động liên tục > 20 giây

Meta AI tạo mỗi clip ngắn (≤ 10 giây), nên cảnh dài phải **ghép từ nhiều clip** sao cho nhìn như một cảnh liền:

1. **Chia hành động thành 3 nhịp khoảng 7 giây**: mở đầu → cao trào → kết.
2. **Clip đạt thì dùng Extend** (kéo dài) của Meta thay vì tạo lại từ đầu.
3. **Frame cuối clip trước = ảnh đầu clip sau**: chụp frame cuối, đính kèm bằng dấu +, và yêu cầu *"Continue seamlessly from the attached frame"*.
4. **Giữ nguyên ảnh ref và các dòng LOCK, chỉ đổi dòng `ACTION`** ở mỗi nhịp.
5. **Cuối mỗi clip giữ tư thế ổn định khoảng 0,5 giây** để có điểm nối sạch.
6. **Máy quay chuyển động cùng một hướng** ở mọi nhịp, đứng cùng phía trục 180°.
7. **Khi dựng: cắt ngay lúc nhân vật đang chuyển động** và crossfade 2–4 frame ở điểm nối.
8. **Cảnh hát lipsync**: mỗi clip chỉ 1–2 câu, quay cận hoặc trung cảnh, miệng không bị che.

### Bước 6 — Dựng & xuất MV

1. Đưa **nhạc gốc `.mp3`** vào phần mềm dựng, xếp clip theo đúng timecode của storyboard.
2. **Khớp khẩu hình**: nghe giọng hát và nhìn miệng, dịch clip **±2–3 frame** nếu lệch.
3. Nếu cần, thêm phụ đề lời bài hát từ file `.lrc`.
4. Xuất **MP4 1080p**.
5. Khi đăng MV, **gắn nhãn nội dung tạo bằng AI** nếu nền tảng yêu cầu.

---

## 3. Prompt mẫu

**Prompt một scene hát cho Meta AI** (Claude sẽ tạo theo mẫu này):

```text
[SCENE 05 | 00:42–00:50 | 8s | Meta AI | 16:9]
REFS: image 1 = CHAR_A, image 2 = LOC_02, image 3 = PROP_01
SHOT: close-up, eye-level.
ACTION: 0–4s she sings softly, looking at the camera; 4–8s she smiles and tilts her head.
LYRICS (LIP only): 0–4s "Câu hát số 1…"; 4–8s "Câu hát số 2…" – sung in Vietnamese, lip-sync only, not shown on screen.
CHARACTER LOCK: CHAR_A exactly as image 1 – same face, hair, outfit, colors. No morphing.
LOCATION LOCK: LOC_02 exactly as image 2 – same layout and set dressing.
TIME LOCK: golden hour, sun from frame left, same weather.
CAMERA LOCK: 40mm lens, f/2.8, 24fps.
ANGLE LOCK: eye-level, same side of the 180° line.
PROP LOCK: PROP_01 exactly as image 3, held in right hand.
STYLE: bright vivid colors, soft light.
SAFETY: fictional adult character, fully clothed, no logos, no on-screen text, no subtitles.
END FRAME: last 0.5s stable and sharp, hold pose.
```

**Đề nghị Meta tạo lại clip mới** (nhớ đính kèm lại ảnh bằng dấu +):

```text
Create a NEW clip for Scene 05 (do not edit the previous clip).
Keep the same character, outfit, location and lighting as the attached images.
Fix: clearer lip-sync to the LYRICS line, close-up on the face, mouth fully visible.
[dán lại toàn bộ prompt lock của Scene 05]
```

> Nghĩa: *Tạo một clip MỚI cho Scene 05 (không sửa clip cũ). Giữ nguyên nhân vật, trang phục, bối cảnh, ánh sáng như ảnh đính kèm. Sửa: khẩu hình rõ hơn theo dòng LYRICS, cận mặt, miệng không bị che.*

**Nối nhịp hành động** (đính kèm frame cuối clip trước + ảnh ref):

```text
[SCENE 07B | 7s | Meta AI | CONT from 07A]
FIRST FRAME: use the attached frame (last frame of Scene 07A) as the exact first frame; continue seamlessly, no cut, no transition.
ACTION: 0–4s she keeps running down the rainy street; 4–7s she slows down and turns to look back.
CHARACTER LOCK: CHAR_A exactly as image 1 – same face, hair, outfit, colors.
LOCATION LOCK: LOC_02 exactly as image 2. TIME LOCK: night, light rain, same lighting.
CAMERA LOCK: gimbal tracking shot, 35mm, 24fps. ANGLE LOCK: medium shot, same side of the 180° line.
MOVEMENT: camera keeps moving in the same direction as Scene 07A.
END FRAME: last 0.5s stable, hold pose, no motion blur.
SAFETY: fictional adult character, fully clothed, no logos, no on-screen text.
```

---

## 4. Lưu ý

- Các giới hạn như thời lượng clip của Meta AI là số liệu tháng 11/2026 và có thể thay đổi. Hãy kiểm tra lại trên giao diện Meta khi làm.
- Hình giao diện trong video là **mô phỏng minh họa**, không phải ảnh chụp màn hình thật. Bố cục trên Meta.ai và Chrome có thể khác đôi chút.
