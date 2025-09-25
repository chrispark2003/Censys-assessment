import { DataValidator } from '../src/utils/dataValidator';

describe('DataValidator', () => {
  describe('validateCensysData', () => {
    test('should validate correct Censys data structure', () => {
      const validData = {
        hosts: [
          { ip: '192.168.1.1', services: [] },
          { ip: '10.0.0.1', location: { country: 'US' } }
        ]
      };

      const result = DataValidator.validateCensysData(validData);

      expect(result.isValid).toBe(true);
      expect(result.isCensysData).toBe(true);
      expect(result.hostCount).toBe(2);
    });

    test('should reject data without hosts field', () => {
      const invalidData = { data: [] };

      const result = DataValidator.validateCensysData(invalidData);

      expect(result.isValid).toBe(true);
      expect(result.isCensysData).toBe(false);
      expect(result.error).toContain('does not contain a "hosts" field');
    });

    test('should reject data with empty hosts array', () => {
      const invalidData = { hosts: [] };

      const result = DataValidator.validateCensysData(invalidData);

      expect(result.isValid).toBe(true);
      expect(result.isCensysData).toBe(false);
      expect(result.error).toContain('hosts" array is empty');
    });

    test('should reject hosts without IP addresses', () => {
      const invalidData = {
        hosts: [
          { name: 'host1' },
          { port: 80 }
        ]
      };

      const result = DataValidator.validateCensysData(invalidData);

      expect(result.isValid).toBe(true);
      expect(result.isCensysData).toBe(false);
      expect(result.error).toContain('No valid hosts found');
    });

    test('should validate IP addresses', () => {
      const dataWithValidIPs = {
        hosts: [
          { ip: '192.168.1.1' },
          { ip: '10.0.0.1' },
          { ip: 'localhost' }
        ]
      };

      const result = DataValidator.validateCensysData(dataWithValidIPs);

      expect(result.isValid).toBe(true);
      expect(result.isCensysData).toBe(true);
      expect(result.hostCount).toBe(3);
    });

    test('should reject invalid IP addresses', () => {
      const dataWithInvalidIPs = {
        hosts: [
          { ip: '999.999.999.999' },
          { ip: 'not-an-ip' }
        ]
      };

      const result = DataValidator.validateCensysData(dataWithInvalidIPs);

      expect(result.isValid).toBe(true);
      expect(result.isCensysData).toBe(false);
    });
  });

  describe('extractHosts', () => {
    test('should extract valid hosts', () => {
      const data = {
        hosts: [
          { ip: '192.168.1.1', services: [] },
          { ip: 'invalid-ip' },
          { ip: '10.0.0.1' }
        ]
      };

      const hosts = DataValidator.extractHosts(data);

      expect(hosts).toHaveLength(2);
      expect(hosts[0].ip).toBe('192.168.1.1');
      expect(hosts[1].ip).toBe('10.0.0.1');
    });

    test('should return empty array for invalid data', () => {
      const invalidData = { data: [] };
      const hosts = DataValidator.extractHosts(invalidData as any);
      expect(hosts).toHaveLength(0);
    });
  });
});