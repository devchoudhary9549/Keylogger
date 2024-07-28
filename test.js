const Keyboard = require('./index'); // Import the Keyboard class

const keyboard = new Keyboard('event0'); // Update 'event0' to the correct event device

// Listen for keypress events
keyboard.on('keypress', (event) => {
    console.log(`Key pressed: ${event.keyId}`);
});

// Listen for keyup events
keyboard.on('keyup', (event) => {
    console.log(`Key released: ${event.keyId}`);
});

// Listen for keydown events
keyboard.on('keydown', (event) => {
    console.log(`Key down: ${event.keyId}`);
});

// Listen for errors
keyboard.on('error', (err) => {
    console.error('Error:', err);
});

console.log('Listening for keyboard events...');
