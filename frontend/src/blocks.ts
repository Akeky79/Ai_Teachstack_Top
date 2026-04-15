/* 
  AI Building Blocks Definitions
  Contains all the metadata for different categories of nodes in the workspace.
*/

export interface BlockParam {
    type: 'slider' | 'select' | 'check' | 'text' | 'table' | 'info' | 'divider' | 'dropzone';
    label: string;
    desc?: string; // Detailed educational description
    min?: number;
    max?: number;
    value?: any;
    step?: number;
    options?: string[];
    checked?: boolean;
    text?: string;
    columns?: string[];
    rows?: number;
    placeholder?: string;
}

export interface BlockDef {
    id: string;
    icon: string;
    name: string;
    subtitle: string;
    badge: string;
    color: string;
    description: string;
    params: BlockParam[];
    insight?: {
        title: string;
        text: string;
        formula?: string;
    };
}

export const BLOCKS: Record<string, BlockDef[]> = {
    input: [
        {
            id: 'robot-stream', icon: '🤖', name: 'Robot Camera',
            subtitle: 'Direct MJPEG/RTSP' , badge: 'INPUT', color: 'blue',
            description: 'ดึงข้อมูลภาพสดจากหุ่นยนต์ผ่านโปรโตคอล MJPEG หรือ RTSP โดยตรง เพื่อนำมาประมวลผลในขั้นตอนถัดไป',
            params: [
                { type: 'text', label: 'Stream URL', desc: 'ที่อยู่ IP หรือ Endpoint ของกล้องหุ่นยนต์ (เช่น http://192.168.1.50:5000/video_feed)', value: 'http://localhost:5000/video_feed' },
                { type: 'slider', label: 'Frame Rate', desc: 'จำนวนภาพต่อวินาที (FPS) ยิ่งมากภาพยิ่งลื่นแต่กินเน็ตมากขึ้น', min: 1, max: 60, value: 30, step: 1 },
                { type: 'select', label: 'Resolution', desc: 'ความละเอียดของภาพ (ยิ่งสูง AI ยิ่งเห็นชัดแต่โหลดเครื่อง)', options: ['640x480 (Standard)', '1280x720 (HD)', '1920x1080 (FHD)'] },
            ],
            insight: { 
                title: 'Data Compression Ratio', 
                text: 'การส่งข้อมูลวิดีโอต้องพึ่งพาสูตรการบีบอัดภาพเพื่อลดโหลดของ Network โดยรักษา Peak Signal-to-Noise Ratio (PSNR) ให้สูงเพียงพอที่ AI จะยังคงมองเห็นวัตถุได้ชัดเจน', 
                formula: 'CR = Uncompressed_Size / Compressed_Size' 
            }
        },
        {
            id: 'webcam-input', icon: '📷', name: 'Webcam Stream',
            subtitle: 'Local Browser Camera', badge: 'INPUT', color: 'blue',
            description: 'ใช้กล้องเว็บแคมจากคอมพิวเตอร์ของผู้ใช้โดยตรงสำหรับการทดสอบและพัฒนาโมเดลเบื้องต้น',
            params: [
                { type: 'select', label: 'Camera Device', desc: 'เลือกกล้องที่เชื่อมต่อกับคอมพิวเตอร์ของคุณ', options: ['Integrated Camera', 'USB Video Device', 'Virtual Camera'] },
                { type: 'check', label: 'Mirror Display', desc: 'แสดงภาพแบบกลับด้าน (เหมือนกระจก) เพื่อความคุ้นเคยของผู้ใช้', checked: true },
            ],
            insight: { 
                title: 'Latency Tracking', 
                text: 'ความล่าช้า (Latency) เกิดจากเวลาที่แสงเข้าเลนส์จนถึงเวลาที่ประมวลผลเสร็จ การลด Resolution ช่วยลด Latency ในการประมวลผลได้มหาศาล', 
                formula: 'T_total = T_capture + T_transfer + T_inference' 
            }
        },
        {
            id: 'test-image', icon: '🖼️', name: 'Static Test Image',
            subtitle: 'Reference Dataset', badge: 'INPUT', color: 'blue',
            description: 'ใช้ภาพนิ่งมาตรฐานในการทดสอบโมเดล เพื่อเปรียบเทียบผลลัพธ์การตรวจจับในสภาวะที่ควบคุมได้',
            params: [
                { type: 'select', label: 'Dataset Item', desc: 'เลือกภาพตัวอย่างจากฐานข้อมูลเพื่อทดสอบการตรวจจับ', options: ['zidane.jpg', 'bus.jpg', 'person.jpg', 'car.jpg'] },
                { type: 'check', label: 'Grayscale Mode', desc: 'แปลงภาพเป็นขาวดำเพื่อส่งให้โมเดลที่ฝึกมาเฉพาะทาง', checked: false },
            ],
            insight: { 
                title: 'RGB Normalize', 
                text: 'ก่อนส่งให้ AI ภาพจะถูกหารด้วย 255 เพื่อปรับช่วง Pixel ให้เหลือ 0.0 - 1.0 ซึ่งช่วยให้ Gradient ของโมเดลทำงานได้เสถียรที่สุด', 
                formula: 'X_norm = (X - μ) / σ' 
            }
        },
        {
            id: 'roboflow-dataset', icon: '🏷️', name: 'Roboflow Export',
            subtitle: 'Dataset Integration', badge: 'INPUT', color: 'blue',
            description: 'เชื่อมต่อกับฐานข้อมูลภาพที่ทำ Label แล้วจาก Roboflow เพื่อนำมาฝึกสอนโมเดลใหม่',
            params: [
                { type: 'text', label: 'API Key', desc: 'รหัสผ่านส่วนตัวสำหรับเข้าถึง Dataset ของคุณบน Roboflow', placeholder: 'rf_xxxxxxxxxxxxxx' },
                { type: 'text', label: 'Project ID', desc: 'ชื่อโปรเจกต์หรือ Workspace ใน Roboflow (เช่น plant-disease-detection)', value: 'my-ai-project' },
                { type: 'select', label: 'Version', desc: 'รุ่นของชุดข้อมูลที่ต้องการใช้งาน (ยิ่งรุ่นสูงยิ่งผ่านการแก้อาจจะแม่นขึ้น)', options: ['v1 (Initial)', 'v2 (Augmented)', 'v3 (Final)'] },
            ],
            insight: { 
                title: 'Label Quality Importance', 
                text: 'AI จะเก่งเท่ากับข้อมูลที่ใช้สอน ถ้าเราทำ Label ผิด AI ก็จะจำสิ่งที่ผิดไปตลอดกาล ดังนั้นควรตรวจสอบความถูกต้องของ Bounding Box ก่อนการฝึกเสมอ', 
                formula: 'mAP_final ∝ Quality(Labels) * Diversity(Data)' 
            }
        },
        {
            id: 'image-upload', icon: '📁', name: 'Image File Upload',
            subtitle: 'Local Machine File', badge: 'INPUT', color: 'blue',
            description: 'อัปโหลดรูปภาพจากคอมพิวเตอร์ของคุณโดยตรง เพื่อใช้ในการทดสอบการตรวจจับวัตถุเฉพาะทาง',
            params: [
                { type: 'dropzone', label: 'Select Image File', desc: 'เลือกไฟล์ภาพ (JPG, PNG) จากเครื่องของคุณ' },
                { type: 'check', label: 'Auto Resize', desc: 'ปรับขนาดภาพให้อัตโนมัติเพื่อให้เหมาะสมกับโมเดล', checked: true },
            ],
            insight: { 
                title: 'File Format Compatibility', 
                text: 'การอัปโหลดไฟล์ในรูปแบบที่เหมาะสมช่วยลดภาระการถอดรหัส (Decoding) ของ GPU และช่วยให้ประมวลผลได้รวดเร็วขึ้น', 
                formula: 'BitDepth = log2(Colors)' 
            }
        },
    ],
    model: [
        {
            id: 'yolo-model', icon: '🧠', name: 'YOLOv11 Architecture',
            subtitle: 'State-of-the-art Detection', badge: 'MODEL', color: 'purple',
            description: 'สถาปัตยกรรม YOLOv11 ล่าสุดจาก Ultralytics มาพร้อมกับ C3k2 Block และ C2PSA ที่ช่วยให้ตรวจจับวัตถุได้ดีขึ้น',
            params: [
                { type: 'select', label: 'Model Variant', desc: 'ขนาดของโมเดล (Nano เล็กเร็ว / Extra Large ใหญ่แม่นยำที่สุด)', options: [
                    'YOLOv11n (Nano - Ultra Fast)', 
                    'YOLOv11s (Small - Balanced)', 
                    'YOLOv11m (Medium - High Accuracy)', 
                    'YOLOv11l (Large - Professional)', 
                    'YOLOv11x (Extra Large - Master)'
                ] },
                { type: 'select', label: 'Backbone Engine', desc: 'หัวใจการสกัดคุณลักษณะ (Features) ของภาพ', options: ['C3k2 (Optimized)', 'C2f (Legacy)', 'CSPDarknet'] },
                { type: 'check', label: 'NMS-free Mode', desc: 'เทคนิคตัดกล่องที่ซ้อนกันออกโดยไม่ต้องใช้ Post-processing (YOLOv10 technique)', checked: false },
            ],
            insight: { 
                title: 'C2PSA Spatial Attention', 
                text: 'PSA ทำงานโดยการระบุว่าส่วนไหนของภาพคือ "วัตถุ" และส่วนไหนคือ "พื้นหลัง" โดยใช้กลไก Self-Attention แบบน้ำหนักเบา', 
                formula: 'Attention(Q,K,V) = σ(Softmax(QKᵀ / √d_k)V)' 
            }
        },
    ],
    training: [
        {
            id: 'train-engine', icon: '⚙️', name: 'Training Engine',
            subtitle: 'Hyperparameters & Optimization', badge: 'TRAIN', color: 'amber',
            description: 'ส่วนปรับแต่งหัวใจของการเรียนรู้ กำหนดพฤติกรรมการอัปเดตน้ำหนักของโครงข่ายประสาทเทียม',
            params: [
                { type: 'slider', label: 'Image Size (imgsz)', desc: 'ขนาดภาพที่ใช้ฝึก (ยิ่งใหญ่ยิ่งคมชัดแต่โหลดเครื่อง)', min: 320, max: 1280, value: 640, step: 32 },
                { type: 'divider', label: 'Core Parameters' },
                { type: 'slider', label: 'Initial LR (lr0)', desc: 'ความเร็วในการเรียนรู้ (ถ้ามากไปโมเดลจะกระโดดข้ามจุดที่ดีที่สุด)', min: 0.0001, max: 0.1, value: 0.01, step: 0.0001 },
                { type: 'slider', label: 'Epochs', desc: 'จำนวนรอบที่ AI จะเรียนรู้ข้อมูลทั้งหมด (ต้องระวัง Overfitting)', min: 1, max: 1000, value: 100, step: 1 },
                { type: 'select', label: 'Batch Size', desc: 'จำนวนภาพที่ส่งให้โมเดลประมวลผลพร้อมกันใน 1 ครั้ง', options: ['16 (GPU Safe)', '32 (Balanced)', '64 (High Throughput)'] },
                { type: 'slider', label: 'Weight Decay', desc: 'การลดความสำคัญของ Weight ที่ใหญ่เกินไปเพื่อป้องกันการท่องจำ (Regularization)', min: 0.0001, max: 0.01, value: 0.0005, step: 0.0001 },
                { type: 'divider', label: 'Optimizers' },
                { type: 'select', label: 'Optimizer Type', desc: 'อัลกอริทึมที่ใช้ค้นหาค่าน้ำหนักที่ถูกต้องที่สุด', options: ['SGD (Classic)', 'AdamW (Recommended)', 'RMSProp'] },
            ],
            insight: { 
                title: 'AdamW Optimizer Update', 
                text: 'AdamW ช่วยกระจายตัวแปรให้นิ่งขึ้นและป้องกันการเกิด Overfitting ได้ดีกว่าการใช้ L2 Regularization ปกติ', 
                formula: 'θ_t+1 = (1 - ηλ)θ_t - η · m_t / (√v_t + ε)' 
            }
        },
    ],
    output: [
        {
            id: 'inference', icon: '👁️', name: 'Predict / Inference',
            subtitle: 'Real-time Deployment', badge: 'PREDICT', color: 'green',
            description: 'นำโมเดลที่ฝึกสอนแล้วมาใช้ระบุตำแหน่งวัตถุ โดยสามารถกำหนดค่าความต่างเพื่อกรองผลลัพธ์ได้',
            params: [
                { type: 'slider', label: 'Image Size', desc: 'ขนาดภาพที่ส่งตรวจจับ (ต้องตรงหรือใกล้เคียงกับที่ฝึกมา)', min: 320, max: 1280, value: 640, step: 32 },
                { type: 'slider', label: 'Conf Threshold', desc: 'เกณฑ์ความมั่นใจ (ถ้าโมเดลมั่นใจต่ำกว่านี้จะไม่แสดงผล)', min: 0.1, max: 0.9, value: 0.25, step: 0.05 },
                { type: 'slider', label: 'IoU Threshold', desc: 'เกณฑ์การซ้อนทับ (ถ้ากล่องซ้อนกันเกินค่านี้จะถูกยุบรวมเป็นกล่องเดียว)', min: 0.1, max: 0.9, value: 0.45, step: 0.05 },
                { type: 'check', label: 'Draw Bounding Box', desc: 'วาดกรอบสี่เหลี่ยมรอบวัตถุที่ตรวจเจอ', checked: true },
                { type: 'check', label: 'Show Labels & Scores', desc: 'แสดงชื่อประเภทวัตถุและเปอร์เซ็นต์ความมั่นใจ', checked: true },
            ],
            insight: { 
                title: 'Complete IoU (CIoU) Loss', 
                text: 'CIoU คำนวณทั้งพื้นที่ทับซ้อน, ระยะห่างจุดกึ่งกลาง, และสัดส่วนภาพ เพื่อความแม่นยำสูงสุด', 
                formula: 'L_CIoU = 1 - IoU + (ρ² / c²) + αv' 
            }
        },
        {
            id: 'live-monitor', icon: '🖥️', name: 'Live Monitor',
            subtitle: 'Real-time Feed Display', badge: 'OUTPUT', color: 'blue',
            description: 'หน้าจอสำหรับแสดงผลลัพธ์การประมวลผลย้อนกลับมาที่ Dashboard เพื่อให้ผู้ใช้งานมองเห็นสิ่งที่ AI เห็น',
            params: [
                { type: 'check', label: 'Active Preview', desc: 'เปิดหน้าต่าง Preview ทางด้านขวาของหน้าจอเพื่อดูภาพสด', checked: true },
                { type: 'select', label: 'Overlay Style', desc: 'เลือกรูปแบบการตกแต่งกรอบ Bounding Box ที่จะแสดงผล', options: ['Neon Glow', 'Minimalist', 'Classic Specs'] },
            ],
            insight: { 
                title: 'Post-Process Rendering', 
                text: 'การวาด Bounding Box ลงบนภาพสดต้องอาศัย GPU หรือ Canvas ในเบราว์เซอร์ เพื่อให้เรามองเห็นได้ทันทีโดยไม่เกิด Frame Drop', 
                formula: 'FPS_view = 1 / (T_infer + T_render)' 
            }
        },
        {
            id: 'det-results', icon: '📊', name: 'Detection Results',
            subtitle: 'Class · BBox · Score · Time', badge: 'OUTPUT', color: 'green',
            description: 'แสดงผลลัพธ์จากการทำ Inference ในรูปแบบของตารางข้อมูลเชิงปริมาณ',
            params: [
                { type: 'table', label: 'Detections', desc: 'ตารางแสดงพิกัดและระดับความมั่นใจของวัตถุทุกชิ้นในภาพ', columns: ['Class', 'Confidence', 'X1', 'Y1', 'X2', 'Y2'], rows: 5 },
                { type: 'info', label: 'Pre-processing Time', desc: 'เวลาที่ใช้ในการปรับแต่งรูปภาพก่อนส่งให้ AI', text: '— ms' },
            ],
            insight: { 
                title: 'Spatial Coordinates Encoding', 
                text: 'การเก็บข้อมูลพิกัดในรูป [Xmin, Ymin, Xmax, Ymax] ช่วยให้คำนวณพื้นที่วัตถุได้ทันที', 
                formula: 'Area = (Xmax - Xmin) * (Ymax - Ymin)' 
            }
        },
    ],
    viz: [
        {
            id: 'loss-chart', icon: '📈', name: 'Loss Analysis',
            subtitle: 'Training Progress', badge: 'VIZ', color: 'rose',
            description: 'กราฟแสดงประวัติความผิดพลาด (Loss) ระหว่างการฝึก ยิ่งค่าลดต่ำลงโมเดลยิ่งเก่งขึ้น',
            params: [
                { type: 'select', label: 'Chart Type', desc: 'รูปแบบการแสดงผลของกราฟความคืบหน้า', options: ['Line Chart', 'Area Chart', 'Scatter Plot'] },
                { type: 'check', label: 'Smooth Curves', desc: 'ปรับเส้นกราฟให้นิ่งขึ้นเพื่อให้มองเห็นแนวโน้ม (Trend) ได้ง่าย', checked: true },
            ],
            insight: { 
                title: 'Gradient Descent Curve', 
                text: 'เป้าหมายคือการหาจุด Global Minimum ของพื้นผิวความผิดพลาด เพื่อให้น้ำหนักของโมเดลแม่นยำที่สุด', 
                formula: 'θ = θ - η∇J(θ)' 
            }
        },
        {
            id: 'confusion-matrix', icon: '🧮', name: 'Confusion Matrix',
            subtitle: 'Model Reliability', badge: 'VIZ', color: 'rose',
            description: 'ตารางเปรียบเทียบระหว่างสิ่งที่ AI ทาย กับความจริง (Truth) เพื่อดูว่า AI มักสับสนวัตถุประเภทไหน',
            params: [
                { type: 'check', label: 'Normalize Values', desc: 'แสดงค่าเป็นเปอร์เซ็นต์ (0-1) แทนจำนวนนับปกติ', checked: true },
                { type: 'select', label: 'Color Schema', desc: 'โทนสีที่ใช้แสดงความหนาแน่นของข้อมูล (Heatmap)', options: ['Viridis (Standard)', 'Magma', 'Plasma'] },
            ],
            insight: { 
                title: 'F1-Score Balance', 
                text: 'F1-Score คือค่าเฉลี่ยที่สมดุลระหว่าง Precision (ทายแม่น) และ Recall (ทายครบ)', 
                formula: 'F1 = 2 * (Prec * Rec) / (Prec + Rec)' 
            }
        },
    ]
};
