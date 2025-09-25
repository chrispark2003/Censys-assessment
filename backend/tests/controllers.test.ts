import { DataValidator } from '../src/utils/dataValidator';
import { InMemoryStore } from '../src/utils/inMemoryStore';

// Simple test to verify controller logic components work
describe('Controller Components', () => {
  beforeEach(() => {
    // Clear any existing data
    InMemoryStore.clear();
  });

  test('DataValidator should validate Censys data', () => {
    const validData = {
      hosts: [
        { ip: '192.168.1.1', services: [] },
        { ip: '10.0.0.1' }
      ]
    };

    const result = DataValidator.validateCensysData(validData);

    expect(result.isValid).toBe(true);
    expect(result.isCensysData).toBe(true);
    expect(result.hostCount).toBe(2);
  });

  test('InMemoryStore should store and retrieve data', () => {
    const testData = {
      data: { hosts: [{ ip: '1.1.1.1' }] },
      originalFilename: 'test.json',
      uploadedAt: new Date(),
      filePath: '/tmp/test.json'
    };

    InMemoryStore.store('test-session', testData);
    const retrieved = InMemoryStore.get('test-session');

    expect(retrieved).toBeTruthy();
    expect(retrieved?.originalFilename).toBe('test.json');
  });

  test('InMemoryStore should return null for non-existent sessions', () => {
    const result = InMemoryStore.get('non-existent');
    expect(result).toBeNull();
  });
});