browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "checkThreadPage") {
        const title = getTitle();
        const isThreadPage = !!title;
        sendResponse({
            isThreadPage: isThreadPage,
            threadTitle: title
        });
        return true;
    }

    if (request.action === "goToPage1") {
        sendResponse(goToPage1());
        return true;
    }

    if (request.action === "captureThread") {
        const result = capturePosts();
        sendResponse(result);
        return true;
    }

    if (request.action === "hasNextPage") {
        const result = hasNextPage();
        sendResponse(result);
        return true;
    }

    if (request.action === "clickNextPage") {
        clickNextPage();
        sendResponse({});
        return true;
    }

    if (request.action === "getTitle") {
        sendResponse(getTitle());
        return true;
    }
});

document.addEventListener("DOMContentLoaded", async function (event) {
    browser.runtime.sendMessage({ action: "pageLoadFinish" });
});

function goToPage1() {
    const isFirstPage = document.querySelector('div.pagination li.active').textContent.trim() === '1';

    if (!isFirstPage) {
        const firstPageLink = Array.from(document.querySelectorAll('div.pagination li > a'))
            .find(a => a.textContent.trim() === '1' && a.childElementCount === 0);
        if (firstPageLink) {
            firstPageLink.click();
            return { loading: true };
        }
        else {
            console.log("Failed to get link to page 1");
        }
    }

    return { loading: false };
}

function hasNextPage() {
    return !!document.querySelector('li.next > a:not(.disabled)');
}

function clickNextPage() {
    const nextButton = document.querySelector('li.next > a:not(.disabled)');
    nextButton.click();
}

function getTitle() {
    return document.querySelector('h2.topic-title a')?.textContent || null;
}

function parseForumDate(dateString) {
    const months = {
        Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
        Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
    };

    const cleaned = dateString.replace(/,/g, '').split(/\s+/);
    if (cleaned.length < 5) return null;

    const [dayStr, month, day, year, time] = cleaned;
    const [hours, minutes] = time.slice(0, -2).split(':').map(Number);
    const period = time.slice(-2).toLowerCase();

    let parsedHours = hours;
    if (period === 'pm' && hours < 12) parsedHours += 12;
    if (period === 'am' && hours === 12) parsedHours = 0;

    return new Date(Date.UTC(
        parseInt(year),
        months[month],
        parseInt(day),
        parsedHours,
        minutes
    )).toISOString();
}

function capturePosts() {
    let result = [];

    document.querySelectorAll(`
        div.inventea-wrapper.inventea-content[role="main"]
        div[id^="p"][class*="post"]
    `).forEach(postContainer => {
        const postId = postContainer.id.replace('p', '');
        const postContent = postContainer.querySelector(`div#post_content${postId}`);
        if (!postContent) return;

        const authorElement = postContainer.querySelector('p.author');
        let rawTimestamp = Array.from(authorElement.childNodes)
            .filter(n => n.nodeType === Node.TEXT_NODE)
            .map(n => n.textContent.trim())
            .join(' ')
            .replace(/\s+/g, ' ');

        const postData = {
            id: postId,
            author: postContainer.querySelector('.username')?.textContent || 'Unknown',
            timestamp: parseForumDate(rawTimestamp),
            content: postContent.querySelector('div.content')?.innerHTML,
        };

        result.push(postData);
    });

    return result;
}
