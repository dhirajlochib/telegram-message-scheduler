chrome.runtime.onMessage.addListener(async function(request, sender, sendResponse) {
    const { message, milliseconds } = request;

    if (milliseconds > 0) {
        const alarmName = `sendMessage_${Date.now()}`; // Unique alarm name for each message
        chrome.alarms.create(alarmName, { delayInMinutes: milliseconds / 60000 });
        
        // Store messages with alarm names for retrieval
        chrome.storage.local.get(['scheduledMessages'], function(result) {
            const scheduledMessages = result.scheduledMessages || [];
            scheduledMessages.push({ alarmName, message });
            chrome.storage.local.set({ scheduledMessages }, function() {
                console.log('Message saved: ', message);
            });
        });

        sendResponse({ status: 'success' });
    } else {
        sendResponse({ status: 'error', message: 'The specified milliseconds must be greater than 0.' });
    }
});

chrome.alarms.onAlarm.addListener(function(alarm) {
    chrome.storage.local.get(['scheduledMessages'], function(result) {
        const scheduledMessages = result.scheduledMessages || [];
        const messageToSend = scheduledMessages.find(msg => msg.alarmName === alarm.name);

        if (messageToSend) {
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                if (tabs.length > 0) {
                    const tabId = tabs[0].id;

                    chrome.scripting.executeScript({
                        target: { tabId: tabId },
                        func: sendMessageToTelegram, // Using a function reference
                        args: [messageToSend.message]
                    });

                    // Remove the sent message from the scheduled list
                    const updatedMessages = scheduledMessages.filter(msg => msg.alarmName !== alarm.name);
                    chrome.storage.local.set({ scheduledMessages: updatedMessages });
                }
            });
        }
    });
});

// Function to send message to Telegram
function sendMessageToTelegram(message) {
    const messageInput = document.querySelector('div[contenteditable="true"]');

    if (messageInput) {
        messageInput.innerHTML = ''; // Clear previous input
        messageInput.innerHTML = message; // Set the new message
        
        // Dispatch input event to notify the change
        const inputEvent = new Event('input', {
            bubbles: true,
            cancelable: true,
        });
        messageInput.dispatchEvent(inputEvent);
        
        // Create a KeyboardEvent for Enter key
        const enterKeyDownEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true,
        });
        
        const enterKeyUpEvent = new KeyboardEvent('keyup', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true,
        });

        // Dispatch the keydown and keyup events for the Enter key
        messageInput.dispatchEvent(enterKeyDownEvent);
        messageInput.dispatchEvent(enterKeyUpEvent);

        // Optionally, you may also simulate a focus on the input
        messageInput.focus();
    } else {
        console.error('Message input not found. Please check the selector.');
    }
}
