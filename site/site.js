document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    const code = document.getElementById(button.dataset.copy);
    const status = document.getElementById("copy-status");
    try {
      await navigator.clipboard.writeText(code.textContent);
      button.textContent = "Copied";
      status.textContent = "Commands copied to clipboard.";
      window.setTimeout(() => {
        button.textContent = "Copy";
      }, 2000);
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(code);
      selection.removeAllRanges();
      selection.addRange(range);
      status.textContent = "Select and copy the highlighted commands.";
      button.textContent = "Selected";
      window.setTimeout(() => {
        button.textContent = "Copy";
      }, 2000);
    }
  });
});

const exampleTabs = Array.from(
  document.querySelectorAll('.example-tabs [role="tab"]'),
);

function showExample(tab) {
  exampleTabs.forEach((candidate) => {
    const selected = candidate === tab;
    candidate.setAttribute("aria-selected", String(selected));
    candidate.tabIndex = selected ? 0 : -1;
    const panel = document.getElementById(
      candidate.getAttribute("aria-controls"),
    );
    panel.hidden = !selected;
    const frame = panel.querySelector("iframe");
    if (selected) {
      if (frame.dataset.src) {
        frame.src = frame.dataset.src;
        delete frame.dataset.src;
      }
    } else if (frame.hasAttribute("src")) {
      frame.dataset.src = frame.getAttribute("src");
      frame.removeAttribute("src");
    }
  });
}

exampleTabs.forEach((tab, index) => {
  tab.addEventListener("click", () => showExample(tab));
  tab.addEventListener("keydown", (event) => {
    let nextIndex;
    if (event.key === "ArrowRight")
      nextIndex = (index + 1) % exampleTabs.length;
    else if (event.key === "ArrowLeft")
      nextIndex = (index - 1 + exampleTabs.length) % exampleTabs.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = exampleTabs.length - 1;
    else return;
    event.preventDefault();
    exampleTabs[nextIndex].focus();
  });
});
