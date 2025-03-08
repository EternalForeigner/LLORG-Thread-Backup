browser.tabs.query({ active: true, currentWindow: true }, tabs => {
    browser.tabs.sendMessage(tabs[0].id, { action: "checkThreadPage" }, response => {
        if (response && response.isThreadPage) {
            document.getElementById('captureBtn').classList.remove('hidden');
            document.getElementById('threadTitle').textContent = response.threadTitle;
        } else {
            document.getElementById('threadTitle').textContent = "No thread found on this page.";
        }
    });
});

document.getElementById('captureBtn').addEventListener('click', async () => {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    browser.runtime.sendMessage({action:"startCapture", tabId: tab.id});
});
