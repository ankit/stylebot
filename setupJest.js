const { webcrypto } = require('node:crypto');
const fetchMock = require('jest-fetch-mock');
const VueTestUtils = require('@vue/test-utils');

// jsdom's crypto stops short of randomUUID, which the extension gets from the
// browser; node's own implementation stands in for it.
if (!globalThis.crypto?.randomUUID) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    configurable: true,
    writable: true,
  });
}

fetchMock.enableMocks();
VueTestUtils.config.mocks['t'] = msg => msg;
VueTestUtils.config.stubs = { 'b-row': true };
