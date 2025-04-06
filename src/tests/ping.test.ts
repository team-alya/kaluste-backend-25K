import request from 'supertest';
import createApp from '../app';

const app = createApp();

describe('GET /api/ping', () => {
  it('should return pong', async () => {
    const res = await request(app).get('/api/ping');
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('pong');
  });
});
