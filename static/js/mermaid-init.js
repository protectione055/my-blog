const MERMAID_MODULE_URL = "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";

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

function getScale(wrapper) {
  const scale = Number.parseFloat(wrapper.dataset.mermaidScale || "1");
  return Number.isFinite(scale) ? scale : 1;
}

function setScale(wrapper, nextScale) {
  const clamped = Math.min(3, Math.max(0.75, nextScale));
  wrapper.dataset.mermaidScale = String(clamped);
  return clamped;
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

function updateZoomUI(wrapper) {
  const level = wrapper.querySelector("[data-mermaid-zoom-level]");
  if (level) {
    level.textContent = `${Math.round(getScale(wrapper) * 100)}%`;
  }
}

function applyZoom(wrapper) {
  const svg = wrapper.querySelector("svg");
  if (!svg) {
    return;
  }

  const baseWidth = Number.parseFloat(wrapper.dataset.mermaidBaseWidth || "0") || getBaseWidth(svg);
  wrapper.dataset.mermaidBaseWidth = String(baseWidth);
  svg.style.width = `${baseWidth * getScale(wrapper)}px`;
  svg.style.height = "auto";
  svg.style.maxWidth = "none";
  updateZoomUI(wrapper);
}

function bindZoomControls() {

  for (const wrapper of getWrapperNodes()) {
    const svg = wrapper.querySelector("svg");
    if (svg) {
      applyZoom(wrapper);
    }

    if (wrapper.dataset.mermaidZoomBound === "true") {
      continue;
    }

    wrapper.querySelector("[data-mermaid-zoom-in]")?.addEventListener("click", () => {
      setScale(wrapper, getScale(wrapper) + 0.25);
      applyZoom(wrapper);
    });

    wrapper.querySelector("[data-mermaid-zoom-out]")?.addEventListener("click", () => {
      setScale(wrapper, getScale(wrapper) - 0.25);
      applyZoom(wrapper);
    });

    wrapper.querySelector("[data-mermaid-zoom-reset]")?.addEventListener("click", () => {
      setScale(wrapper, 1);
      applyZoom(wrapper);
    });

    wrapper.addEventListener(
      "wheel",
      (event) => {
        if (!event.ctrlKey) {
          return;
        }

        event.preventDefault();
        const delta = event.deltaY < 0 ? 0.15 : -0.15;
        setScale(wrapper, getScale(wrapper) + delta);
        applyZoom(wrapper);
      },
      { passive: false },
    );

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
          bindZoomControls();
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
