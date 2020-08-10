/* eslint-disable */
const fetchMock = require('jest-fetch-mock');
const VueTestUtils = require('@vue/test-utils');

fetchMock.enableMocks();
VueTestUtils.config.mocks['t'] = msg => msg;
VueTestUtils.config.stubs = { 'b-row': true };
