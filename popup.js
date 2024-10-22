document.addEventListener('DOMContentLoaded', function() {
    var d = new Date();
    document.getElementById("hours").value = d.getHours();
    document.getElementById("minutes").value = d.getMinutes();
    document.getElementById("seconds").value = d.getSeconds();
    document.getElementById("milliseconds").value = d.getMilliseconds();

    // Load any scheduled messages on startup
    loadScheduledMessages();
});

// Function to load scheduled messages from storage
function loadScheduledMessages() {
    chrome.storage.local.get(['scheduledMessages'], function (result) {
        const messages = result.scheduledMessages || [];
        const messageContainer = document.getElementById('scheduled-messages');
        messageContainer.innerHTML = ''; // Clear previous entries
        messages.forEach((msg, index) => {
            const msgDiv = document.createElement('div');
            msgDiv.className = 'scheduled-message';

            const messageText = document.createElement('span');
            messageText.className = 'message-text';
            messageText.textContent = `${msg.message} → ${new Date(Date.now() + msg.milliseconds).toLocaleString()}`;

            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-button';
            deleteButton.innerHTML = '&times;'; // Cross symbol
            deleteButton.addEventListener('click', function() {
                deleteScheduledMessage(index); // Delete message on click
            });

            msgDiv.appendChild(messageText);
            msgDiv.appendChild(deleteButton);
            messageContainer.appendChild(msgDiv);
        });
    });
}

// Function to delete a scheduled message
function deleteScheduledMessage(index) {
    chrome.storage.local.get(['scheduledMessages'], function(result) {
        const scheduledMessages = result.scheduledMessages || [];
        scheduledMessages.splice(index, 1); // Remove the message at the specified index
        chrome.storage.local.set({ scheduledMessages }, function() {
            console.log('Scheduled message deleted.');
            loadScheduledMessages(); // Refresh the displayed messages
        });
    });
}

document.getElementById('schedule-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const message = document.getElementById('message').value;
    const hours = parseInt(document.getElementById('hours').value) || 0;
    const minutes = parseInt(document.getElementById('minutes').value) || 0;
    const seconds = parseInt(document.getElementById('seconds').value) || 0;
    const milliseconds = parseInt(document.getElementById('milliseconds').value) || 0;

    if (!message) {
        document.getElementById('status').textContent = 'Please enter a message.';
        return;
    }

    // Get current time
    const now = new Date();

    // Set the target time using the current date
    const targetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, seconds);

    // Calculate the difference in milliseconds
    const totalMilliseconds = targetTime - now;

    console.log('Total milliseconds:', totalMilliseconds);

    if (totalMilliseconds <= 0) {
        document.getElementById('status').textContent = 'Please enter a valid time.';
        return;
    }

    // Send the message and time in milliseconds to the background script
    console.log('Message:', message);
    console.log('Milliseconds:', totalMilliseconds);

    // Store messages in an array
    chrome.storage.local.get(['scheduledMessages'], function(result) {
        const scheduledMessages = result.scheduledMessages || [];
        scheduledMessages.push({ message, milliseconds: totalMilliseconds });
        
        // Save updated messages array
        chrome.storage.local.set({ scheduledMessages }, function() {
            console.log('Scheduled messages updated.');
            loadScheduledMessages(); // Reload displayed messages
        });
    });

    // Schedule the message in background
    chrome.runtime.sendMessage({ message, milliseconds: totalMilliseconds }, function(response) {
        if (response.status === 'success') {
            document.getElementById('status').textContent = 'Message scheduled successfully!';
            // clear the form
            document.getElementById('message').value = ''; // Reset the message input
        } else {
            document.getElementById('status').textContent = 'Failed to schedule the message.';
        }
    });
});
