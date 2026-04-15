# 🤖 คู่มือการเชื่อมต่อหุ่นยนต์เข้ากับระบบ Ai Teachstack (Robot Streaming Integration Manual)

เอกสารฉบับนี้อธิบาย **สถาปัตยกรรมและวิธีการเชื่อมต่อหุ่นยนต์ (Raspberry Pi) หรือคอมพิวเตอร์ผ่านเครือข่ายเข้าสู่ระบบ Ai Teachstack** สำหรับการส่งภาพสด (Live Video Stream) มาทำการประมวลผลโมเดล AI (Inference) บนเซิร์ฟเวอร์ โดยไม่ต้องนำโมเดลไปฝัง (Deploy) บนตัวหุ่นยนต์

---

## 🏗 1. สถาปัตยกรรมระบบ (Architecture Overview)

ระบบนี้ใช้ **Socket.IO** เป็นตัวกลางในการสื่อสารแบบ Real-time ระหว่างส่วนประกอบ 3 ส่วนหลัก ได้แก่:

1. **ฝั่งหุ่นยนต์ (Robot / Edge Device):** ใช้ Python และ OpenCV ดึงภาพจากกล้อง บีบอัดเป็น Base64 แล้วส่งผ่าน Socket.IO พร้อมแนบป้ายชื่อประจำตัว `Robot ID`
2. **ฝั่งเซิร์ฟเวอร์ (Node.js Backend):** ทำหน้าที่เป็น "ศูนย์กลางแลกเปลี่ยนข้อมูล" (Signaling & Proxy) เมื่อได้รับภาพจากหุ่นยนต์ จะนำไปกระจายต่อยังหน้าเว็บเบราว์เซอร์ที่ขอรับภาพของหุ่นยนต์รหัสนั้นๆ
3. **ฝั่งผู้ใช้งาน (React Frontend):** เมื่อผู้ใช้ลากบล็อก **"Robot Camera Stream"** และระบุ `Robot ID` หน้าเว็บจะเชื่อม Socket.IO เข้าไปขอร้องเซิร์ฟเวอร์เพื่อรับภาพเฉพาะห้องของหุ่นยนต์ตัวนั้น และนำไปแสดงผล/ประมวลผลต่อ

---

## 👥 2. ระบบ Multi-Robot (การรองรับหุ่นยนต์หลายตัวในห้องเรียน)

ปัญหาหลักในห้องเรียนคือการที่มีหุ่นยนต์หลายตัวและนักเรียนหลายคน ระบบจึงนำเทคนิค **"Socket.IO Rooms"** มาใช้แก้ปัญหา:

* **Robot_A** จะยิงข้อมูลระบุว่าเป้าหมายคือห้อง `ROBOT_A`
* **นาย ก.** พิมพ์รหัส `ROBOT_A` ในหน้าเว็บ เซิร์ฟเวอร์จะพานาย ก. เข้าห้อง `ROBOT_A` ทำให้นาย ก. เห็นภาพจาก Robot_A
* **Robot_B** ส่งภาพเข้าห้อง `ROBOT_B` จะไม่มีการตีกันของข้อมูลภาพ ภาพของใครของมัน ปลอดภัยและเสถียร

---

## 💻 3. โค้ดฝั่งหุ่นยนต์ (Python)

โค้ดชุดนี้สามารถนำไปรันบนคอมพิวเตอร์ของคุณเพื่อ "จำลอง" เป็นหุ่นยนต์ได้ทันที (ใช้ Webcam) ก่อนนำไปรันจริงบน Raspberry Pi

**การติดตั้งไลบรารีบน Pi / PC:**
```bash
pip install opencv-python python-socketio websocket-client
```

**ไฟล์ `robot_stream.py`:**
```python
import cv2
import base64
import socketio
import time

# 1. กำหนดรหัสหุ่นยนต์ให้ตรงกับที่เด็กจะกรอกบนหน้าเว็บ !!!
ROBOT_ID = "ROBOT_01" 

sio = socketio.Client()

def start_streaming():
    # URL ของ Backend (เปลี่ยน localhost เป็น IP ของ Server หากแยกเครื่องกัน)
    server_url = 'http://localhost:3000' 
    
    try:
        sio.connect(server_url)
        print(f"[INFO] เชื่อมต่อ Server สำเร็จ! ยืนยันตัวตนในชื่อ: {ROBOT_ID}")
    except Exception as e:
        print(f"[ERROR] ไม่สามารถเชื่อมต่อได้: {e}")
        return

    # ใช้กล้องตัวแรก (หรือ /dev/video0 บน Raspberry Pi)
    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

    print("[INFO] กำลังสตรีมภาพสด...")

    while True:
        ret, frame = cap.read()
        if not ret: break

        # บีบอัดภาพเพื่อลดภาระแบนด์วิดท์คอมพิวเตอร์/เครือข่าย
        _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
        jpg_as_text = base64.b64encode(buffer).decode('utf-8')
        image_data = f"data:image/jpeg;base64,{jpg_as_text}"

        # ส่งภาพไปที่ Backend พร้อมแนบรหัสหุ่นยนต์
        sio.emit('video_frame_from_robot', {
            'robotId': ROBOT_ID,
            'image': image_data
        })

        # คุม FPS ให้อยู่ประมาณ 30 FPS ป้องกันบอร์ดร้อนเกินไป
        time.sleep(0.03)

        cv2.imshow('Robot Camera Preview', frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()
    sio.disconnect()

if __name__ == '__main__':
    start_streaming()
```

---

## 🖧 4. โค้ดฝั่งเซิร์ฟเวอร์ (Node.js)

อัปเดตไฟล์ `backend/server.js` เพื่อรองรับ WebSocket สำหรับจัดการคิวภาพ 

**การติดตั้ง:**
```bash
cd backend
npm install socket.io
```

**ตัวอย่างการเขียนใน `server.js`:**
```javascript
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// ตั้งค่า Socket.IO ให้ยอมรับการเชื่อมต่อจากที่ไหนก็ได้ (CORS)
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

io.on('connection', (socket) => {
    console.log('[+] อุปกรณ์เชื่อมต่อใหม่:', socket.id);

    // 1. รับความต้องการจากหน้าเว็บของนักเรียน (React Frontend)
    socket.on('join_robot_room', (robotId) => {
        socket.join(robotId); // ดึงผู้ใช้นี้เข้าห้องตามรหัส
        console.log(`[JOIN] ผู้ใช้สมัครดูภาพจากหุ่นยนต์: ${robotId}`);
    });

    // 2. รับภาพจากหุ่นยนต์ (Python) และปล่อยต่อ
    socket.on('video_frame_from_robot', (data) => {
        // data.robotId = "ROBOT_01", data.image = "base64..."
        // socket.to() จะส่งข้อมูลนี้ให้เฉพาะห้องนั้นๆ! ไม่ส่งมั่ว
        socket.to(data.robotId).emit('stream_to_web', data.image);
    });

    socket.on('disconnect', () => {
        console.log('[-] อุปกรณ์หลุดการเชื่อมต่อ:', socket.id);
    });
});

server.listen(3000, () => {
    console.log('Backend รับคำสั่งอยู่ที่ Port 3000');
});
```

---

## 🎨 5. โค้ดฝั่งหน้าเว็บ (React UI)

การปรับแต่งบล็อก UI เรียบร้อยแล้วในไฟล์ `blocks.ts` โดยจะมี Block ชื่อ **Robot Camera Stream**  นักเรียนสามารถพิมพ์คู่กับหุ่นของตัวเองได้เลย 

**การติดตั้ง:**
```bash
cd frontend
npm install socket.io-client
```

ผู้เรียนจะสามารถใส่ชื่อ "ROBOT_01" ใน Node > เมื่อกดปุ่ม "Connect to Robot" จะกระตุ้นโค้ดใน React:
```javascript
import { io } from 'socket.io-client';

// ศึกษาจากโค้ดตัวอย่างการต่อ React เข้าเซิร์ฟเวอร์
const socket = io('http://localhost:3000');

function connectToRobot(robotId) {
    socket.emit('join_robot_room', robotId);
    
    // คอยดักรอฟังภาพสดที่เซิร์ฟเวอร์บรอดแคสต์ส่งมาให้
    socket.on('stream_to_web', (imageBase64) => {
        // นำดึงภาพนี้ไปอัปเดต State หรือใช้ทำ AI Inference โยนเข้าโมเดล YOLO ต่อได้เลย
        document.getElementById('robot-preview-image').src = imageBase64;
    });
}
```

---

## 🚀 6. แนะนำการใช้งานจริงในห้องเรียน

1. เสียบปลั๊ก/ต่อแบตเตอรี่หุ่นยนต์ทั้งหมด
2. ให้หุ่นยนต์ทุกตัวรันไฟล์ Python (อาจจะตั้งให้ทำงานออโต้เมื่อเปิดเครื่อง)
3. ระบุเลขใต้สติกเกอร์บอร์ดบนตัวหุ่นให้ชัดเจน (ตัวอย่างเช่น ติดไว้ว่า `ROBOT_12`)
4. ให้นักเรียนดึงบล็อก "Robot Camera Stream" มาวางในเว็บ
5. ให้นักเรียนกรอกรหัส `ROBOT_12` และกด Connect เพื่อเริ่มดึงภาพและทำ AI Detection Live ได้เลยครับ!
