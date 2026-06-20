const fs = require('fs');
const path = require('path');

// Simple mock of localStorage
const mockStorage = {};
global.window = {};
global.localStorage = {
  getItem: (key) => mockStorage[key] || null,
  setItem: (key, value) => { mockStorage[key] = String(value); },
  removeItem: (key) => { delete mockStorage[key]; }
};

const { getMockUser, setMockUser, clearMockUser } = require('./mockAuth');

console.log("Running mockAuth tests...");

// Test 1: Initial user should be null
if (getMockUser() !== null) {
  console.error("Test 1 failed: initial user should be null");
  process.exit(1);
}

// Test 2: Setting user
const user = { username: "Sam Lee", department: "Sastra Indonesia" };
setMockUser(user);
const saved = getMockUser();
if (!saved || saved.username !== "Sam Lee" || saved.department !== "Sastra Indonesia") {
  console.error("Test 2 failed: user not saved correctly", saved);
  process.exit(1);
}

// Test 3: Clearing user
clearMockUser();
if (getMockUser() !== null) {
  console.error("Test 3 failed: user not cleared correctly");
  process.exit(1);
}

console.log("All mockAuth tests passed successfully!");
