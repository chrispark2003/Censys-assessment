import request from 'supertest';
import app from '../src/server';

describe('Chat Controller', () => {
  describe('POST /api/chat', () => {
    it('should return error for empty message', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({ message: '' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Message is required');
    });

    it('should return error for missing message', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Message is required');
    });

    it('should accept valid message', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'Hello, can you help me with Censys data analysis?' });

      // Note: This test might fail if GEMINI_API_KEY is not set in test environment
      // In a real test environment, we would mock the GeminiService
      expect(response.status).toBe(200);
    }, 30000); // Increase timeout for API call
  });
});