// Mock IndexedDB for tests
import { jest, expect } from '@jest/globals';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import * as jestExtended from 'jest-extended';

// Initialize TestBed
getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());

expect.extend(jestExtended);

// Provide a minimal Jasmine global shim for Jest environments that use Jasmine-style spies in existing specs.
const globalWithJasmine = globalThis as unknown as { jasmine?: unknown };
if (!globalWithJasmine.jasmine) {
  Object.defineProperty(globalThis, 'jasmine', {
    value: {
      createSpy: () => jest.fn(),
      createSpyObj: (baseName: string, methodNames: string[]) => {
        const obj: Record<string, jest.Mock> = {};
        methodNames.forEach((method) => {
          obj[method] = jest.fn();
        });
        return obj;
      },
      any: (expected: new (...args: unknown[]) => unknown) => expect.any(expected),
      objectContaining: (obj: Record<string, unknown>) => expect.objectContaining(obj),
      stringMatching: (pattern: string | RegExp) => expect.stringMatching(pattern),
      arrayContaining: (arr: unknown[]) => expect.arrayContaining(arr),
      anything: () => expect.anything(),
    },
    writable: false,
  });
}

// Mock IndexedDB for tests
const indexedDBMock = {
  open: jest.fn(() => ({
    result: {
      createObjectStore: jest.fn(),
      transaction: jest.fn(() => ({
        objectStore: jest.fn(() => ({
          add: jest.fn(),
          get: jest.fn(),
          getAll: jest.fn(),
          put: jest.fn(),
          delete: jest.fn(),
          clear: jest.fn(),
          index: jest.fn(() => ({
            openCursor: jest.fn(),
          })),
        })),
      })),
    },
  })),
};

Object.defineProperty(window, 'indexedDB', {
  value: indexedDBMock,
});

// Mock Notification API
Object.defineProperty(window, 'Notification', {
  value: jest.fn(() => ({
    close: jest.fn(),
  })),
  writable: true,
});

Object.defineProperty(Notification, 'requestPermission', {
  value: jest.fn(() => Promise.resolve('granted')),
  writable: true,
});

Object.defineProperty(Notification, 'permission', {
  value: 'granted',
  writable: true,
});
