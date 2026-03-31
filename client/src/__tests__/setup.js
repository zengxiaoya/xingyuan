import '@testing-library/jest-dom'

// jsdom@29 has a localStorage regression with zustand persist — polyfill it
class LocalStorageMock {
  constructor() { this.store = {} }
  clear() { this.store = {} }
  getItem(key) { return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null }
  setItem(key, value) { this.store[key] = String(value) }
  removeItem(key) { delete this.store[key] }
  get length() { return Object.keys(this.store).length }
  key(n) { return Object.keys(this.store)[n] ?? null }
}

Object.defineProperty(globalThis, 'localStorage', { value: new LocalStorageMock(), writable: true })
