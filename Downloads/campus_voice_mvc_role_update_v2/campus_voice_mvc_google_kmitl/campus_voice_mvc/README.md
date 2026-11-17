# Campus Voice - MVC (KMITL Google Login)

## ระบบเข้าสู่ระบบ
- ใช้ Google Identity Services (Sign in with Google) เท่านั้น ไม่มีสมัครสมาชิกหรือเข้าสู่ระบบด้วยรหัสผ่านในหน้าเว็บ/API
- Backend ตรวจสอบ Google ID Token ด้วย `google-auth-library` โดยตรวจ signature, issuer, expiry และ audience (`GOOGLE_CLIENT_ID`)
- อนุญาตเฉพาะ `email_verified=true`, อีเมลลงท้ายตรงตัว `@kmitl.ac.th` และ Google Workspace hosted-domain claim (`hd`) เท่ากับ `kmitl.ac.th`
- ผู้ใช้ใหม่ถูกสร้างใน MongoDB โดย Role เริ่มต้น `บุคลากรมหาลัย`; Role เดิมของบัญชีที่มีอยู่จะไม่ถูกเปลี่ยน และไม่รับ Role จาก browser
- JWT ถูกส่งกลับเป็น `cv_token` HttpOnly Cookie เท่านั้น

## ตั้งค่า Google Cloud
1. เปิด Google Cloud Console และเลือก/สร้าง Project
2. ตั้งค่า OAuth consent screen / Google Auth Platform ให้เรียบร้อย
3. สร้าง OAuth Client ID ชนิด Web application
4. ใน Authorized JavaScript origins เพิ่ม `http://localhost:3000` สำหรับทดสอบ
5. เมื่อ Deploy ให้เพิ่ม origin จริง เช่น `https://your-domain.example` (ต้องตรงกับ URL ที่ผู้ใช้เปิด)
6. คัดลอก Client ID ไปใส่ `GOOGLE_CLIENT_ID` ใน `.env`
7. ไม่ต้องกำหนด redirect URI สำหรับ flow นี้ เพราะใช้ Google Identity Services popup callback
8. ตั้งค่า Audience/ผู้ใช้ทดสอบใน Google Cloud ตามนโยบาย Workspace ของมหาวิทยาลัย หากต้องการให้บัญชี KMITL ทั้งหมดใช้ได้ ต้องประสานผู้ดูแล Google Workspace ของ KMITL

## ติดตั้งและรัน
1. Node.js 20+
2. `npm install`
3. คัดลอก `.env.example` เป็น `.env`
4. ตั้ง `MONGODB_URI`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`
5. `npm start`
6. เปิด `http://localhost:3000`

## API Authentication
- `GET /api/v1/auth/google/config` — ส่ง Client ID ให้หน้าเว็บ
- `POST /api/v1/auth/google` — รับ Google ID credential, verify และตั้ง HttpOnly Cookie
- `GET /api/v1/auth/me` — ตรวจ session
- `POST /api/v1/auth/logout` — ล้าง Cookie

API `/register` และ `/login` แบบ Email/Password ถูกถอดออกจาก Routes แล้ว

## หมายเหตุ Role
Role ที่มีอยู่ยังคงเดิม: `บุคลากรมหาลัย`, `แอดมิน`, `เจ้าหน้าที่` ผู้ใช้ใหม่ได้ Role `บุคลากรมหาลัย` เท่านั้น การแต่งตั้ง Admin/เจ้าหน้าที่ต้องทำโดยผู้ดูแลผ่านฐานข้อมูลหรือระบบจัดการสิทธิ์ที่เชื่อถือได้ ห้ามให้ client ส่ง role มาเอง

## หมายเหตุฐานข้อมูล
Source เดิมใช้ MongoDB + Mongoose จึงคงฐานข้อมูลเดิมไว้ `user_password` เปลี่ยนเป็น optional เพื่อรองรับบัญชี Google ส่วนข้อมูลเดิมและ Role เดิมไม่ถูกลบ

## Role เจ้าหน้าที่แยกตามประเภทปัญหา
- `เจ้าหน้าที่ถนนและทางเดิน` เห็นและจัดการเฉพาะหมวดถนนและทางเดิน
- `เจ้าหน้าที่น้ำและท่อระบายน้ำ` เห็นและจัดการเฉพาะหมวดน้ำและท่อระบายน้ำ
- `เจ้าหน้าที่อาคารและสถานที่` เห็นและจัดการเฉพาะหมวดอาคารและสถานที่
- `เจ้าหน้าที่ไฟฟ้าและแสงสว่าง` เห็นและจัดการเฉพาะหมวดไฟฟ้าและแสงสว่าง
- `เจ้าหน้าที่อุบัติเหตุและความปลอดภัย` เห็นและจัดการเฉพาะหมวดอุบัติเหตุและความปลอดภัย
- `เจ้าหน้าที่` เดิมยังคงเห็นและจัดการได้ทุกหมวด ส่วน `แอดมิน` จัดการสมาชิกและดูแลได้ทุกหมวด
- การกรองรายการและการตรวจสิทธิ์แก้ไขสถานะ/ลบทำที่ Backend ด้วย ไม่ได้อาศัยการซ่อนข้อมูลเฉพาะหน้าเว็บ
- หน้าแสดงการจัดการสถานะจะแสดงหน่วยงานรับผิดชอบและช่องทางติดต่อของหมวดนั้น โดยข้อมูลถูกกำหนดไว้ใน `config/seedCategories.js`
- หมวด `อื่น ๆ` ถูกนำออกจากรายการหมวดปัญหา

หลังเปลี่ยน Role ให้ผู้ใช้เข้าสู่ระบบใหม่เพื่อรับสิทธิ์ Role ล่าสุดใน Session

## เพิ่มสมาชิกจากหน้าจัดการสมาชิก (Admin)

- Admin สามารถเพิ่มสมาชิกโดยกรอกชื่อ อีเมล `@kmitl.ac.th` และ Role ได้จากหน้า **จัดการสมาชิก**
- ระบบจะสร้างบัญชีไว้ล่วงหน้าโดยไม่ต้องกำหนดรหัสผ่าน เพราะการเข้าสู่ระบบใช้ Google Login
- สมาชิกที่ถูกเพิ่มต้องเข้าสู่ระบบด้วย Google Account ที่ใช้อีเมลตรงกับอีเมลที่ Admin ลงทะเบียนไว้ ระบบจึงจะเชื่อมบัญชี Google กับ Role ที่กำหนดให้
- API `POST /api/v1/admin/users` จำกัดสิทธิ์เฉพาะ Admin และตรวจสอบอีเมลซ้ำกับ Role ที่อนุญาต
