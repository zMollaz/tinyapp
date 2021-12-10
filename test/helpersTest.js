const chai = require('chai');
const assert = chai.assert;

const { findUserByEmail } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('findUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = findUserByEmail("user@example.com", testUsers)
    const expectedUserID = "userRandomID";
    // Write your assert statement here
    assert.strictEqual(user, expectedUserID)
  });

  it('should return undefined for a no-existent email', function() {
    const user = findUserByEmail("user3@example.com", testUsers)
    const expectedUserID = undefined;
    // Write your assert statement here
    assert.strictEqual(user, expectedUserID)
  });
});