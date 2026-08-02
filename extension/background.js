const APP_URL = "https://scripgenerator.lovable.app";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "se-objection",
    title: "ScriptEngine: отработать как возражение",
    contexts: ["selection"],
  });
  chrome.contextMenus.create({
    id: "se-analyze",
    title: "ScriptEngine: скрипт под этот сайт",
    contexts: ["page"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const url = new URL(APP_URL);
  if (info.menuItemId === "se-objection" && info.selectionText) {
    url.searchParams.set("context", `Клиент сказал: «${info.selectionText.slice(0, 500)}». Отработай это возражение.`);
    url.searchParams.set("autostart", "1");
  } else if (info.menuItemId === "se-analyze" && tab?.url?.startsWith("http")) {
    url.searchParams.set("site", new URL(tab.url).origin);
  }
  chrome.tabs.create({ url: url.toString() });
});
