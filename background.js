let activeTab = null;
let currentPage = 0;
let capturedData = {
    title: undefined,
    posts: [],
};

browser.runtime.onMessage.addListener((message, _) => {
    if (message.action === "startCapture") {
        initializeCapture(message.tabId);
    }

    if (message.action === "pageLoadFinish") {
        onPageLoaded();
    }
});

async function initializeCapture(tabId) {
    const pageResult = await browser.tabs.sendMessage(tabId, {
        action: "goToPage1"
    });

    activeTab = tabId;
    currentPage = 1;

    if (!pageResult.loading) {
        await onPageLoaded();
    }
}

async function onPageLoaded() {
    if (activeTab !== null) {
        const captureReuslt = await browser.tabs.sendMessage(activeTab, {
            action: "captureThread"
        });

        capturedData.posts.push(captureReuslt);

        const hasNextPage = await browser.tabs.sendMessage(activeTab, {
            action: "hasNextPage"
        });

        if (hasNextPage) {
            currentPage += 1;
            let _ = await browser.tabs.sendMessage(activeTab, { action: "clickNextPage" });
        } else {
            let threadTitle = await browser.tabs.sendMessage(activeTab, { action: "getTitle" });
            capturedData.title = threadTitle;
            finish();
        }
    }
}

function finish() {
    activeTab = null;
    currentPage = 0;
    saveDataAsJson(capturedData);
}

function saveDataAsJson(data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const filename = `${data.title} - ${Date.now()}.json`;

    browser.downloads.download({
        url: url,
        filename: filename,
        saveAs: true
    }).then((downloadId) => {
        console.log("Download started with ID:", downloadId);
    }).catch((error) => {
        console.error("Failed to save file:", error);
    });
}
