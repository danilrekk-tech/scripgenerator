const APP_URL = "https://scripgenerator.lovable.app";

const SERVICES = [
  "SEO-продвижение",
  "AI-оптимизация (LLM/Answer Engines)",
  "Голосовой поиск",
  "Наполнение контентом",
  "Техническая оптимизация",
  "Комплексное продвижение",
  "SEO-оптимизация (разовая)",
  "Оптимизация под Нейропоиск",
  "Юридические правки (ФЗ-152/ФЗ-168)",
];

const SITUATIONS = ["Холодный звонок", "Входящий запрос", "Дожим", "Повторный контакт", "Допродажа"];
const TONES = ["Экспертный", "Дружелюбный", "Напористый", "Мягкий", "Без продаж"];

const OBJECTIONS = [
  { label: "Дорого", principles: "Не оправдываться. Вернуть к ценности, разложить цену на месяц, спросить «дорого относительно чего?»" },
  { label: "Нет бюджета", principles: "Уточнить: нет вообще или не заложен. Предложить поэтапный старт и показать окупаемость." },
  { label: "Подумаю", principles: "Не отпускать. Спросить, что именно смущает. Дать выбор без выбора и назначить дату." },
  { label: "Нет времени", principles: "Не давить. Договориться на 5 минут. Показать цену бездействия." },
  { label: "Уже есть подрядчик", principles: "Не критиковать конкурента. Предложить бесплатный аудит и второе мнение." },
  { label: "Делаем сами", principles: "Признать усилия, уточнить результаты, показать слепые зоны и упущенную выгоду." },
  { label: "Не верю в SEO", principles: "Согласиться с прошлым опытом, показать кейс из ниши, предложить малый пилот." },
  { label: "Не было результатов", principles: "Разобрать причины прошлого провала, показать методику, зафиксировать KPI." },
  { label: "Пришлите на почту", principles: "Согласиться, но уточнить 2 вопроса, чтобы письмо было полезным, и назначить созвон." },
  { label: "Дайте скидку", principles: "Не давать скидку просто так. Обменять на объём, срок или предоплату." },
];

const state = { service: SERVICES[0], situation: SITUATIONS[0], tone: TONES[0] };

function toast(msg) {
  let el = document.querySelector(".toast");
  if (!el) { el = document.createElement("div"); el.className = "toast"; document.body.appendChild(el); }
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 1400);
}

function renderChips(containerId, values, key) {
  const box = document.getElementById(containerId);
  box.innerHTML = "";
  values.forEach((v) => {
    const b = document.createElement("button");
    b.className = "chip" + (state[key] === v ? " sel" : "");
    b.textContent = v;
    b.addEventListener("click", () => { state[key] = v; renderChips(containerId, values, key); save(); });
    box.appendChild(b);
  });
}

function renderObjections(filter = "") {
  const list = document.getElementById("obj-list");
  const q = filter.trim().toLowerCase();
  list.innerHTML = "";
  OBJECTIONS.filter((o) => !q || o.label.toLowerCase().includes(q) || o.principles.toLowerCase().includes(q))
    .forEach((o) => {
      const card = document.createElement("div");
      card.className = "card";
      const b = document.createElement("b"); b.textContent = o.label;
      const s = document.createElement("span"); s.textContent = o.principles;
      card.append(b, s);
      card.addEventListener("click", () => {
        navigator.clipboard.writeText(`${o.label}: ${o.principles}`).then(() => toast("Скопировано"));
      });
      list.appendChild(card);
    });
}

function save() {
  chrome.storage.local.set({
    seState: state,
    seSite: document.getElementById("site").value,
    seContext: document.getElementById("context").value,
    seNotes: document.getElementById("notes").value,
  });
}

function openApp(withParams) {
  const url = new URL(APP_URL);
  if (withParams) {
    url.searchParams.set("service", state.service);
    url.searchParams.set("situation", state.situation);
    url.searchParams.set("tone", state.tone);
    const site = document.getElementById("site").value.trim();
    const ctx = document.getElementById("context").value.trim();
    if (site) url.searchParams.set("site", site);
    if (ctx) url.searchParams.set("context", ctx);
    url.searchParams.set("autostart", "1");
  }
  chrome.tabs.create({ url: url.toString() });
}

document.addEventListener("DOMContentLoaded", async () => {
  const sel = document.getElementById("service");
  SERVICES.forEach((s) => {
    const o = document.createElement("option");
    o.value = s; o.textContent = s;
    sel.appendChild(o);
  });

  const stored = await chrome.storage.local.get(["seState", "seSite", "seContext", "seNotes"]);
  if (stored.seState) Object.assign(state, stored.seState);
  sel.value = state.service;
  document.getElementById("site").value = stored.seSite || "";
  document.getElementById("context").value = stored.seContext || "";
  document.getElementById("notes").value = stored.seNotes || "";

  // Подставляем текущую вкладку как сайт клиента, если поле пустое
  if (!document.getElementById("site").value) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url?.startsWith("http")) {
      const u = new URL(tab.url);
      document.getElementById("site").value = u.origin;
      document.getElementById("site-line").textContent = u.hostname;
    }
  }

  renderChips("situations", SITUATIONS, "situation");
  renderChips("tones", TONES, "tone");
  renderObjections();

  sel.addEventListener("change", (e) => { state.service = e.target.value; save(); });
  ["site", "context", "notes"].forEach((id) => document.getElementById(id).addEventListener("input", save));
  document.getElementById("obj-search").addEventListener("input", (e) => renderObjections(e.target.value));

  document.querySelectorAll(".tab").forEach((t) => {
    t.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((x) => x.classList.remove("active"));
      document.querySelectorAll(".pane").forEach((p) => p.classList.remove("active"));
      t.classList.add("active");
      document.getElementById("tab-" + t.dataset.tab).classList.add("active");
    });
  });

  document.getElementById("generate").addEventListener("click", () => openApp(true));
  document.getElementById("open-app").addEventListener("click", (e) => { e.preventDefault(); openApp(false); });
  document.getElementById("copy-notes").addEventListener("click", () => {
    navigator.clipboard.writeText(document.getElementById("notes").value).then(() => toast("Заметки скопированы"));
  });
  document.getElementById("clear-notes").addEventListener("click", () => {
    document.getElementById("notes").value = ""; save(); toast("Очищено");
  });
});
