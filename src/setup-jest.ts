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

type JasmineSpy = jest.Mock & {
  and: {
    returnValue: (value: unknown) => JasmineSpy;
    returnValues: (...values: unknown[]) => JasmineSpy;
    callFake: (implementation: (...args: unknown[]) => unknown) => JasmineSpy;
    callThrough: () => JasmineSpy;
  };
  calls: {
    allArgs: () => unknown[][];
    argsFor: (index: number) => unknown[];
    count: () => number;
    reset: () => void;
  };
};

function attachJasmineApi(spy: jest.Mock): JasmineSpy {
  const jasmineSpy = spy as JasmineSpy;

  jasmineSpy.and = {
    returnValue: (value: unknown) => {
      spy.mockReturnValue(value);
      return jasmineSpy;
    },
    returnValues: (...values: unknown[]) => {
      values.forEach((value) => spy.mockReturnValueOnce(value));
      return jasmineSpy;
    },
    callFake: (implementation: (...args: unknown[]) => unknown) => {
      spy.mockImplementation(implementation);
      return jasmineSpy;
    },
    callThrough: () => {
      spy.mockRestore();
      return jasmineSpy;
    },
  };

  jasmineSpy.calls = {
    allArgs: () => spy.mock.calls,
    argsFor: (index: number) => spy.mock.calls[index] ?? [],
    count: () => spy.mock.calls.length,
    reset: () => {
      spy.mockClear();
    },
  };

  return jasmineSpy;
}

function createJasmineSpy(): JasmineSpy {
  return attachJasmineApi(jest.fn());
}

const globalScope = globalThis as typeof globalThis & {
  jasmine?: unknown;
  spyOn?: (...args: unknown[]) => JasmineSpy;
};

globalScope.spyOn = ((object: object, method: string | symbol) =>
  attachJasmineApi(jest.spyOn(object as never, method as never) as jest.Mock)) as typeof globalScope.spyOn;

if (!globalScope.jasmine) {
  Object.defineProperty(globalThis, 'jasmine', {
    value: {
      createSpy: createJasmineSpy,
      createSpyObj: (_baseName: string, methodNames: string[]) => {
        const obj: Record<string, JasmineSpy> = {};
        methodNames.forEach((method) => {
          obj[method] = createJasmineSpy();
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

if (typeof globalThis.performance?.now !== 'function') {
  const now = jest.fn(() => Date.now());
  Object.defineProperty(globalThis, 'performance', {
    configurable: true,
    writable: true,
    value: {
      now,
    },
  });
}
