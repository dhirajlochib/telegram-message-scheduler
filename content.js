chrome.storage.local.get(['message'], function (result) {
    const message = result.message;
    if (message) {

        const messageInput = document.querySelector('div[contenteditable="true"]');
        const sendButton = document.querySelector('button[aria-label="Send Message"]');

        if (messageInput) {
            messageInput.innerHTML = '';
            messageInput.innerHTML = message;
            const inputEvent = new Event('input', {
                bubbles: true,
                cancelable: true,
            });
            messageInput.dispatchEvent(inputEvent);
            if (sendButton) {
                sendButton.click();
                console.log('Message sent:', message);
            } else {
                console.error('Send button not found. Please check the selector.');
            }
        } else {
            console.error('Message input not found. Please check the selector.');
        }
    } else {
        console.error('No message found in storage.');
    }
});
