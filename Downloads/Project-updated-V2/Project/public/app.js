const API = "/api/v1";
let currentUser = null;
let reportsCache = [];
let adminUsers = [];
let map, marker;
const statusText = { pending: "รอดำเนินการ", in_progress: "กำลังดำเนินการ", resolved: "แก้ไขแล้ว", rejected: "ไม่รับดำเนินการ" };

async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData) && options.body) headers["Content-Type"] = "application/json";
  const response = await fetch(API + path, {
    ...options,
    headers,
    credentials: "same-origin"
  });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "เกิดข้อผิดพลาด");
  return data;
}
function toast(msg) { const el = document.getElementById("toast"); el.textContent = msg; el.classList.add("show"); setTimeout(() => el.classList.remove("show"), 2800) }
const departmentRoles = [
  "เจ้าหน้าที่ถนนและทางเดิน",
  "เจ้าหน้าที่น้ำและท่อระบายน้ำ",
  "เจ้าหน้าที่อาคารและสถานที่",
  "เจ้าหน้าที่ไฟฟ้าและแสงสว่าง",
  "เจ้าหน้าที่อุบัติเหตุและความปลอดภัย"
];
function isAdmin() {
  return ["แอดมิน", "ผู้ดูแลระบบ"].includes(currentUser?.user_role);
}
function isStaff() {
  return isAdmin() || ["เจ้าหน้าที่", ...departmentRoles].includes(currentUser?.user_role);
}

function showPage(name) {
  // ตรวจสอบสิทธิ์ก่อนเปิดหน้า Admin
  if (name === "admin" && !isAdmin()) {
    toast("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
    name = currentUser ? "home" : "auth";
  }

  document.querySelectorAll("main .page").forEach(p => p.classList.add("hidden"));
  const el = document.getElementById(name + "Page");
  if (el) el.classList.remove("hidden");

  if (name === "home") loadLatest();
  if (name === "reports") loadReports();
  if (name === "mine") loadMine();
  if (name === "contacts") loadContacts();
  if (name === "admin") loadAdminUsers();

  if (name === "create") {
    if (!currentUser) { showPage("auth"); return; }
    loadCategories().then(initMap);
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}
function updateAccount() {
  const area = document.getElementById("accountArea");
  const adminMenu = document.getElementById("adminMenu");

  if (adminMenu) {
    adminMenu.classList.toggle("hidden", !isAdmin());
  }

  area.innerHTML = currentUser
    ? `<span class="user-chip">สวัสดี, ${escapeHtml(currentUser.user_name || "ผู้ใช้งาน")} </span>
       <button class="text-btn" onclick="logout()">ออกจากระบบ</button>`
    : `<button class="btn secondary" onclick="showPage('auth')">เข้าสู่ระบบ</button>`;
}
async function logout() {
  try { await api("/auth/logout", { method: "POST" }); }
  catch (e) { console.error(e); }
  currentUser = null;
  updateAccount();
  toast("ออกจากระบบแล้ว");
  showPage("home");
}
// =========================
// ADMIN: จัดการสมาชิกและ Role
// API ที่ใช้:
// GET   /api/v1/admin/users
// PATCH  /api/v1/admin/users/:id/role
// DELETE /api/v1/admin/users/:id
// =========================


function renderAdminUsers() {
  const tbody = document.getElementById("adminUsersList");
  if (!tbody) return;

  const keyword = (document.getElementById("adminSearch")?.value || "").trim().toLowerCase();

  const filtered = adminUsers.filter(user => {
    const name = user.user_name || "";
    const email = user.user_email || user.email || "";
    const role = user.user_role || "";
    return `${name} ${email} ${role}`.toLowerCase().includes(keyword);
  });

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">ไม่พบข้อมูลสมาชิก</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(user => {
    const id = user._id || user.id;
    const name = user.user_name || "ไม่ระบุชื่อ";
    const email = user.user_email || user.email || "ไม่ระบุอีเมล";
    const role = user.user_role || "";

    return `
      <tr>
        <td>${escapeHtml(name)}</td>
        <td>${escapeHtml(email)}</td>
        <td>${escapeHtml(role)}</td>
        <td>
          <select id="role-${escapeHtml(String(id))}">
            <option value="บุคลากรมหาลัย" ${role === "บุคลากรมหาลัย" ? "selected" : ""}>บุคลากรมหาลัย</option>
            <option value="เจ้าหน้าที่" ${role === "เจ้าหน้าที่" ? "selected" : ""}>เจ้าหน้าที่ (ทุกหมวด)</option>
            ${departmentRoles.map(deptRole => `<option value="${deptRole}" ${role === deptRole ? "selected" : ""}>${deptRole}</option>`).join("")}
            <option value="แอดมิน" ${role === "แอดมิน" || role === "ผู้ดูแลระบบ" ? "selected" : ""}>แอดมิน</option>
          </select>
        </td>
        <td>
          <div class="admin-actions">
            <button class="btn primary" type="button"
              onclick="saveAdminRole('${escapeHtml(String(id))}')">บันทึก</button>
            <button class="btn secondary" type="button"
              onclick="deleteAdminUser('${escapeHtml(String(id))}')">ลบสมาชิก</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}


async function loadAdminUsers() {
  if (!isAdmin()) {
    toast("คุณไม่มีสิทธิ์เข้าถึงข้อมูลสมาชิก");
    return;
  }

  const tbody = document.getElementById("adminUsersList");
  if (tbody) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">กำลังโหลดข้อมูลสมาชิก...</td></tr>`;
  }

  try {
    const result = await api("/admin/users");
    adminUsers = Array.isArray(result) ? result : (result.users || []);
    renderAdminUsers();
  } catch (err) {
    adminUsers = [];
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">${escapeHtml(err.message)}</td></tr>`;
    }
    toast(err.message);
  }
}

async function addAdminMember(event) {
  event.preventDefault();
  if (!isAdmin()) { toast("คุณไม่มีสิทธิ์ดำเนินการ"); return; }

  const form = document.getElementById("addMemberForm");
  const formData = new FormData(form);
  const payload = {
    user_name: String(formData.get("user_name") || "").trim(),
    user_email: String(formData.get("user_email") || "").trim().toLowerCase(),
    user_role: String(formData.get("user_role") || "บุคลากรมหาลัย")
  };

  if (!payload.user_email.endsWith("@kmitl.ac.th")) {
    toast("กรุณาใช้อีเมล @kmitl.ac.th เท่านั้น");
    return;
  }

  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) { submitButton.disabled = true; submitButton.textContent = "กำลังเพิ่มสมาชิก..."; }
  try {
    const result = await api("/admin/users", { method: "POST", body: JSON.stringify(payload) });
    toast(result.message || "เพิ่มสมาชิกเรียบร้อย");
    form.reset();
    await loadAdminUsers();
  } catch (err) {
    toast(err.message);
  } finally {
    if (submitButton) { submitButton.disabled = false; submitButton.textContent = "＋ เพิ่มสมาชิก"; }
  }
}

async function deleteAdminUser(id) {
  if (!isAdmin()) {
    toast("คุณไม่มีสิทธิ์ดำเนินการ");
    return;
  }

  const user = adminUsers.find(item => String(item._id || item.id) === String(id));
  if (!user) {
    toast("ไม่พบข้อมูลสมาชิกที่ต้องการลบ");
    return;
  }

  const targetId = String(user._id || user.id);
  const currentId = String(currentUser?._id || currentUser?.id || "");
  if (targetId === currentId) {
    toast("ไม่สามารถลบบัญชีของตัวเองได้");
    return;
  }

  const memberName = user.user_name || user.user_email || user.email || "สมาชิกคนนี้";
  const confirmed = confirm(`ยืนยันการลบสมาชิก\n\n${memberName}\n\nเมื่อลบแล้วจะไม่สามารถกู้คืนได้`);
  if (!confirmed) return;

  try {
    const result = await api(`/admin/users/${encodeURIComponent(targetId)}`, {
      method: "DELETE"
    });
    toast(result?.message || "ลบสมาชิกเรียบร้อย");
    await loadAdminUsers();
  } catch (err) {
    toast(err.message);
  }
}

async function saveAdminRole(id) {
  if (!isAdmin()) {
    toast("คุณไม่มีสิทธิ์ดำเนินการ");
    return;
  }

  const select = document.getElementById(`role-${id}`);
  if (!select) return;

  const user = adminUsers.find(item => String(item._id || item.id) === String(id));
  if (user && String(user._id || user.id) === String(currentUser?._id || currentUser?.id)) {
    toast("ไม่สามารถเปลี่ยน Role ของบัญชีตัวเองได้");
    return;
  }

  try {
    await api(`/admin/users/${encodeURIComponent(id)}/role`, {
      method: "PATCH",
      body: JSON.stringify({ user_role: select.value })
    });

    toast("เปลี่ยน Role สมาชิกเรียบร้อย");
    await loadAdminUsers();
  } catch (err) {
    toast(err.message);
  }
}

function escapeHtml(s = "") { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])) }
function statusBadge(status) { return `<span class="status ${status}">${statusText[status] || status}</span>` }
function card(r) {
  const cat = r.cat_id || {}; const img = r.images?.[0]?.image_url;
  const date = r.created_at ? new Date(r.created_at).toLocaleDateString("th-TH") : "";
  return `<article class="report-card" onclick="showDetail('${r._id}')"><div class="report-image">${img ? `<img src="${img}" alt="ภาพประกอบ">` : (cat.cat_icon || "📌")}</div><div class="report-body"><h3>${escapeHtml(r.report_title)}</h3><p>${escapeHtml(r.report_desc)}</p><div class="meta"><span>${escapeHtml(cat.cat_name || "ไม่ระบุประเภท")} · ${date}</span>${statusBadge(r.status)}</div></div></article>`;
}
function renderList(target, arr) { document.getElementById(target).innerHTML = arr.length ? arr.map(card).join("") : `<div class="empty">ยังไม่มีรายการแจ้งปัญหา</div>` }
async function loadLatest() { try { const a = await api("/reports"); reportsCache = a; renderList("latestReports", a.slice(0, 3)) } catch (e) { document.getElementById("latestReports").innerHTML = '<div class="empty">ไม่สามารถโหลดข้อมูลได้</div>' } }
async function loadReports() { try { reportsCache = await api("/reports"); renderReports() } catch (e) { document.getElementById("allReports").innerHTML = `<div class="empty">${escapeHtml(e.message)}</div>` } }
function renderReports() { const q = (document.getElementById("searchReports")?.value || "").toLowerCase(); const st = document.getElementById("filterStatus")?.value || ""; renderList("allReports", reportsCache.filter(r => (!st || r.status === st) && (`${r.report_title} ${r.report_desc}`).toLowerCase().includes(q))) }
async function loadMine() { if (!currentUser) { showPage("auth"); return } try { const a = await api("/reports/me"); renderList("myReports", a) } catch (e) { toast(e.message) } }
async function loadCategories() { try { const cats = await api("/categories"); const select = document.getElementById("categorySelect"); if (select) select.innerHTML = '<option value="">เลือกประเภทปัญหา</option>' + cats.map(c => `<option value="${c._id}">${c.cat_icon || "📌"} ${escapeHtml(c.cat_name)}</option>`).join("") } catch (e) { toast(e.message) } }
async function loadContacts() {
  const target = document.getElementById("departmentContacts");
  try {
    const cats = await api("/categories");
    target.innerHTML = cats.map(c => `<article class="report-card contact-directory-card"><div class="report-body"><div class="step-icon">${c.cat_icon || "📌"}</div><h3>${escapeHtml(c.contact_agency || c.cat_name)}</h3><p>${escapeHtml(c.cat_name)}</p><div class="contact-channel-list">${(c.contact_channels || []).length ? c.contact_channels.map(ch => `<p>${escapeHtml(ch)}</p>`).join("") : '<p class="meta">ยังไม่ได้ระบุช่องทางติดต่อ</p>'}</div></div></article>`).join("") || '<div class="empty">ยังไม่มีข้อมูลหน่วยงาน</div>';
  } catch (e) { target.innerHTML = `<div class="empty">${escapeHtml(e.message)}</div>`; }
}
function initMap() {
  if (map) { setTimeout(() => map.invalidateSize(), 150); return }
  map = L.map("map").setView([13.729, 100.775], 15);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap" }).addTo(map);
  map.on("click", e => setMarker(e.latlng.lat, e.latlng.lng));
  setTimeout(() => map.invalidateSize(), 250);
}
function setMarker(lat, lng) {
  if (marker) marker.setLatLng([lat, lng]); else marker = L.marker([lat, lng], { draggable: true }).addTo(map).on("dragend", e => { const p = e.target.getLatLng(); setMarker(p.lat, p.lng) });
  document.getElementById("latitude").value = lat; document.getElementById("longitude").value = lng;
  document.getElementById("latText").textContent = lat.toFixed(6); document.getElementById("lngText").textContent = lng.toFixed(6);
}
function locateMe() {
  if (!navigator.geolocation) return toast("เบราว์เซอร์ไม่รองรับตำแหน่งปัจจุบัน");
  navigator.geolocation.getCurrentPosition(pos => { const { latitude, longitude } = pos.coords; map.setView([latitude, longitude], 17); setMarker(latitude, longitude) }, () => toast("ไม่สามารถเข้าถึงตำแหน่งได้ กรุณาอนุญาต Location"));
}
document.getElementById("reportForm").addEventListener("submit", async e => {
  e.preventDefault(); if (!currentUser) return showPage("auth");
  const f = new FormData(e.target); const latitude = f.get("latitude"), longitude = f.get("longitude");
  if (!latitude || !longitude) return toast("กรุณาปักหมุดตำแหน่งบนแผนที่");
  try {
    const result = await api("/reports", { method: "POST", body: JSON.stringify(Object.fromEntries(f)) }); toast("ส่งเรื่องแจ้งปัญหาเรียบร้อย");
    e.target.reset(); if (marker) { map.removeLayer(marker); marker = null } document.getElementById("latText").textContent = "ยังไม่ได้เลือก"; document.getElementById("lngText").textContent = "ยังไม่ได้เลือก";
    showDetail(result.report._id);
  } catch (err) { toast(err.message) }
});
async function showDetail(id) {
  showPage("detail");
  try {
    const r = await api("/reports/" + id);
    const currentImageCount = (r.images || []).length;
    const remainingImageSlots = Math.max(0, 5 - currentImageCount);
    const images = (r.images || []).map(i => `<img src="${i.image_url}" alt="ภาพประกอบ">`).join("");
    const staff = isStaff();
    const contactInfo = staff ? `<div class="contact-panel"><h3>หน่วยงานที่รับผิดชอบ</h3><p>${escapeHtml(r.cat_id?.contact_agency || "ยังไม่ได้กำหนดหน่วยงาน")}</p><h3>ช่องทางติดต่อ</h3><ul>${(r.cat_id?.contact_channels || []).map(channel => `<li>${escapeHtml(channel)}</li>`).join("") || "<li>ยังไม่ได้กำหนดช่องทางติดต่อ</li>"}</ul></div>` : "";
    const tracking = (r.tracking || []).map((item, index) => {
      const updateImages = (item.images || []).map(url => `<a href="${url}" target="_blank" rel="noopener"><img src="${url}" alt="ภาพประกอบการอัปเดต"></a>`).join("");
      return `<div class="tracking-step ${index === (r.tracking || []).length - 1 ? "current" : ""}"><span class="tracking-dot"></span><div><b>${escapeHtml(statusText[item.status] || item.status)}</b><p>${escapeHtml(item.note || "อัปเดตสถานะ")}</p>${updateImages ? `<div class="tracking-images">${updateImages}</div>` : ""}<small>${escapeHtml(item.updated_by_name || "เจ้าหน้าที่")} · ${new Date(item.created_at).toLocaleString("th-TH")}</small></div></div>`;
    }).join("");
    const reporterLine = staff ? `<p class="meta">ผู้แจ้ง: ${escapeHtml(r.user_id?.user_name || "ไม่ระบุชื่อ")} · </p>` : "";
    document.getElementById("reportDetail").innerHTML = `<div class="detail-card"><span class="eyebrow">${escapeHtml(r.cat_id?.cat_name || "รายงาน")}</span><h1>${escapeHtml(r.report_title)}</h1>${statusBadge(r.status)}<p>${escapeHtml(r.report_desc)}</p>${reporterLine}<p class="meta">${new Date(r.created_at).toLocaleString("th-TH")}</p><div class="tracking-panel"><h3>ติดตามความคืบหน้า</h3><p class="meta">เจ้าหน้าที่ผู้ดูแล: ${escapeHtml(r.assigned_to?.user_name || "รอเจ้าหน้าที่รับผิดชอบ")}</p><div class="tracking-list">${tracking || '<div class="tracking-step"><span class="tracking-dot"></span><div><b>รอดำเนินการ</b><p>รับแจ้งปัญหาแล้ว</p></div></div>'}</div></div><div class="detail-images">${images || "<span class='meta'>ไม่มีรูปภาพประกอบ</span>"}</div><p class="meta">ตำแหน่ง: ${Number(r.latitude).toFixed(6)}, ${Number(r.longitude).toFixed(6)}</p><a target="_blank" rel="noopener" href="https://www.google.com/maps?q=${r.latitude},${r.longitude}">เปิดตำแหน่งใน Google Maps ↗</a>
    ${currentUser && String(r.user_id?._id || r.user_id) === String(currentUser.id) ? (
      remainingImageSlots > 0
        ? `<form id="imageForm" style="margin-top:20px">
             <label>เพิ่มรูปภาพประกอบ (เพิ่มได้อีก ${remainingImageSlots} รูป, สูงสุด 5 รูปต่อปัญหา, ไม่เกิน 5MB/รูป)</label>
             <input type="file" name="images" accept="image/*" multiple data-remaining="${remainingImageSlots}">
             <button class="btn secondary" style="margin-top:10px">อัปโหลดรูป</button>
           </form>`
        : `<p class="meta" style="margin-top:20px">แนบรูปภาพครบ 5 รูปแล้ว ไม่สามารถเพิ่มรูปได้อีก</p>`
    ) : ""}
    ${staff ? `${contactInfo}<div class="admin-tools"><b>อัปเดตความคืบหน้า</b><select id="adminStatus">${Object.entries(statusText).map(([k, v]) => `<option value="${k}" ${r.status === k ? "selected" : ""}>${v}</option>`).join("")}</select><input id="statusNote" maxlength="500" placeholder="บันทึกหมายเหตุ / รายละเอียดการดำเนินงาน (ถ้ามี)"><label for="statusImages">แนบรูปภาพประกอบ (ไม่บังคับ, สูงสุด 5 รูป, ไม่เกิน 5MB/รูป)</label><input id="statusImages" type="file" accept="image/*" multiple><button class="btn primary" onclick="changeStatus('${r._id}')">บันทึกความคืบหน้า</button><button class="btn secondary" onclick="deleteReport('${r._id}')">ลบรายการ</button></div>` : ""}
    </div>`;

    const imageForm = document.getElementById("imageForm");
    if (imageForm) {
      const imageInput = imageForm.querySelector('input[type="file"]');
      imageInput.addEventListener("change", () => {
        const selectedFiles = [...imageInput.files];
        const remaining = Number(imageInput.dataset.remaining || 0);

        if (selectedFiles.length > remaining) {
          toast(`ปัญหานี้เพิ่มรูปได้อีก ${remaining} รูปเท่านั้น`);
          imageInput.value = "";
          return;
        }

        const oversizedFile = selectedFiles.find(file => file.size > 5 * 1024 * 1024);
        if (oversizedFile) {
          toast("รูปภาพต้องมีขนาดไม่เกิน 5MB ต่อรูป");
          imageInput.value = "";
        }
      });

      imageForm.addEventListener("submit", async ev => {
        ev.preventDefault();
        const files = [...imageInput.files];
        const remaining = Number(imageInput.dataset.remaining || 0);

        if (!files.length) {
          toast("กรุณาเลือกรูปภาพก่อนอัปโหลด");
          return;
        }
        if (files.length > remaining) {
          toast(`ปัญหานี้เพิ่มรูปได้อีก ${remaining} รูปเท่านั้น`);
          imageInput.value = "";
          return;
        }
        if (files.some(file => file.size > 5 * 1024 * 1024)) {
          toast("รูปภาพต้องมีขนาดไม่เกิน 5MB ต่อรูป");
          imageInput.value = "";
          return;
        }

        const fd = new FormData();
        files.forEach(file => fd.append("images", file));

        try {
          await api(`/reports/${id}/images`, { method: "POST", body: fd });
          toast("อัปโหลดรูปสำเร็จ");
          showDetail(id);
        } catch (e) {
          toast(e.message);
        }
      });
    }
  } catch (e) { document.getElementById("reportDetail").innerHTML = `<div class="empty">${escapeHtml(e.message)}</div>` }
}
async function changeStatus(id) {
  const files = [...(document.getElementById("statusImages")?.files || [])];
  if (files.length > 5) return toast("แนบรูปได้สูงสุด 5 รูปต่อการอัปเดต");
  if (files.some(file => !file.type.startsWith("image/") || file.size > 5 * 1024 * 1024)) return toast("กรุณาเลือกไฟล์รูปภาพขนาดไม่เกิน 5MB ต่อรูป");
  const form = new FormData();
  form.append("status", document.getElementById("adminStatus").value);
  form.append("note", document.getElementById("statusNote")?.value || "");
  files.forEach(file => form.append("images", file));
  try { await api(`/reports/${id}/status`, { method: "PATCH", body: form }); toast("อัปเดตสถานะแล้ว"); showDetail(id) } catch (e) { toast(e.message) }
}
async function deleteReport(id) { if (!confirm("ยืนยันลบรายการนี้?")) return; try { await api(`/reports/${id}`, { method: "DELETE" }); toast("ลบรายการแล้ว"); showPage("reports") } catch (e) { toast(e.message) } }
async function handleGoogleCredential(response) {
  const message = document.getElementById("googleLoginMessage");
  try {
    message.textContent = "กำลังตรวจสอบบัญชี Google...";
    const result = await api("/auth/google", {
      method: "POST",
      body: JSON.stringify({ credential: response.credential })
    });
    currentUser = result.user;
    updateAccount();
    message.textContent = "";
    toast(result.message);
    showPage("home");
  } catch (err) {
    message.textContent = err.message;
    currentUser = null;
    updateAccount();
  }
}

async function initGoogleLogin() {
  const target = document.getElementById("googleLoginButton");
  const message = document.getElementById("googleLoginMessage");
  if (!target) return;
  try {
    const config = await api("/auth/google/config");
    const waitForGoogle = () => {
      if (!window.google?.accounts?.id) { setTimeout(waitForGoogle, 150); return; }
      google.accounts.id.initialize({
        client_id: config.clientId,
        callback: handleGoogleCredential,
        auto_select: false,
        cancel_on_tap_outside: true
      });
      google.accounts.id.renderButton(target, {
        type: "standard", theme: "outline", size: "large", text: "signin_with",
        shape: "rectangular", width: 280, locale: "th"
      });
    };
    waitForGoogle();
  } catch (err) {
    message.textContent = err.message || "ไม่สามารถโหลด Google Login ได้";
  }
}

async function restoreSession() {
  try {
    const result = await api("/auth/me");
    currentUser = result.user;
  } catch (e) {
    currentUser = null;
  }
  updateAccount();
  loadLatest();
}
initGoogleLogin();
restoreSession();