import request from 'supertest';
import createApp from '../app';
import mongoose from 'mongoose';
import path from "path";

import config from "../config/startup-envs";

const app = createApp();

describe('GET /api/ping', () => {
  it('should return pong', async () => {
    const res = await request(app).get('/api/ping');
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('pong!');
  });
});


// Login api test --------------------------------------------------------------------------------------------------
describe('POST /api/login', () => {
  it('should return a token when login is successful', async () => {
    await mongoose.connect(config.mongodb.uri);

    const loginPayload = {
      username: 'Admin',
      password: 'Admin'
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
  let token: string;

  beforeAll(async () => {
    await mongoose.connect(config.mongodb.uri);

    const loginRes = await request(app)
      .post('/api/login')
      .send({ username: 'Admin', password: 'Admin' });

    token = loginRes.body.token;
  });

  it('should fail without an image file but with a valid token', async () => {
    const res = await request(app)
      .post('/api/image')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(res.statusCode).toBe(400);
  });

  it('should fail with a fake token', async () => {
    const fakeToken = "fake-token";

    const res = await request(app)
      .post('/api/image')
      .set('Authorization', `Bearer ${fakeToken}`)
      .send();

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe("Invalid token");
  });

  it('should succeed with image and correct token', async () => {
    const res = await request(app)
      .post('/api/image')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', 'src/tests/images/marius.png');

    console.log("Response body:", res.body);
    expect(res.statusCode).toBe(200);
  });

  it("should return 200 when image is provided", async () => {
    const imagePath = path.join(__dirname, 'images', 'marius.png');

    await request(app)
      .post('/api/image')
      .attach('image', imagePath)
      .expect(200);
  });


  afterAll(async () => {
    await mongoose.disconnect();
  });
});

//  Evaluation api tests ------------------------------------------------------------------------------------------------------------------


// Photo quality api test ------------------------------------------------------------------------------------------------------------------
describe('POST /api/photo/', () => {
  const seconds: number = 1000;
  let token: string;

  beforeAll(async () => {
    await mongoose.connect(config.mongodb.uri);
    const loginRes = await request(app)
      .post('/api/login')
      .send({ username: 'Admin', password: 'Admin' })
    token = loginRes.body.token;
  });

  it('Should fail with a fake token', async () => {
    const fakeToken = "fake-token";

    const res = await request(app)
      .post('/api/image')
      .set('Authorization', `Bearer ${fakeToken}`)
      .send();

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe("Invalid token");
  });

  it('Should fail without an image', async () => {
    const res = await request(app)
      .post('/api/image')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('No image file provided');
  });

  it('Should give feedback on poor quality image', async () => {
    const imagePath = path.join(__dirname, 'images', 'artek-huonolaatuinen-kuva.png')
    const res = await request(app)
      .post('/api/photo')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', imagePath);

    expect(res.body.message).not.toBe('Kuva vaikuttaa hyvälaatuiselta. Voimme jatkaa analyysiä.');
    expect(res.body.photo_quality_score).toBeLessThan(80);
  }, 30 * seconds); // Set timeout to be longer than default so test doesn't crash

  it('Should process good image correctly', async () => {
    const imagePath = path.join(__dirname, 'images', 'artek-jakkara.jpg');
    const res = await request(app)
      .post('/api/photo')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', imagePath);

    expect(res.body.message).toBe('Kuva vaikuttaa hyvälaatuiselta. Voimme jatkaa analyysiä.');
    expect(res.body.photo_quality_score).toBeGreaterThanOrEqual(75);
    expect(res.body.main_object_visibility).toBeGreaterThanOrEqual(85);
    expect(res.body.main_object_detected).not.toBe('Ei tunnistettu');
  }, 30 * seconds); // Set timeout to be longer than default so test doesn't crash

  afterAll(async () => {
    await mongoose.disconnect();
  });
});

// Admin api tests ------------------------------------------------------------------------------------------------------------------
