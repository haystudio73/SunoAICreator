# Hướng dẫn làm MV Lipsync bằng AI — Claude.ai Project + Meta.ai

> Tài liệu nội dung chi tiết của video hướng dẫn **`Huong_dan_MV_Lipsync_AI.mp4`**, đi kèm file phụ đề **`Huong_dan_MV_Lipsync_AI.lrc`**.
> Video không có nhạc nền, không lời thoại. Toàn bộ lời giải thích nằm trong phụ đề .lrc và trong tài liệu này.

---

## 1. Thông tin video

| Hạng mục | Thông số |
|---|---|
| Thời lượng | **03:50** (230 giây), 15 cảnh |
| Định dạng | MP4 · H.264 · 1920×1080 · 30 fps |
| Âm thanh | Không có (không nhạc nền, không giọng nói) |
| Phụ đề | File riêng `.lrc`, 80 dòng, khớp thời điểm từng ý trên màn hình |
| Phong cách | Màu tươi sáng trên nền kem, mỗi bước một màu nhấn, thẻ bo góc có đổ bóng nhẹ |
| Font chữ | **Inter** (chữ không chân) cho tiêu đề và nội dung; **Liberation Mono** (không chân, đơn cách) cho khối prompt |
| Bố cục | Trái: tiêu đề + các ý đánh số hiện lần lượt. Phải: hình mô phỏng giao diện (không phải ảnh chụp màn hình thật) |
| Chuyển động | Các ý trượt lên và hiện dần; nút cần bấm có vòng sáng nhấp nháy; prompt được "gõ" dần; thanh tiến độ chạy dưới đáy |

**Bảng màu theo bước**

| Phần | Màu nhấn | Mã màu |
|---|---|---|
| Bước 1 – Chuẩn bị | Vàng | `#FFB400` |
| Bước 2 – Claude.ai | Tím | `#7C4DFF` |
| Bước 3 – Ảnh tham chiếu | Xanh ngọc | `#00B391` |
| Bước 4 – Meta.ai | Xanh dương | `#1880FF` |
| Bước 5 – Tải clip | Cam | `#FF7C1C` |
| Tip & trick | Xanh lá | `#22BA5A` |
| Bước 6 – Dựng MV | Đỏ san hô | `#FF5E54` |
| Nền / chữ chính | Kem / xanh đen | `#FFFAF0` / `#1B1F3B` |

---

## 2. Mục lục cảnh

| # | Thời gian | Nội dung |
|---|---|---|
| 01 | 00:00 – 00:09 | Mở đầu |
| 02 | 00:09 – 00:22 | Tổng quan: quy trình 6 bước |
| 03 | 00:22 – 00:37 | Bước 1 · Chuẩn bị nhạc & lyrics |
| 04 | 00:37 – 00:54 | Bước 2 · Tạo Project trên Claude.ai |
| 05 | 00:54 – 01:11 | Bước 2 · Trả lời câu hỏi của Claude |
| 06 | 01:11 – 01:25 | Bước 2 · Kiểm tra & điều chỉnh prompt |
| 07 | 01:25 – 01:41 | Bước 3 · Tạo ảnh tham chiếu |
| 08 | 01:41 – 01:59 | Bước 4 · Tạo clip trên Meta.ai |
| 09 | 01:59 – 02:15 | Bước 4 · Khi Meta tạo chưa đúng |
| 10 | 02:15 – 02:33 | Bước 5 · Cài extension tải video |
| 11 | 02:33 – 02:51 | Bước 5 · Tải toàn bộ clip về máy |
| 12 | 02:51 – 03:08 | Tip & trick · Hành động liên tục > 20 giây (1/2) |
| 13 | 03:08 – 03:24 | Tip & trick · Hành động liên tục > 20 giây (2/2) |
| 14 | 03:24 – 03:40 | Bước 6 · Dựng & xuất MV |
| 15 | 03:40 – 03:50 | Kết thúc |

---

## 3. Hướng dẫn chi tiết

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

## 4. Kịch bản chi tiết từng cảnh (khớp với video và file .lrc)

### Cảnh 01 · 00:00.0 – 00:09.0 · Mở đầu

**Hình minh họa:** Nền kem với các vòng tròn màu; nhãn vàng "HƯỚNG DẪN TỪNG BƯỚC", tiêu đề lớn "Làm MV Lipsync bằng AI", dòng phụ "Claude.ai Project + Meta.ai: từ file nhạc đến MV hoàn chỉnh", 6 nhãn bước hiện lần lượt, dòng "Không nhạc nền · Không lời thoại · Phụ đề kèm file .lrc".

| Thời điểm | Phụ đề (.lrc) |
|---|---|
| 00:00.5 | Hướng dẫn làm MV có lipsync bằng AI với Claude.ai Project và Meta.ai. |
| 00:04.5 | Từ file nhạc mp3 và lyrics đến bộ clip hoàn chỉnh để dựng MV. |

### Cảnh 02 · 00:09.0 – 00:22.0 · Tổng quan — Quy trình 6 bước

**Hình minh họa:** Sơ đồ 6 thẻ bước (2 hàng × 3), mỗi bước một màu, mũi tên nối lần lượt từ bước 1 đến bước 6.

| Thời điểm | Phụ đề (.lrc) |
|---|---|
| 00:09.3 | Toàn bộ quy trình gồm 6 bước, làm lần lượt từ bước 1 đến bước 6. |
| 00:10.5 | Bước 1: chuẩn bị file nhạc và lyrics. |
| 00:12.0 | Bước 2: lập storyboard và prompt với Claude.ai Project. |
| 00:13.5 | Bước 3: tạo ảnh tham chiếu cho nhân vật, bối cảnh, vật thể. |
| 00:15.0 | Bước 4: tạo từng clip trên Meta.ai. |
| 00:16.5 | Bước 5: tải toàn bộ clip về bằng extension Chrome. |
| 00:18.0 | Bước 6: dựng và xuất MV. |

### Cảnh 03 · 00:22.0 – 00:37.0 · Bước 1 — Chuẩn bị nhạc & lyrics

**Hình minh họa:** Thẻ "Thư mục dự án": file TenBai.mp3, file TenBai_lyrics.lrc, khung timecode từng câu, thư mục Anh_ref/.

| Thời điểm | Chữ trên màn hình | Phụ đề (.lrc) |
|---|---|---|
| 00:22.3 | *Tiêu đề:* Chuẩn bị nhạc & lyrics | Bước 1: chuẩn bị nhạc và lyrics. |
| 00:24.0 | File nhạc .mp3 bản hoàn chỉnh | Chuẩn bị file nhạc .mp3 bản hoàn chỉnh, ví dụ bản final tải từ Suno. |
| 00:27.0 | File lyrics đầy đủ, trích xuất từ Suno bằng tool | Chuẩn bị file lyrics đầy đủ, trích xuất từ Suno bằng công cụ. |
| 00:30.0 | Ưu tiên lyrics có timecode từng câu (.lrc) | Lyrics có timecode từng câu giúp Claude chia scene khớp với câu hát. |
| 00:33.0 | Ảnh ca sĩ, bối cảnh có sẵn (nếu có) | Nếu đã có ảnh ca sĩ hoặc bối cảnh, gom sẵn để dùng làm ảnh tham chiếu. |

### Cảnh 04 · 00:37.0 – 00:54.0 · Bước 2 — Tạo Project trên Claude.ai

**Hình minh họa:** Cửa sổ claude.ai · Project "MV – Tên bài hát": khung Instructions, hàng file đính kèm (mp3, lrc, png), ô chat gõ lệnh bắt đầu.

| Thời điểm | Chữ trên màn hình | Phụ đề (.lrc) |
|---|---|---|
| 00:37.3 | *Tiêu đề:* Tạo Project trên Claude.ai | Bước 2: tạo Project trên Claude.ai. |
| 00:39.0 | Tạo Project mới, đặt tên theo bài hát | Trên Claude.ai, tạo một Project mới và đặt tên theo bài hát. |
| 00:42.5 | Dán instruction MV AI vào phần Instructions | Dán nội dung file MV_AI_Agent_Instruction.md vào phần Instructions của Project. |
| 00:46.0 | Tải lên mp3, lyrics và ảnh ref | Mở chat trong Project, tải lên file nhạc, file lyrics và ảnh tham chiếu. |
| 00:49.5 | Gõ: “Bắt đầu làm MV lipsync cho bài này” | Gửi yêu cầu. Claude tóm tắt bài hát rồi hỏi từng bước; nếu không đọc được audio, Claude sẽ hỏi timecode. |

### Cảnh 05 · 00:54.0 – 01:11.0 · Bước 2 — Trả lời câu hỏi của Claude

**Hình minh họa:** Khung chat hỏi–đáp: hướng storyboard → "2. MV ca sĩ lipsync", tỉ lệ khung → 16:9, model → Meta AI, audio → "3. Lipsync"; cuối cùng là bảng storyboard có cột LIP.

| Thời điểm | Chữ trên màn hình | Phụ đề (.lrc) |
|---|---|---|
| 00:54.3 | *Tiêu đề:* Trả lời câu hỏi của Claude | Bước 2: trả lời các câu hỏi của Claude. |
| 00:55.8 | Hướng storyboard: MV ca sĩ lipsync | Khi Claude hỏi hướng storyboard, chọn MV ca sĩ lipsync. |
| 00:58.6 | Khung hình 16:9 (YouTube) hoặc 9:16 (Reels, TikTok) | Chọn tỉ lệ khung: 16:9 cho YouTube, 9:16 cho Reels hoặc TikTok. |
| 01:01.4 | Model: Meta AI, mỗi scene tối đa 10 giây | Chọn model Meta AI; mỗi scene dài tối đa 10 giây. |
| 01:04.2 | Audio trong clip: chọn Lipsync | Với câu hỏi tạo audio trong clip, chọn Lipsync để prompt có dòng LYRICS. |
| 01:07.0 | Chọn phong cách, chất liệu điện ảnh rồi duyệt storyboard | Tiếp tục chọn phong cách, chất liệu hình ảnh, rồi duyệt storyboard trước khi Claude viết prompt. |

### Cảnh 06 · 01:11.0 – 01:25.0 · Bước 2 — Kiểm tra & điều chỉnh prompt

**Hình minh họa:** Khối prompt Scene 05 nền tối: dòng LYRICS được tô vàng, các dòng LOCK lần lượt được đánh dấu xanh, dòng tiêu đề "8s" tô đỏ; bong bóng chat yêu cầu sửa.

| Thời điểm | Chữ trên màn hình | Phụ đề (.lrc) |
|---|---|---|
| 01:11.3 | *Tiêu đề:* Kiểm tra & điều chỉnh prompt | Bước 2: kiểm tra và điều chỉnh prompt. |
| 01:12.8 | Dòng LYRICS đúng câu hát của scene | Kiểm tra dòng LYRICS: đúng câu hát, đúng mốc giây của scene. |
| 01:15.6 | Đủ các khóa: nhân vật, bối cảnh, máy quay, góc, thời điểm, đạo cụ | Mỗi prompt phải đủ các khóa LOCK: nhân vật, bối cảnh, máy quay, góc quay, thời điểm và đạo cụ. |
| 01:18.4 | Mỗi scene dài tối đa 10 giây | Kiểm tra thời lượng: mỗi scene cho Meta AI dài tối đa 10 giây. |
| 01:21.2 | Cần sửa? Nhắn Claude: “Scene 5 đổi sang cận mặt, giữ nguyên lock” | Muốn sửa scene nào, nhắn Claude sửa trực tiếp và yêu cầu giữ nguyên các khóa. |

### Cảnh 07 · 01:25.0 – 01:41.0 · Bước 3 — Tạo ảnh tham chiếu

**Hình minh họa:** Thẻ Asset Sheet với prompt ảnh; ba thẻ ảnh Nhân vật (4 góc), Bối cảnh, Vật thể; nhãn tên file CHAR_A.png, LOC_01.png, PROP_01.png; dấu tích xanh và các nhãn "Rõ mặt · Đủ sáng · Không chữ · Không logo".

| Thời điểm | Chữ trên màn hình | Phụ đề (.lrc) |
|---|---|---|
| 01:25.3 | *Tiêu đề:* Tạo ảnh tham chiếu | Bước 3: tạo ảnh tham chiếu. |
| 01:26.8 | Dùng prompt ảnh trong Asset Sheet của Claude | Lấy prompt ảnh trong Asset Sheet mà Claude đã tạo. |
| 01:29.3 | Nhân vật: ảnh xoay 4 góc + chân dung cận mặt | Với nhân vật, tạo ảnh xoay 4 góc và một ảnh chân dung cận mặt. |
| 01:31.8 | Bối cảnh không có người, vật thể trên nền trơn | Bối cảnh tạo ở dạng toàn cảnh, không có người; vật thể đặt trên nền trơn. |
| 01:34.3 | Đặt tên file theo ID: CHAR_A.png, LOC_01.png… | Lưu ảnh đạt yêu cầu và đặt tên theo ID, ví dụ CHAR_A.png, LOC_01.png, PROP_01.png. |
| 01:36.8 | Ảnh rõ mặt, đủ sáng, không chữ, không logo | Chọn ảnh rõ mặt, đủ sáng, không có chữ hay logo để Meta giữ nhân vật ổn định. |

### Cảnh 08 · 01:41.0 – 01:59.0 · Bước 4 — Tạo clip trên Meta.ai

**Hình minh họa:** Cửa sổ meta.ai: nút + nhấp nháy, 3 ảnh ref (CHAR_A, LOC_01, PROP_01) gắn vào ô nhập, prompt được gõ dần, khung video "Đang tạo video…" chuyển thành "Clip S05 · 8 giây", dải S01–S08 cho tiến độ.

| Thời điểm | Chữ trên màn hình | Phụ đề (.lrc) |
|---|---|---|
| 01:41.3 | *Tiêu đề:* Tạo clip trên Meta.ai | Bước 4: tạo clip trên Meta.ai. |
| 01:42.8 | Mở meta.ai và đăng nhập | Mở trang meta.ai trên trình duyệt và đăng nhập. |
| 01:45.6 | Nhấn dấu + để đính kèm ảnh ref của scene | Nhấn dấu + để đính kèm ảnh tham chiếu của scene: nhân vật, bối cảnh, đạo cụ. |
| 01:48.4 | Dán prompt scene có đủ các dòng LOCK và LYRICS | Dán prompt của scene, có đủ các dòng LOCK và dòng LYRICS. |
| 01:51.2 | Gửi, chờ render, xem kỹ khẩu hình | Gửi và chờ Meta render; xem kỹ khẩu hình, nhân vật và bối cảnh. |
| 01:54.0 | Làm lần lượt từng scene theo storyboard | Làm lần lượt từng scene theo đúng thứ tự trong storyboard. |

### Cảnh 09 · 01:59.0 – 02:15.0 · Bước 4 — Khi Meta tạo chưa đúng

**Hình minh họa:** Clip lỗi có dấu X hồng "Khẩu hình lệch, sai góc máy"; bong bóng chat yêu cầu tạo clip mới; hàng ảnh ref gắn lại với nút + nhấp nháy; clip mới có dấu tích xanh "S05_ok".

| Thời điểm | Chữ trên màn hình | Phụ đề (.lrc) |
|---|---|---|
| 01:59.3 | *Tiêu đề:* Khi Meta tạo chưa đúng | Bước 4: khi Meta tạo chưa đúng yêu cầu. |
| 02:00.8 | Clip chưa đạt? Yêu cầu Meta tạo lại clip MỚI | Nếu clip chưa đúng yêu cầu, đề nghị Meta tạo lại một clip mới. |
| 02:03.8 | Nói rõ điểm cần sửa, giữ nguyên phần còn lại | Nói rõ điểm cần sửa, và yêu cầu giữ nguyên nhân vật, bối cảnh, góc máy. |
| 02:06.8 | Luôn đính kèm lại ảnh (dấu +) cùng prompt lock | Luôn đính kèm lại ảnh tham chiếu bằng dấu + cùng với prompt lock. |
| 02:09.8 | Clip đạt: ghi lại số scene để tải đúng thứ tự | Clip đạt thì ghi lại số scene, ví dụ S05_ok, để tải về đúng thứ tự. |

### Cảnh 10 · 02:15.0 – 02:33.0 · Bước 5 — Cài extension tải video

**Hình minh họa:** Thẻ GitHub (repo SunoAICreator › Download Meta Video, nút Code / Download ZIP); file ZIP → thư mục "Download Meta Video"; cửa sổ chrome://extensions với công tắc Developer mode bật lên, nút Load unpacked nhấp nháy, thẻ extension "Meta.AI Video Downloader — Bulk & Auto Queue 1.0.0"; dải cảnh báo vàng về quyền truy cập.

| Thời điểm | Chữ trên màn hình | Phụ đề (.lrc) |
|---|---|---|
| 02:15.3 | *Tiêu đề:* Cài extension tải video | Bước 5: cài extension tải video. |
| 02:16.8 | Tải repo GitHub: Code → Download ZIP | Mở github.com/haystudio73/SunoAICreator, chọn Code rồi Download ZIP. |
| 02:19.6 | Giải nén, tìm thư mục “Download Meta Video” | Giải nén file ZIP và tìm thư mục Download Meta Video. |
| 02:22.4 | Chrome: mở chrome://extensions, bật Developer mode | Trong Chrome, mở chrome://extensions và bật Developer mode. |
| 02:25.2 | Load unpacked → chọn thư mục “Download Meta Video” | Bấm Load unpacked và chọn thư mục Download Meta Video. |
| 02:28.0 | Chỉ cài extension từ nguồn bạn tin cậy | Extension này xin quyền đọc mọi trang web, nên chỉ cài từ nguồn bạn tin cậy. |

### Cảnh 11 · 02:33.0 – 02:51.0 · Bước 5 — Tải toàn bộ clip về máy

**Hình minh họa:** Trang meta.ai với lưới 6 clip S01–S06; Side Panel của extension: Scan Page, danh sách tên file gốc chuyển thành 01_clip.mp4…06_clip.mp4 đã tick, Select Folder (E:\MV\Clips), Start Auto Queue, thanh tiến độ chạy tới "Đã tải 6/6 clip"; nhãn xanh "File .mp4 gốc, không bị watermark Meta AI đè lên".

| Thời điểm | Chữ trên màn hình | Phụ đề (.lrc) |
|---|---|---|
| 02:33.3 | *Tiêu đề:* Tải toàn bộ clip về máy | Bước 5: tải toàn bộ clip về máy. |
| 02:34.8 | Mở meta.ai, bấm icon extension để mở Side Panel | Mở meta.ai, bấm icon Meta.AI Video Downloader để mở Side Panel. |
| 02:37.6 | Scan Page, cuộn trang để nhận đủ clip | Bấm Scan Page và cuộn trang để extension nhận đủ các clip. |
| 02:40.4 | Chọn clip, đặt tên tự động 01, 02… theo thứ tự | Chọn clip, dùng Auto New Name đặt tên 01, 02… từ trên xuống; kiểm tra lại thứ tự so với storyboard. |
| 02:43.2 | Select Folder → Start Auto Queue | Bấm Select Folder chọn thư mục lưu, rồi Start Auto Queue để tải lần lượt từng file. |
| 02:46.0 | Clip tải về không bị watermark Meta AI đè lên | Các clip tải về là file mp4 gốc, không bị watermark Meta AI đè lên. |

### Cảnh 12 · 02:51.0 – 03:08.0 · Tip & trick — Hành động liên tục > 20 giây (1/2)

**Hình minh họa:** Ba khối phim Clip 1 (0–7s, Mở đầu), Clip 2 (7–14s, Cao trào), Clip 3 (14–21s, Kết); nhãn "+ Extend" trên Clip 1; biểu tượng frame nối giữa các clip; khung "≈ 21 giây+ liền mạch"; khối prompt "Continue seamlessly from the attached frame…".

| Thời điểm | Chữ trên màn hình | Phụ đề (.lrc) |
|---|---|---|
| 02:51.3 | *Tiêu đề:* Hành động liên tục > 20 giây (1/2) | Tip & trick: cảnh hành động liên tục dài hơn 20 giây. |
| 02:52.8 | Chia hành động thành 3 nhịp ~7 giây: mở đầu → cao trào → kết | Chia cảnh hành động dài thành 3 nhịp khoảng 7 giây: mở đầu, cao trào, kết. |
| 02:56.0 | Clip đạt? Dùng Extend để kéo dài thay vì tạo lại | Khi một nhịp đã đạt, dùng tính năng Extend của Meta để kéo dài thay vì tạo lại từ đầu. |
| 02:59.2 | Frame cuối clip trước = ảnh đầu clip sau (đính kèm bằng +) | Chụp frame cuối của clip trước, đính kèm bằng dấu + làm ảnh mở đầu cho clip sau. |
| 03:02.4 | Prompt: “Continue seamlessly from the attached frame…” | Trong prompt, yêu cầu nối tiếp liền mạch từ frame đính kèm, giữ nguyên nhân vật và ánh sáng. |

### Cảnh 13 · 03:08.0 – 03:24.0 · Tip & trick — Hành động liên tục > 20 giây (2/2)

**Hình minh họa:** Khối prompt: các dòng LOCK "giữ nguyên", dòng ACTION tô vàng "chỉ đổi dòng này"; dải 3 clip với đoạn "giữ 0,5s" ở cuối, mũi tên cùng hướng máy, điểm crossfade đỏ; thẻ xanh về cảnh LIP.

| Thời điểm | Chữ trên màn hình | Phụ đề (.lrc) |
|---|---|---|
| 03:08.3 | *Tiêu đề:* Hành động liên tục > 20 giây (2/2) | Tip & trick: giữ cảnh liền mạch khi nối clip. |
| 03:09.8 | Giữ nguyên ảnh ref và prompt lock, chỉ đổi dòng ACTION | Giữ nguyên ảnh tham chiếu và các dòng LOCK, chỉ đổi dòng ACTION cho từng nhịp. |
| 03:12.4 | Cuối mỗi clip: giữ tư thế ổn định khoảng 0,5 giây | Yêu cầu cuối mỗi clip giữ tư thế ổn định khoảng nửa giây để dễ nối. |
| 03:15.0 | Máy quay chuyển động cùng một hướng ở mọi nhịp | Giữ hướng chuyển động máy quay giống nhau ở mọi nhịp để cảnh liền mạch. |
| 03:17.6 | Khi dựng: cắt theo hành động, crossfade 2–4 frame | Khi dựng, cắt ngay lúc nhân vật đang chuyển động và crossfade 2 đến 4 frame. |
| 03:20.2 | Cảnh hát: mỗi clip 1–2 câu, cận hoặc trung cảnh | Với cảnh hát lipsync, mỗi clip chỉ nên có 1 đến 2 câu, quay cận hoặc trung cảnh. |

### Cảnh 14 · 03:24.0 – 03:40.0 · Bước 6 — Dựng & xuất MV

**Hình minh họa:** Cửa sổ "Timeline dựng MV": khung xem trước, track Video (S01–S06), track Nhạc .mp3 dạng sóng âm, track Lyrics; mũi tên "±2–3 frame"; nút "Xuất MP4 1080p"; nhãn "Nội dung tạo bằng AI".

| Thời điểm | Chữ trên màn hình | Phụ đề (.lrc) |
|---|---|---|
| 03:24.3 | *Tiêu đề:* Dựng & xuất MV | Bước 6: dựng và xuất MV. |
| 03:25.8 | Xếp clip theo timecode trên nhạc gốc .mp3 | Đưa nhạc gốc vào phần mềm dựng, xếp clip theo đúng timecode của storyboard. |
| 03:28.4 | Khớp khẩu hình: dịch clip ±2–3 frame nếu lệch | Kiểm tra khẩu hình với giọng hát, dịch clip 2 đến 3 frame nếu bị lệch. |
| 03:31.0 | Thêm phụ đề lyrics từ file .lrc nếu cần | Nếu cần, thêm phụ đề lời bài hát từ file .lrc. |
| 03:33.6 | Xuất file MP4 1080p | Xuất MV thành file MP4 độ phân giải 1080p. |
| 03:36.2 | Khi đăng: gắn nhãn nội dung AI nếu nền tảng yêu cầu | Khi đăng MV, gắn nhãn nội dung tạo bằng AI nếu nền tảng yêu cầu. |

### Cảnh 15 · 03:40.0 – 03:50.0 · Kết thúc

**Hình minh họa:** Chữ lớn "Hoàn tất!", 6 thẻ có dấu tích tóm tắt 6 bước, dòng chữ đỏ san hô "Chúc bạn làm MV thành công!".

| Thời điểm | Phụ đề (.lrc) |
|---|---|
| 03:40.5 | Hoàn tất! Bạn đã có đủ quy trình làm MV lipsync bằng AI. |
| 03:43.5 | Chuẩn bị nhạc, lập kế hoạch với Claude, tạo ảnh ref, tạo clip trên Meta, tải về và dựng MV. |
| 03:47.3 | Chúc bạn làm MV thành công! |

---

## 5. Prompt mẫu

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

## 6. Cách dùng file phụ đề `.lrc`

- File `Huong_dan_MV_Lipsync_AI.lrc` được đặt **cùng tên** với video để dễ quản lý. Bạn dùng nó trong phần mềm dựng hoặc công cụ làm lyric video có hỗ trợ `.lrc`.
- Mỗi dòng có dạng `[mm:ss.xx]Nội dung`. Mỗi dòng hiển thị đến khi dòng kế tiếp bắt đầu.
- Nhiều trình phát video không đọc trực tiếp `.lrc`. Để xem phụ đề kèm video hoặc đăng YouTube, chuyển `.lrc` sang `.srt` bằng công cụ chuyển đổi bất kỳ. Thời điểm giữ nguyên.

---

## 7. Tài nguyên & lưu ý

- Instruction cho Claude Project: `MV_AI_Agent_Instruction.md` (lưu trong Project "THU IT").
- Extension tải video: https://github.com/haystudio73/SunoAICreator/tree/main/Download%20Meta%20Video
- Trợ giúp Meta AI về chỉnh sửa và kéo dài video (Edit / Extend): https://www.meta.com/help/artificial-intelligence/996454095987249/
- Các giới hạn như thời lượng clip của Meta AI là số liệu tháng 11/2026 và có thể thay đổi. Hãy kiểm tra lại trên giao diện Meta khi làm.
- Hình giao diện trong video là **mô phỏng minh họa**, không phải ảnh chụp màn hình thật. Bố cục trên Meta.ai và Chrome có thể khác đôi chút.
