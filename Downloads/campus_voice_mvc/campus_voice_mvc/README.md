# Campus Voice - MVC

โปรเจกต์นี้แยกโครงสร้างจาก `server.js` เดิมเป็น Model, View, Controller และ Routes โดยคงหน้าเว็บเดิมและ API prefix `/api/v1` ไว้

## โครงสร้าง

- `models/` — User, Category, Report, ReportImage
- `views/` — หน้าเว็บเดิมเก็บใน `public/` ตามที่โปรเจกต์ใช้ static HTML
- `public/` — index.html, style.css, app.js
- `controllers/` — การทำงานของ Authentication, Category และ Report
- `routes/` — เส้นทาง API
- `middleware/` — ตรวจ JWT จาก Cookie และอัปโหลดรูป
- `config/` — เชื่อมต่อ MongoDB และ seed ประเภทปัญหา
- `uploads/` — รูปภาพที่ผู้ใช้แนบ

## ติดตั้งและรัน

1. ติดตั้ง Node.js 20 ขึ้นไป
2. รัน `npm install`
3. คัดลอก `.env.example` เป็น `.env`
4. กำหนด `MONGODB_URI` และ `JWT_SECRET` ใน `.env`
5. รัน `npm start`
6. เปิด `http://localhost:3000`

## HttpOnly Cookie

เมื่อ login/register สำเร็จ เซิร์ฟเวอร์จะส่ง JWT ใน Cookie ชื่อ `cv_token` โดยกำหนด `HttpOnly`, `SameSite=Lax` และ `Secure` เมื่อ `NODE_ENV=production` เท่านั้น JavaScript ฝั่ง browser จะอ่าน token นี้ไม่ได้

Frontend ใช้ `GET /api/v1/auth/me` เพื่อกู้คืนสถานะผู้ใช้หลัง refresh และ `POST /api/v1/auth/logout` เพื่อล้าง Cookie

## API หลัก

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`
- `GET /api/v1/categories`
- `GET /api/v1/reports`
- `GET /api/v1/reports/me`
- `POST /api/v1/reports`
- `GET /api/v1/reports/:id`
- `POST /api/v1/reports/:id/images`
- `PATCH /api/v1/reports/:id/status` (แอดมิน/เจ้าหน้าที่)
- `DELETE /api/v1/reports/:id` (แอดมิน/เจ้าหน้าที่)

## หมายเหตุ

ฐานข้อมูลใน source ที่ได้รับเป็น MongoDB + Mongoose ไม่ใช่ MySQL จึงคง MongoDB ไว้เพื่อไม่ให้ข้อมูลเดิมและการเชื่อมต่อฐานข้อมูลเปลี่ยนโดยไม่ตั้งใจ
