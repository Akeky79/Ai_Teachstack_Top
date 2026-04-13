# 🤖 Robo Learn AI: No-Code AI Builder (YOLOv8)

ระบบเครื่องมือสร้างโมเดล AI แบบ No-Code สำหรับการเรียนรู้การตรวจจับวัตถุ (Object Detection) โดยใช้ YOLOv8 และการลากวางบล็อก (Visual Programming)

---

## 🌟 Key Features (คุณสมบัติเด่น)

- **Drag & Drop Flow UI:** สร้าง Pipeline การเทรน AI ด้วยการลากวางบล็อกผ่าน React Flow
- **PostgreSQL Database:** รองรับการใช้งานพร้อมกันจำนวนมาก (40+ Users) เหมาะสำหรับห้องเรียนหรือเวิร์กชอป
- **Smart Workspace:** ระบบบันทึกโปรเจกต์ (Save/Load) ที่แยกสัดส่วนชัดเจน
- **Training Session Management:** ระบบคิวและประวัติการเทรน AI สำหรับติดตามผลย้อนหลัง
- **Modern UI:** รองรับ Dark Mode และการแสดงผลที่สวยงามด้วย Tailwind CSS

---

## 🛠 Tech Stack (เทคโนโลยีที่ใช้)

### Frontend:
- **React 19** + **TypeScript**
- **Vite** (Build Tool)
- **Tailwind CSS 4** (Styling)
- **@xyflow/react** (React Flow - Flow Engine)

### Backend:
- **Node.js** + **Express**
- **PostgreSQL** (Relational Database)
- **dotenv** (Configuration)

---

## 🚀 Getting Started (การเริ่มต้นใช้งาน)

### 1. Prerequisites (สิ่งที่ต้องเตรียม)
- [Node.js](https://nodejs.org/) (เวอร์ชัน 18 ขึ้นไป)
- [PostgreSQL](https://www.postgresql.org/) (ติดตั้งและสร้าง Database ชื่อ `ai_teachstack`)

### 2. Database Configuration (การตั้งค่าฐานข้อมูล)
สร้างไฟล์ `.env` ภายในโฟลเดอร์ `backend/` และใส่ค่าคอนฟิกของคุณ:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=ai_teachstack
```

### 3. Installation & Setup (การติดตั้ง)

**ฝั่ง Backend:**
```bash
cd backend
npm install
node init_db.js  # เพื่อสร้างตารางในฐานข้อมูล
node server.js   # เริ่มรันเซิร์ฟเวอร์ (พอร์ต 3000)
```

**ฝั่ง Frontend:**
```bash
cd frontend
npm install
npm run dev      # เริ่มรันหน้าเว็บ (พอร์ต 5173 โดยประมาณ)
```

---

## 📊 Database Schema (โครงสร้างฐานข้อมูล)

1. **`projects`**: เก็บข้อมูลหลักของโปรเจกต์
2. **`canvas_flows`**: เก็บโครงสร้างบล็อก (Nodes/Edges) ในรูปแบบ JSONB
3. **`datasets`**: เก็บรายละเอียดชุดข้อมูลภาพ
4. **`training_sessions`**: เก็บประวัติและสถานะการเทรน AI
5. **`models`**: เก็บผลลัพธ์ไฟล์โมเดลที่เทรนสำเร็จ (.pt, .onnx)

---

## 📝 License
ISC License - ดูรายละเอียดเพิ่มเติมได้ในโปรเจกต์

**Developed with ❤️ for AI Education**
