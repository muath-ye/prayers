const TRANSLATIONS = {
  en: {
    today: "Today",
    loading: "Loading…",
    loaded: "Loaded. Click any day.",
    selectedDay: "Selected day",
    nextPrayer: "Next prayer",
    timeLeft: "Time left",
    monthlyTrend: "Monthly trend",
    allPrayers: "All Prayers",
    clickHint: "Click a day to view details",
    missingData: "Missing data",
    noDataDay: "No data for this day",
    prayerTime: "Prayer time",
    notPrayer: "Not a prayer time",
    chartNote: "Times shown as minutes since midnight (for clean trend lines).",

    prayers: {
      Fajr: "Fajr",
      Sunrise: "Sunrise",
      Dhuhr: "Dhuhr",
      Asr: "Asr",
      Maghrib: "Maghrib",
      Isha: "Isha",
    },
    notifyEnable: "Enable Alerts",
    notifyEnabled: "Enabled",
  },

  ar: {
    today: "اليوم",
    loading: "جارٍ التحميل…",
    loaded: "تم التحميل. اختر أي يوم.",
    selectedDay: "اليوم المحدد",
    nextPrayer: "الصلاة القادمة",
    timeLeft: "الوقت المتبقي",
    monthlyTrend: "الاتجاه الشهري",
    allPrayers: "جميع الصلوات",
    clickHint: "اضغط على يوم لعرض التفاصيل",
    missingData: "بيانات ناقصة",
    noDataDay: "لا توجد بيانات لهذا اليوم",
    prayerTime: "وقت الصلاة",
    notPrayer: "ليس وقت صلاة",
    chartNote: "الأوقات معروضة بالدقائق منذ منتصف الليل.",

    prayers: {
      Fajr: "الفجر",
      Sunrise: "الشروق",
      Dhuhr: "الظهر",
      Asr: "العصر",
      Maghrib: "المغرب",
      Isha: "العشاء",
    },
    notifyEnable: "تفعيل التنبيهات",
    notifyEnabled: "مفعلة",
  }
};

const AR_MONTHS = [
  "يناير","فبراير","مارس","أبريل","مايو","يونيو",
  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"
];

const AR_WEEKDAYS = [
  "الأحد","الاثنين","الثلاثاء","الأربعاء",
  "الخميس","الجمعة","السبت"
];


let currentLang = localStorage.getItem("lang")
  || (navigator.language.startsWith("ar") ? "ar" : "en");

const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS9INuSIGbRne2Z1THL0YZNaKijr3K-sO6mwpKzq6Ltnp_A9Sluo1yXBAYEl21bWTBvJ2kotkeOhyn5/pub?gid=0&single=true&output=csv";

const PRAYERS = [
  { key: "Fajr", icon: "🌙" },
  { key: "Sunrise", icon: "🌅" },
  { key: "Dhuhr", icon: "☀️" },
  { key: "Asr", icon: "🌤️" },
  { key: "Maghrib", icon: "🌇" },
  { key: "Isha", icon: "🌃" },
];

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const els = {
  subtitle: document.getElementById("subtitle"),
  monthTitle: document.getElementById("monthTitle"),
  calendarDays: document.getElementById("calendarDays"),
  dataStatus: document.getElementById("dataStatus"),

  selectedDateTitle: document.getElementById("selectedDateTitle"),
  selectedDateMeta: document.getElementById("selectedDateMeta"),

  prayerCards: document.getElementById("prayerCards"),

  nextPrayerName: document.getElementById("nextPrayerName"),
  nextPrayerAt: document.getElementById("nextPrayerAt"),
  countdown: document.getElementById("countdown"),
  progressBar: document.getElementById("progressBar"),
  prevPrayerLabel: document.getElementById("prevPrayerLabel"),
  nextPrayerLabel: document.getElementById("nextPrayerLabel"),
  progressPct: document.getElementById("progressPct"),

  chartMonthPill: document.getElementById("chartMonthPill"),
  trendChart: document.getElementById("trendChart"),

  prevMonth: document.getElementById("prevMonth"),
  nextMonth: document.getElementById("nextMonth"),
  todayBtn: document.getElementById("todayBtn"),

  themeToggle: document.getElementById("themeToggle"),
  themeIcon: document.getElementById("themeIcon"),
  themeLabel: document.getElementById("themeLabel"),
  
  langToggle: document.getElementById("langToggle"),
  langLabel: document.getElementById("langLabel"),

  dowHeader: document.getElementById("dowHeader"),

  notifyBtn: document.getElementById("notifyBtn"),
  notifyLabel: document.getElementById("notifyLabel"),
};

let dataByKey = new Map(); // key: "D-MMM" (e.g. "1-Jan") -> row object
let selectedDate = new Date();
let viewingYear = new Date().getFullYear();
let viewingMonth = new Date().getMonth(); // 0-11
let chart = null;
let tickTimer = null;

initTheme();
applyLanguage();
boot();

async function boot() {
  els.subtitle.textContent = "Fetching CSV…";
  try {
    const csvText = await fetch(CSV_URL, { cache: "no-store" }).then(r => {
      if (!r.ok) throw new Error(`Failed to fetch CSV: ${r.status}`);
      return r.text();
    });

    const rows = parseCSV(csvText);
    dataByKey = indexRows(rows);

    els.subtitle.textContent = "Loaded. Click any day.";
    els.dataStatus.textContent = `${dataByKey.size} rows`;

    // Start at today
    const now = new Date();
    viewingYear = now.getFullYear();
    viewingMonth = now.getMonth();
    selectedDate = now;

    wireUI();
    renderAll();
    startTicker();
  } catch (e) {
    console.error(e);
    els.subtitle.textContent = "Could not load CSV.";
    els.dataStatus.textContent = "Check the CSV link + CORS/publish settings.";
  }
}

function wireUI() {
  els.prevMonth.addEventListener("click", () => {
    viewingMonth--;
    if (viewingMonth < 0) { viewingMonth = 11; viewingYear--; }
    clampSelectedToViewingMonth();
    renderAll();
  });

  els.nextMonth.addEventListener("click", () => {
    viewingMonth++;
    if (viewingMonth > 11) { viewingMonth = 0; viewingYear++; }
    clampSelectedToViewingMonth();
    renderAll();
  });

  els.todayBtn.addEventListener("click", () => {
    const now = new Date();
    viewingYear = now.getFullYear();
    viewingMonth = now.getMonth();
    selectedDate = now;
    renderAll();
  });

  els.themeToggle.addEventListener("click", toggleTheme);

  els.langToggle.addEventListener("click", () => {
    currentLang = currentLang === "en" ? "ar" : "en";
    localStorage.setItem("lang", currentLang);
    applyLanguage();
    renderAll();
  });

  els.notifyBtn.addEventListener("click", async () => {
    const ok = await requestNotificationPermission();

    if (ok) {
      localStorage.setItem("alertsEnabled", "true");
      els.notifyLabel.textContent =
        currentLang === "ar" ? "مفعلة" : "Enabled ✅";
    }
  });
}

function applyLanguage() {
  const t = TRANSLATIONS[currentLang];

  // Switch page direction
  document.documentElement.lang = currentLang;
  document.body.dir = currentLang === "ar" ? "rtl" : "ltr";

  // Update static UI
  els.todayBtn.textContent = t.today;
  els.subtitle.textContent = t.loading;

  // Toggle button label
  els.langLabel.textContent = currentLang === "en" ? "AR" : "EN";

  // Update headers
  document.querySelector(".panel-title .kicker").textContent = t.selectedDay;
  document.querySelector(".next-prayer .kicker").textContent = t.nextPrayer;
  document.querySelector(".countdown .kicker").textContent = t.timeLeft;

  document.querySelector(".card .kicker").textContent = t.monthlyTrend;
  document.querySelector(".card .big").textContent = t.allPrayers;

  // document.querySelector(".hint").textContent = t.clickHint;
  document.querySelector(".card .small.muted").textContent = t.chartNote;

  els.notifyLabel.textContent =
    localStorage.getItem("alertsEnabled") === "true"
      ? t.notifyEnabled
      : t.notifyEnable;
}

function clampSelectedToViewingMonth() {
  if (selectedDate.getFullYear() !== viewingYear || selectedDate.getMonth() !== viewingMonth) {
    selectedDate = new Date(viewingYear, viewingMonth, 1);
  }
}

function renderAll() {
  renderWeekdays();
  renderMonthTitle();
  renderCalendar();
  renderSelectedDay();
  renderCards();
  renderChart();
  updateCountdownAndProgress();
}

function renderMonthTitle() {
  els.monthTitle.textContent = `${monthName(viewingMonth)} ${viewingYear}`;
}

function renderCalendar() {
  els.calendarDays.innerHTML = "";

  const first = new Date(viewingYear, viewingMonth, 1);
  const last = new Date(viewingYear, viewingMonth + 1, 0);
  const startDow = first.getDay(); // 0 Sun

  // pad leading blanks
  for (let i = 0; i < startDow; i++) {
    const blank = document.createElement("div");
    blank.className = "day muted";
    blank.innerHTML = `<div class="num"> </div><div class="mini"> </div>`;
    els.calendarDays.appendChild(blank);
  }

  const today = new Date();
  const isTodayMonth = today.getFullYear() === viewingYear && today.getMonth() === viewingMonth;

  for (let d = 1; d <= last.getDate(); d++) {
    const date = new Date(viewingYear, viewingMonth, d);
    const key = toSheetKey(date);
    const row = dataByKey.get(key);

    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "day";

    if (isTodayMonth && d === today.getDate()) cell.classList.add("today");
    if (sameDay(date, selectedDate)) cell.classList.add("selected");
    if (!row) cell.classList.add("missingdata");

    const t = TRANSLATIONS[currentLang];

    const mini = row
      ? `${t.prayers.Fajr} ${row.Fajr} • ${t.prayers.Maghrib} ${row.Maghrib}`
      : t.missingData;

    cell.innerHTML = `<div class="num">${d}</div><div class="mini">${mini}</div>`;

    cell.addEventListener("click", () => {
      selectedDate = date;
      // ensure month view stays consistent
      viewingYear = date.getFullYear();
      viewingMonth = date.getMonth();
      renderAll();
    });

    els.calendarDays.appendChild(cell);
  }
}

function renderSelectedDay() {
  els.selectedDateTitle.textContent = formatLongDate(selectedDate);
  els.selectedDateMeta.textContent = `Sheet key: ${toSheetKey(selectedDate)}`;

  els.chartMonthPill.textContent = `${monthName(viewingMonth)} ${viewingYear}`;
}

function renderCards() {
  els.prayerCards.innerHTML = "";
  const row = dataByKey.get(toSheetKey(selectedDate));

  if (!row) {
    els.prayerCards.innerHTML = `<div class="card" style="grid-column: 1 / -1; margin: 0;">
      <div class="big">No data for this day</div>
      <div class="small muted">This date wasn’t found in the CSV (check sheet completeness).</div>
    </div>`;
    return;
  }

  for (const p of PRAYERS) {
    const time = row[p.key] ?? "—";
    const card = document.createElement("div");
    card.className = "prayer-card";
    card.innerHTML = `
      <div class="prayer-left">
        <div class="badge">${p.icon}</div>
        <div>
          <div class="prayer-name">
            ${TRANSLATIONS[currentLang].prayers[p.key]}
          </div>
          <div class="prayer-sub">
            ${p.key === "Sunrise"
              ? TRANSLATIONS[currentLang].notPrayer
              : TRANSLATIONS[currentLang].prayerTime}
          </div>
        </div>
      </div>
      <div class="prayer-time">${time}</div>
    `;
    els.prayerCards.appendChild(card);
  }
}

function renderChart() {
  const monthRows = getMonthRows(viewingYear, viewingMonth);

  const labels = monthRows.map(r => r.dayNum);

  // Collect all prayers
  const fajr     = monthRows.map(r => prayerToMinutes(r.row.Fajr, "Fajr"));
  const sunrise  = monthRows.map(r => prayerToMinutes(r.row.Sunrise, "Sunrise"));
  const dhuhr    = monthRows.map(r => prayerToMinutes(r.row.Dhuhr, "Dhuhr"));
  const asr      = monthRows.map(r => prayerToMinutes(r.row.Asr, "Asr"));
  const maghrib  = monthRows.map(r => prayerToMinutes(r.row.Maghrib, "Maghrib"));
  const isha     = monthRows.map(r => prayerToMinutes(r.row.Isha, "Isha"));

  const textColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--muted")
    .trim();

  const gridColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--border")
    .trim();

  if (chart) chart.destroy();

  chart = new Chart(els.trendChart, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: TRANSLATIONS[currentLang].prayers.Fajr,
          data: fajr,
          tension: 0.3,
          pointRadius: 2
        },
        {
          label: TRANSLATIONS[currentLang].prayers.Sunrise,
          data: sunrise,
          tension: 0.3,
          pointRadius: 2
        },
        {
          label: TRANSLATIONS[currentLang].prayers.Dhuhr,
          data: dhuhr,
          tension: 0.3,
          pointRadius: 2
        },
        {
          label: TRANSLATIONS[currentLang].prayers.Asr,
          data: asr,
          tension: 0.3,
          pointRadius: 2
        },
        {
          label: TRANSLATIONS[currentLang].prayers.Maghrib,
          data: maghrib,
          tension: 0.3,
          pointRadius: 2
        },
        {
          label: TRANSLATIONS[currentLang].prayers.Isha,
          data: isha,
          tension: 0.3,
          pointRadius: 2
        }
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: textColor },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              return `${ctx.dataset.label}: ${minsToHHMM(ctx.parsed.y)}`;
            },
          },
        },
      },
      scales: {
        x: {
          ticks: { color: textColor },
          grid: { color: gridColor },
        },
        y: {
          ticks: {
            color: textColor,
            callback: (v) => minsToHHMM(v),
          },
          grid: { color: gridColor },
        },
      },
    },
  });
}

function renderWeekdays() {
  const isArabic = currentLang === "ar";

  const days = isArabic
    ? ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"]
    : ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  els.dowHeader.innerHTML = days.map(d => `<div>${d}</div>`).join("");
}

function startTicker() {
  if (tickTimer) clearInterval(tickTimer);
  tickTimer = setInterval(updateCountdownAndProgress, 1000);
}

function updateCountdownAndProgress() {
  const now = new Date();
  const todayKey = toSheetKey(now);
  const todayRow = dataByKey.get(todayKey);
  let lastNotified = localStorage.getItem("lastNotified") || "";

  if (!todayRow) {
    els.nextPrayerName.textContent = "—";
    els.nextPrayerAt.textContent = "No data for today";
    els.countdown.textContent = "—";
    els.progressBar.style.width = "0%";
    els.prevPrayerLabel.textContent = "—";
    els.nextPrayerLabel.textContent = "—";
    els.progressPct.textContent = "—";
    return;
  }

  // Build today's schedule
  const PRAYER_ORDER = ["Fajr","Dhuhr","Asr","Maghrib","Isha"];

  const schedule = PRAYER_ORDER.map(name => ({
    name,
    timeStr: todayRow[name],
    dateObj: timeToDate(now, todayRow[name], name),
  }));

  schedule.sort((a,b) => a.dateObj - b.dateObj);

  // find next
  let next = schedule.find(s => s.dateObj > now);
  let prev = null;

  if (next) {
    const idx = schedule.indexOf(next);
    prev = idx > 0 ? schedule[idx - 1] : null;
    const alertsEnabled = localStorage.getItem("alertsEnabled") === "true";

    if (alertsEnabled && prev) {
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const prayerMinutes =
        prev.dateObj.getHours() * 60 + prev.dateObj.getMinutes();

      // Notify exactly at prayer start (within 1 minute)
      if (
        nowMinutes === prayerMinutes &&
        lastNotified !== prev.name
      ) {
        triggerPrayerAlert(prev.name);
        localStorage.setItem("lastNotified", prev.name);
      }
    }

  } else {
    // after last time (likely after Isha): next is tomorrow's Fajr (if exists)
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const tRow = dataByKey.get(toSheetKey(tomorrow));
    if (tRow && tRow.Fajr) {
      next = { name: "Fajr", timeStr: tRow.Fajr, dateObj: timeToDate(tomorrow, tRow.Fajr) };
      // prev is last event today
      prev = schedule[schedule.length - 1] || null;
    }
  }

  if (!next) {
    els.nextPrayerName.textContent = "—";
    els.nextPrayerAt.textContent = "—";
    els.countdown.textContent = "—";
    return;
  }

  els.nextPrayerName.textContent =
    TRANSLATIONS[currentLang].prayers[next.name];
  els.nextPrayerAt.textContent = `At ${next.timeStr}`;

  // Countdown
  const diffMs = next.dateObj - now;
  els.countdown.textContent = msToHMS(diffMs);

  // Progress
  let start = prev?.dateObj;
  if (!start) {
    // if no prev (early day), start at midnight
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  }
  const total = next.dateObj - start;
  const passed = now - start;
  const pct = total > 0 ? Math.max(0, Math.min(1, passed / total)) : 0;

  els.progressBar.style.width = `${(pct * 100).toFixed(1)}%`;
  els.progressPct.textContent = `${(pct * 100).toFixed(0)}%`;

  els.prevPrayerLabel.textContent = prev ? `${prev.name} ${formatTime(prev.dateObj)}` : `00:00`;
  els.nextPrayerLabel.textContent = `${next.name} ${formatTime(next.dateObj)}`;
}

// -------- Helpers --------

function parseCSV(text) {
  // Minimal CSV parser (your sheet is simple: no quoted commas expected)
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(",").map(s => s.trim());
  const out = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const cols = lines[i].split(",").map(s => s.trim());
    const obj = {};
    headers.forEach((h, idx) => obj[h] = cols[idx] ?? "");
    out.push(obj);
  }
  return out;
}

function indexRows(rows) {
  const map = new Map();
  for (const r of rows) {
    const key = (r.Date || "").trim(); // like "1-Jan"
    if (!key) continue;
    map.set(key, r);
  }
  return map;
}

function toSheetKey(date) {
  const d = date.getDate();
  const m = MONTHS[date.getMonth()];
  return `${d}-${m}`;
}

function monthName(m) {
  if (currentLang === "ar") {
    return AR_MONTHS[m];
  }

  return [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ][m];
}

function sameDay(a,b){
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
}

function formatLongDate(date) {
  if (currentLang === "ar") {
    const dayName = AR_WEEKDAYS[date.getDay()];
    const monthName = AR_MONTHS[date.getMonth()];
    return `${dayName}، ${date.getDate()} ${monthName} ${date.getFullYear()}`;
  }

  return date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function timeToDate(baseDate, hhmm, prayerName){
  let [hh, mm] = hhmm.split(":").map(Number);

  // Only convert PM prayers
  if (["Asr","Maghrib","Isha"].includes(prayerName) && hh < 12) {
    hh += 12;
  }

  return new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate(),
    hh,
    mm,
    0,
    0
  );
}

function toMinutes(hhmm){
  if (!hhmm || !hhmm.includes(":")) return null;
  const [h,m] = hhmm.split(":").map(Number);
  return (h*60) + m;
}

function minsToHHMM(mins){
  if (mins === null || mins === undefined || Number.isNaN(mins)) return "—";
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
}

function formatTime(date){
  return date.toLocaleTimeString(undefined, { hour:"2-digit", minute:"2-digit" });
}

function msToHMS(ms){
  const s = Math.max(0, Math.floor(ms / 1000));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${String(hh).padStart(2,"0")}:${String(mm).padStart(2,"0")}:${String(ss).padStart(2,"0")}`;
}

function getMonthRows(year, month){
  const last = new Date(year, month+1, 0).getDate();
  const out = [];
  for (let d=1; d<=last; d++){
    const date = new Date(year, month, d);
    const key = toSheetKey(date);
    const row = dataByKey.get(key);
    if (row) out.push({ dayNum: d, row });
  }
  return out;
}

function prayerToMinutes(timeStr, prayerName) {
  if (!timeStr || !timeStr.includes(":")) return null;

  let [h, m] = timeStr.split(":").map(Number);

  // Convert PM prayers
  if (["Asr", "Maghrib", "Isha"].includes(prayerName) && h < 12) {
    h += 12;
  }

  return h * 60 + m;
}

function triggerPrayerAlert(prayerName) {
  const t = TRANSLATIONS[currentLang];

  // 🔔 Show notification
  if (Notification.permission === "granted") {
    new Notification("Prayer Time 🕌", {
      body: `${t.prayers[prayerName]} is now`,
      icon: "./icons/android/android-launchericon-192-192.png"
    });
  }

  // 🔊 Play sound (only works if app is open)
  const audio = new Audio("./sounds/adhan.mp3");
  audio.play().catch(() => {
    console.log("Sound blocked until user interaction.");
  });
}

// -------- Theme --------

function initTheme(){
  const saved = localStorage.getItem("theme");
  const theme = saved || "dark";
  document.documentElement.setAttribute("data-theme", theme);
  syncThemeUI(theme);
}

function toggleTheme(){
  const cur = document.documentElement.getAttribute("data-theme") || "dark";
  const next = cur === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
  syncThemeUI(next);

  // re-render chart so it picks up new CSS colors
  renderChart();
}

function syncThemeUI(theme){
  const isDark = theme === "dark";
  els.themeIcon.textContent = isDark ? "🌙" : "☀️";
  els.themeLabel.textContent = isDark ? "Dark" : "Light";
}

// -------- PWA Service Worker --------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")
      .then(() => console.log("Service Worker Registered ✅"))
      .catch((err) => console.log("Service Worker Error:", err));
  });
}

async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    alert("Notifications not supported in this browser.");
    return false;
  }

  if (Notification.permission === "granted") return true;

  const permission = await Notification.requestPermission();
  return permission === "granted";
}