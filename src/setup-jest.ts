import 'jest-preset-angular/setup-jest';

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
            openCursor: jest.fn()
          }))
        }))
      }))
    }
  }))
};

Object.defineProperty(window, 'indexedDB', {
  value: indexedDBMock
});

// Mock Notification API
Object.defineProperty(window, 'Notification', {
  value: jest.fn(() => ({
    close: jest.fn()
  })),
  writable: true
});

Object.defineProperty(Notification, 'requestPermission', {
  value: jest.fn(() => Promise.resolve('granted')),
  writable: true
});

Object.defineProperty(Notification, 'permission', {
  value: 'granted',
  writable: true
});
