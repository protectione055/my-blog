document.addEventListener("DOMContentLoaded", () => {
  const timestamp = new Date().toLocaleString("zh-CN", { hour12: false });
  console.debug(`[site] Hugo theme hydrated at ${timestamp}`);
});
