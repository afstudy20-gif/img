const modePills = document.querySelectorAll(".mode-pill");
const workspace = document.getElementById("workspace");
const railItems = document.querySelectorAll(".rail-item[data-flow]");
const canvasLabel = document.getElementById("canvas-label");
const canvasTitle = document.getElementById("canvas-title");
const inspectorTitle = document.getElementById("inspector-title");
const inspectorCopy = document.getElementById("inspector-copy");
const tokenList = document.getElementById("token-list");
const screenTabs = document.querySelectorAll(".screen-tab");
const screens = document.querySelectorAll(".screen");

const modeContent = {
  quick: {
    label: "Quick Workflow",
    title: "Capture, explain, and send in one pass",
    inspector: "Quick markup and guided communication",
    copy: "Keep the UI light, keep the canvas central, and keep the share action always visible.",
    tokens: ["Step Capture", "OCR Text Regions", "Brand Theme", "Review Link"],
  },
  studio: {
    label: "Studio Workflow",
    title: "Deep edits, variants, and background processing",
    inspector: "Layer-safe editing with asset intelligence",
    copy: "Progressively reveal richer tools like masks, relighting, presets, and batch exports without crowding the first-use experience.",
    tokens: ["Background Removal", "Mask Stack", "Variants", "Batch Queue"],
  },
  review: {
    label: "Review Workflow",
    title: "Comment directly on the asset, not around it",
    inspector: "Shared context for approvals and revisions",
    copy: "The browser should make review links feel native: comments, pinned notes, compare states, and export decisions in one place.",
    tokens: ["Pinned Comments", "Version Compare", "Approval State", "Share Preset"],
  },
};

const flowContent = {
  capture: "quick",
  product: "studio",
  review: "review",
};

function renderMode(mode) {
  const data = modeContent[mode];
  workspace.dataset.mode = mode;
  canvasLabel.textContent = data.label;
  canvasTitle.textContent = data.title;
  inspectorTitle.textContent = data.inspector;
  inspectorCopy.textContent = data.copy;
  tokenList.innerHTML = data.tokens.map((item) => `<li>${item}</li>`).join("");

  modePills.forEach((pill) => {
    pill.classList.toggle("active", pill.dataset.mode === mode);
  });
}

function renderScreen(screenName) {
  screens.forEach((screen) => {
    screen.classList.toggle("active", screen.dataset.screen === screenName);
  });

  screenTabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.screen === screenName);
  });
}

modePills.forEach((pill) => {
  pill.addEventListener("click", () => {
    renderMode(pill.dataset.mode);
    renderScreen("editor");
  });
});

railItems.forEach((item) => {
  item.addEventListener("click", () => {
    railItems.forEach((rail) => rail.classList.remove("active"));
    item.classList.add("active");
    renderMode(flowContent[item.dataset.flow]);
    renderScreen("editor");
  });
});

screenTabs.forEach((tab) => {
  tab.addEventListener("click", () => renderScreen(tab.dataset.screen));
});

renderMode("quick");
renderScreen("editor");
