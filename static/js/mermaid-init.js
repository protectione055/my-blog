const MERMAID_MODULE_URL = "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";

function getTheme() {
  const root = document.documentElement;
  const body = document.body;
  return root.classList.contains("dark") || body?.classList.contains("dark") ? "dark" : "default";
}

function getDiagramNodes() {
  return Array.from(document.querySelectorAll("pre.mermaid"));
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
