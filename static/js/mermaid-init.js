const MERMAID_MODULE_URL = "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";

function getMermaidConfig(theme) {
  const isDark = theme === "dark";

  return {
    startOnLoad: false,
    securityLevel: "loose",
    theme: "base",
    fontFamily: '"LXGW WenKai Screen", "Inter", sans-serif',
    themeVariables: isDark
      ? {
          darkMode: true,
          background: "#0f172a",
          primaryColor: "#1e293b",
          primaryBorderColor: "#38bdf8",
          primaryTextColor: "#f8fafc",
          secondaryColor: "#082f49",
          secondaryBorderColor: "#38bdf8",
          secondaryTextColor: "#e0f2fe",
          tertiaryColor: "#172554",
          tertiaryBorderColor: "#60a5fa",
          tertiaryTextColor: "#dbeafe",
          lineColor: "#94a3b8",
          textColor: "#e2e8f0",
          mainBkg: "#1e293b",
          secondBkg: "#082f49",
          tertiaryBkg: "#172554",
          clusterBkg: "rgba(30, 41, 59, 0.9)",
          clusterBorder: "#475569",
          edgeLabelBackground: "#0f172a",
          nodeBorder: "#38bdf8",
          actorBkg: "#1e293b",
          actorBorder: "#38bdf8",
          actorTextColor: "#f8fafc",
          actorLineColor: "#94a3b8",
          signalColor: "#cbd5e1",
          signalTextColor: "#e2e8f0",
          labelBoxBkgColor: "#0f172a",
          labelBoxBorderColor: "#475569",
          labelTextColor: "#e2e8f0",
          loopTextColor: "#f8fafc",
          noteBkgColor: "#10243b",
          noteBorderColor: "#7dd3fc",
          noteTextColor: "#e0f2fe",
          activationBkgColor: "#0f3a52",
          activationBorderColor: "#38bdf8",
          sequenceNumberColor: "#7dd3fc",
        }
      : {
          darkMode: false,
          background: "#f8fafc",
          primaryColor: "#f8fbff",
          primaryBorderColor: "#7dd3fc",
          primaryTextColor: "#0f172a",
          secondaryColor: "#eff6ff",
          secondaryBorderColor: "#0ea5e9",
          secondaryTextColor: "#0f172a",
          tertiaryColor: "#f8fafc",
          tertiaryBorderColor: "#94a3b8",
          tertiaryTextColor: "#1e293b",
          lineColor: "#64748b",
          textColor: "#0f172a",
          mainBkg: "#ffffff",
          secondBkg: "#eff6ff",
          tertiaryBkg: "#f8fbff",
          clusterBkg: "rgba(255, 255, 255, 0.88)",
          clusterBorder: "#cbd5e1",
          edgeLabelBackground: "#ffffff",
          nodeBorder: "#7dd3fc",
          actorBkg: "#ffffff",
          actorBorder: "#7dd3fc",
          actorTextColor: "#0f172a",
          actorLineColor: "#64748b",
          signalColor: "#334155",
          signalTextColor: "#0f172a",
          labelBoxBkgColor: "#ffffff",
          labelBoxBorderColor: "#cbd5e1",
          labelTextColor: "#0f172a",
          loopTextColor: "#0f172a",
          noteBkgColor: "#eff6ff",
          noteBorderColor: "#7dd3fc",
          noteTextColor: "#0f172a",
          activationBkgColor: "#e0f2fe",
          activationBorderColor: "#38bdf8",
          sequenceNumberColor: "#0284c7",
        },
  };
}

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
  const clamped = Math.min(3, Math.max(0.7, nextScale));
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

function clearActiveWrappers() {
  for (const item of getWrapperNodes()) {
    item.classList.remove("is-active", "is-dragging");
  }
}

function activateWrapper(wrapper) {
  clearActiveWrappers();
  wrapper.classList.add("is-active");
  wrapper.focus({ preventScroll: true });
}

function applyZoom(wrapper) {
  const svg = wrapper.querySelector("svg");
  const canvas = wrapper.querySelector("[data-mermaid-canvas]");

  if (!svg || !canvas) {
    return;
  }

  const baseWidth = Number.parseFloat(wrapper.dataset.mermaidBaseWidth || "0") || getBaseWidth(svg);
  const scaledWidth = baseWidth * getScale(wrapper);

  wrapper.dataset.mermaidBaseWidth = String(baseWidth);
  svg.style.width = `${scaledWidth}px`;
  svg.style.height = "auto";
  svg.style.maxWidth = "none";
  canvas.style.minWidth = `${scaledWidth}px`;

  updateZoomUI(wrapper);
}

function bindZoomControls() {
  for (const wrapper of getWrapperNodes()) {
    const svg = wrapper.querySelector("svg");
    const canvas = wrapper.querySelector("[data-mermaid-canvas]");

    if (svg) {
      applyZoom(wrapper);
    }

    if (wrapper.dataset.mermaidZoomBound === "true") {
      continue;
    }

    wrapper.querySelector("[data-mermaid-zoom-in]")?.addEventListener("click", () => {
      activateWrapper(wrapper);
      setScale(wrapper, getScale(wrapper) + 0.25);
      applyZoom(wrapper);
    });

    wrapper.querySelector("[data-mermaid-zoom-out]")?.addEventListener("click", () => {
      activateWrapper(wrapper);
      setScale(wrapper, getScale(wrapper) - 0.25);
      applyZoom(wrapper);
    });

    wrapper.querySelector("[data-mermaid-zoom-reset]")?.addEventListener("click", () => {
      activateWrapper(wrapper);
      setScale(wrapper, 1);
      applyZoom(wrapper);
    });

    canvas?.addEventListener("click", () => {
      activateWrapper(wrapper);
    });

    wrapper.addEventListener("keydown", (event) => {
      if (!wrapper.classList.contains("is-active")) {
        return;
      }

      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        setScale(wrapper, getScale(wrapper) + 0.12);
        applyZoom(wrapper);
      }

      if (event.key === "-" || event.key === "_") {
        event.preventDefault();
        setScale(wrapper, getScale(wrapper) - 0.12);
        applyZoom(wrapper);
      }

      if (event.key === "0") {
        event.preventDefault();
        setScale(wrapper, 1);
        applyZoom(wrapper);
      }

      if (event.key === "Escape") {
        event.preventDefault();
        wrapper.classList.remove("is-active", "is-dragging");
      }
    });

    wrapper.addEventListener(
      "wheel",
      (event) => {
        if (!wrapper.classList.contains("is-active") || !canvas?.contains(event.target)) {
          return;
        }

        event.preventDefault();
        const delta = event.deltaY < 0 ? 0.1 : -0.1;
        setScale(wrapper, getScale(wrapper) + delta);
        applyZoom(wrapper);
      },
      { passive: false },
    );

    let dragState = null;

    const stopDrag = (pointerId) => {
      if (!dragState) {
        return;
      }

      if (typeof pointerId === "number" && dragState.pointerId !== pointerId) {
        return;
      }

      dragState = null;
      wrapper.classList.remove("is-dragging");
    };

    canvas?.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) {
        return;
      }

      activateWrapper(wrapper);
      dragState = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        scrollLeft: wrapper.scrollLeft,
        scrollTop: wrapper.scrollTop,
      };

      wrapper.classList.add("is-dragging");
      canvas.setPointerCapture(event.pointerId);
      event.preventDefault();
    });

    canvas?.addEventListener("pointermove", (event) => {
      if (!dragState || dragState.pointerId !== event.pointerId) {
        return;
      }

      wrapper.scrollLeft = dragState.scrollLeft - (event.clientX - dragState.startX);
      wrapper.scrollTop = dragState.scrollTop - (event.clientY - dragState.startY);
    });

    canvas?.addEventListener("pointerup", (event) => {
      stopDrag(event.pointerId);
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
    });

    canvas?.addEventListener("pointercancel", (event) => {
      stopDrag(event.pointerId);
    });

    canvas?.addEventListener("lostpointercapture", () => {
      stopDrag();
    });

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

  if (!root.__mermaidDocumentBindings) {
    document.addEventListener("pointerdown", (event) => {
      if (!(event.target instanceof Element) || !event.target.closest("[data-mermaid-wrapper]")) {
        clearActiveWrappers();
      }
    });

    root.__mermaidDocumentBindings = true;
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
          mermaid.initialize(getMermaidConfig(getTheme()));

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
