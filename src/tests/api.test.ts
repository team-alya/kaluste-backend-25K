import request from 'supertest';
import createApp from '../app';
import mongoose from 'mongoose';
import config from "../config/startup-envs";

const app = createApp();

describe('GET /api/ping', () => {
  it('should return pong', async () => {
    const res = await request(app).get('/api/ping');
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('pong');
  });
});


// Login api test --------------------------------------------------------------------------------------------------
describe('POST /api/login', () => {
  it('should return a token when login is successful', async () => {
    await mongoose.connect(config.mongodb.uri);

    const loginPayload = {
      username: 'akseli',
      password: 'tämäontesti'
    };

    const res = await request(app)
      .post('/api/login')
      .send(loginPayload);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.username).toBe(loginPayload.username);
  });

  it('should fail with wrong credentials', async () => {
    await mongoose.connect(config.mongodb.uri);

    const res = await request(app)
      .post('/api/login')
      .send({ username: 'wronguser', password: 'wrongpassword' });

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe("Wrong username or password.");
  });
});

// Image api tests ------------------------------------------------------------------------------------------------------------------
describe('POST /api/image', () => {
  it('should fail without an image file and wrong token', async () => {
    const token = "fake-token";

    const res = await request(app)
      .post('/api/image')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe("Invalid token");
  });
});

afterAll(async () => {
  await mongoose.disconnect();
});