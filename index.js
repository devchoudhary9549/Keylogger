'use strict';
const fs = require('fs');
const EventEmitter = require('events').EventEmitter;
const toKey = require('./keycodes');
const os = require('os');

const EVENT_TYPES = ['keyup', 'keypress', 'keydown'];
const EV_KEY = 1;

function Keyboard(dev) {
  this.dev = dev || 'event0';
  this.bufferSize = 24;
  this.buffer = Buffer.alloc(this.bufferSize);  // Updated to use Buffer.alloc
  
  if (os.platform() === 'win32') {
    this.data = new EventEmitter();
    this.mockRead();
  } else {
    this.data = fs.createReadStream(`/dev/input/${this.dev}`);
    this.onRead();
  }
}

Keyboard.prototype = Object.create(EventEmitter.prototype, {
  constructor: { value: Keyboard }
});

Keyboard.prototype.onRead = function onRead() {
  const self = this;

  this.data.on('data', data => {
    this.buffer = data.slice(24);
    let event = parse(this, this.buffer);
    if (event) {
      event.dev = self.dev;
      self.emit(event.type, event);
    }
  });

  this.data.on('error', err => {
    self.emit('error', err);
    throw new Error(err);
  });
}

Keyboard.prototype.mockRead = function mockRead() {
  const self = this;
  let eventCount = 0;
  const maxEvents = 10; // Stop after 10 events

  const generateMockEvent = (keyCode, eventType) => {
    let buffer = Buffer.alloc(self.bufferSize);
    buffer.writeUInt16LE(0, 0);  // timeS
    buffer.writeUInt16LE(0, 8);  // timeMS
    buffer.writeUInt16LE(EV_KEY, 16);  // type
    buffer.writeUInt16LE(keyCode, 18);  // keyCode
    buffer.writeUInt32LE(eventType, 20);  // event type
    return buffer;
  };

  const eventTypes = [1, 2, 0]; // keypress, keydown, keyup
  const keyCodes = [30, 31, 32]; // 'A', 'B', 'C'

  const simulateEvents = setInterval(() => {
    if (eventCount >= maxEvents) {
      clearInterval(simulateEvents);
      console.log('Stopped simulating events.');
      return;
    }

    const keyCode = keyCodes[eventCount % keyCodes.length];
    const eventType = eventTypes[eventCount % eventTypes.length];
    self.buffer = generateMockEvent(keyCode, eventType);

    let event = parse(this, self.buffer);
    if (event) {
      event.dev = self.dev;
      self.emit(event.type, event);
    }

    eventCount++;
  }, 1000);
}

function parse(input, buffer) {
  let event;
  if (buffer.readUInt16LE(16) === EV_KEY) {
    event = {
      timeS: buffer.readUInt16LE(0),
      timeMS: buffer.readUInt16LE(8),
      keyCode: buffer.readUInt16LE(18),
    };
    event.keyId = toKey[event.keyCode];
    event.type = EVENT_TYPES[buffer.readUInt32LE(20)];
  }
  return event;
}

Keyboard.Keys = toKey;

module.exports = Keyboard;
