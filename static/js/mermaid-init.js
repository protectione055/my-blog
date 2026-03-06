const MERMAID_MODULE_URL = "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
const MERMAID_DIALOG_ID = "mermaid-zoom-dialog";

function getWrapperNodes() {
  return Array.from(document.querySelectorAll("[data-mermaid-wrapper]"));
}

function getTheme() {
  const root = document.documentElement;
  const body = document.body;
  return root.classList.contains("dark") || body?.classList.contains("dark") ? "dark" : "default";
}

function getDiagramNodes() {
  return Array.from(document.querySelectorAll("pre.mermaid"));
}

function getBaseWidth(svg) {
  const viewBoxWidth = svg.viewBox?.baseVal?.width;
  if (viewBoxWidth) {
    return viewBoxWidth;
  }

  const widthAttr = Number.parseFloat(svg.getAttribute("width") || "");
  if (Number.isFinite(widthAttr) && widthAttr > 0) {
    return widthAttr;
  }

  const rectWidth = svg.getBoundingClientRect().width;
  return rectWidth > 0 ? rectWidth : 800;
}

function ensureZoomDialog() {
  let dialog = document.getElementById(MERMAID_DIALOG_ID);

  if (dialog) {
    return dialog;
  }

  dialog = document.createElement("dialog");
  dialog.id = MERMAID_DIALOG_ID;
  dialog.className = "mermaid-zoom-dialog";
  dialog.innerHTML = `
    <div class="mermaid-zoom-shell">
      <div class="mermaid-zoom-toolbar">
        <div class="mermaid-zoom-actions">
          <button type="button" data-mermaid-zoom-out>－</button>
          <span data-mermaid-zoom-level>100%</span>
          <button type="button" data-mermaid-zoom-in>＋</button>
          <button type="button" data-mermaid-zoom-reset>重置</button>
        </div>
        <button type="button" class="mermaid-zoom-close" data-mermaid-zoom-close>关闭</button>
      </div>
      <div class="mermaid-zoom-viewport" data-mermaid-zoom-viewport>
        <div class="mermaid-zoom-stage" data-mermaid-zoom-stage></div>
      </div>
    </div>
  `;

  document.body.appendChild(dialog);

  const viewport = dialog.querySelector("[data-mermaid-zoom-viewport]");
  const stage = dialog.querySelector("[data-mermaid-zoom-stage]");
  const zoomLevel = dialog.querySelector("[data-mermaid-zoom-level]");
  const zoomState = { scale: 1, baseWidth: 0 };

  const applyZoom = () => {
    const svg = stage.querySelector("svg");
    if (!svg || !zoomState.baseWidth) {
      return;
    }

    svg.style.width = `${zoomState.baseWidth * zoomState.scale}px`;
    svg.style.height = "auto";
    zoomLevel.textContent = `${Math.round(zoomState.scale * 100)}%`;
  };

  const setScale = (nextScale) => {
    zoomState.scale = Math.min(4, Math.max(0.5, nextScale));
    applyZoom();
  };

  dialog.querySelector("[data-mermaid-zoom-in]").addEventListener("click", () => setScale(zoomState.scale + 0.25));
  dialog.querySelector("[data-mermaid-zoom-out]").addEventListener("click", () => setScale(zoomState.scale - 0.25));
  dialog.querySelector("[data-mermaid-zoom-reset]").addEventListener("click", () => setScale(1));
  dialog.querySelector("[data-mermaid-zoom-close]").addEventListener("click", () => dialog.close());

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });

  viewport.addEventListener(
    "wheel",
    (event) => {
      if (!event.ctrlKey) {
        return;
      }

      event.preventDefault();
      const delta = event.deltaY < 0 ? 0.2 : -0.2;
      setScale(zoomState.scale + delta);
    },
    { passive: false },
  );

  dialog.openWithDiagram = (svgMarkup, baseWidth) => {
    stage.innerHTML = "";
    const clone = svgMarkup.cloneNode(true);
    clone.removeAttribute("style");
    clone.style.maxWidth = "none";
    stage.appendChild(clone);
    zoomState.baseWidth = baseWidth;
    setScale(1);
    dialog.showModal();
  };

  return dialog;
}

function bindZoomTriggers() {
  const dialog = ensureZoomDialog();

  for (const wrapper of getWrapperNodes()) {
    if (wrapper.dataset.mermaidZoomBound === "true") {
      continue;
    }

    const trigger = wrapper.querySelector("[data-mermaid-zoom-trigger]");
    const openZoom = () => {
      const svg = wrapper.querySelector("svg");
      if (!svg) {
        return;
      }

      dialog.openWithDiagram(svg, getBaseWidth(svg));
    };

    trigger?.addEventListener("click", openZoom);
    wrapper.addEventListener("dblclick", openZoom);
    wrapper.dataset.mermaidZoomBound = "true";
  }
}

function resetDiagramSources(nodes) {
  for (const node of nodes) {
    if (!node.dataset.mermaidSource) {
      node.dataset.mermaidSource = node.textContent.trim();
    }

    node.textContent = node.dataset.mermaidSource;
    node.removeAttribute("data-processed");
  }
}

export default function initMermaid() {
  const root = globalThis;

  if (!getDiagramNodes().length) {
    return;
  }

  if (!root.__mermaidBootstrapPromise) {
    root.__mermaidBootstrapPromise = import(MERMAID_MODULE_URL)
      .then(async ({ default: mermaid }) => {
        const renderMermaid = async () => {
          const nodes = getDiagramNodes();

          if (!nodes.length) {
            return;
          }

          resetDiagramSources(nodes);

          mermaid.initialize({
            startOnLoad: false,
            securityLevel: "loose",
            theme: getTheme(),
          });

          await mermaid.run({ nodes });
          bindZoomTriggers();
        };

        root.__renderMermaidCharts = renderMermaid;

        if (!root.__mermaidThemeObserver) {
          let activeTheme = getTheme();
          const observer = new MutationObserver(() => {
            const nextTheme = getTheme();
            if (nextTheme !== activeTheme) {
              activeTheme = nextTheme;
              root.__renderMermaidCharts?.().catch((error) => {
                console.error("[mermaid] Re-render failed", error);
              });
            }
          });

          observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
          });

          if (document.body) {
            observer.observe(document.body, {
              attributes: true,
              attributeFilter: ["class"],
            });
          }

          root.__mermaidThemeObserver = observer;
        }

        await renderMermaid();
      })
      .catch((error) => {
        console.error("[mermaid] Failed to load Mermaid", error);
      });
  } else {
    root.__mermaidBootstrapPromise = root.__mermaidBootstrapPromise.then(async () => {
      await root.__renderMermaidCharts?.();
    });
  }
}
