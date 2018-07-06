const axios = require("axios");
const MockAdapter = require("axios-mock-adapter");

class MockSingleton {
  static create() {
    if (!this.instance) {
      this.instance = new MockAdapter(axios);
    }

    return this.instance;
  }
}

module.exports = MockSingleton;
