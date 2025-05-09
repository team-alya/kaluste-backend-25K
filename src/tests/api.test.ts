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
  const seconds = 1000;

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
    const imagePath = path.join(__dirname, 'images', 'marius.png')
    const res = await request(app)
      .post('/api/image')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', imagePath);

    expect(res.statusCode).toBe(200);
  }, 20 * seconds); // Set timeout to be longer than default so test doesn't crash/fail

  it("should return 200 when image is provided", async () => {
    const imagePath = path.join(__dirname, 'images', 'marius.png');

    const res = await request(app)
      .post('/api/image')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', imagePath)

    expect(res.status).toBe(200);
  }, 20 * seconds); // Set timeout to be longer than default so test doesn't crash/fail


  afterAll(async () => {
    await mongoose.disconnect();
  });
});

//  Evaluation api tests ------------------------------------------------------------------------------------------------------------------
describe('/api/evaluation', () => {
  let token: string;
  let newImageId: string;
  let newEvaluationId: string;
  const wrongId = new mongoose.Types.ObjectId().toString();
  const evalData = {
    merkki: "Artek",
    malli: "E60",
    vari: "Vaalea puu",
    mitat: {
      pituus: 38,
      leveys: 38,
      korkeus: 44
    },
    materiaalit: "Puu",
    kunto: "Hyvä"
  };
  const priceEstimation = {
    recommended_price: 120,
    price_reason: [
      "Artek on tunnettu ja arvostettu merkki, mikä nostaa jälleenmyyntiarvoa.",
      "Malli E60 on klassikko ja säilyttää hyvin arvonsa.",
      "Huonekalu on hyvässä kunnossa, mikä vaikuttaa positiivisesti hintaan.",
      "Vaalea puu on suosittu ja ajaton valinta sisustuksessa."
    ]
  }

  beforeAll(async () => {
    await mongoose.connect(config.mongodb.uri);
    const loginRes = await request(app)
      .post('/api/login')
      .send({ username: 'Admin', password: 'Admin' });

    token = loginRes.body.token;
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });


  // Auth ------------------------------------------------------------------------------------------------------------------
  describe('Auth', () => {
    it('should fail with a fake token', async () => {
      const fakeToken = 'fake-token';

      const res = await request(app)
        .post('/api/evaluation/save')
        .set('Authorization', `Bearer ${fakeToken}`)
        .send();

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe("Invalid token");
    });

  });


  // POST method -------------------------------------------------------------------
  describe('POST', () => {
    it('should fail without an image', async () => {
      const res = await request(app)
        .post('/api/evaluation/save')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('No image file provided');
    });

    it('should save new evaluation and return saved evaluation', async () => {
      const imagePath = path.join(__dirname, 'images', 'artek-jakkara.jpg')
      const res = await request(app)
        .post('/api/evaluation/save')
        .set('Authorization', `Bearer ${token}`)
        .attach('image', imagePath)
        .field('merkki', evalData.merkki)
        .field('malli', evalData.malli)
        .field('vari', evalData.vari)
        .field('mitat[pituus]', '38')
        .field('mitat[leveys]', '38')
        .field('mitat[korkeus]', '44')
        .field('materiaalit', JSON.stringify(evalData.materiaalit))
        .field('kunto', evalData.kunto)
        .field('priceEstimation', JSON.stringify(priceEstimation));

      newImageId = res.body.imageId;
      newEvaluationId = res.body.id;
      expect(res.status).toBe(200);
      expect(res.body).toBeInstanceOf(Object);
      expect(res.body.id).toBe(newEvaluationId);
      expect(res.body.imageId).toBe(newImageId);
      expect(res.body.user).toBe('Admin');
      expect(res.body.evaluation.brand).toBe('Artek');
      expect(res.body.evaluation.model).toBe('E60');
      expect(res.body.priceEstimation.recommended_price).toBe(120);
      expect(res.body.status).toBe('not reviewed');
    });
  });


  // GET method ------------------------------------------------------------------------------------------------------------------
  describe('GET', () => {
    it('should return all evaluations', async () => {
      const res = await request(app)
        .get('/api/evaluation/all')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200);
      expect(res.body).not.toBeNull();
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(5);
    });

    it('should fail with a wrong evaluation id', async () => {
      const res = await request(app)
        .get(`/api/evaluation/${wrongId}`)
        .set('Authorization', `Bearer ${token}`)
        .send()

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Evaluation not found');
    });

    it('should return specific evaluation with id', async () => {
      const res = await request(app)
        .get(`/api/evaluation/${newEvaluationId}`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(newEvaluationId);
      expect(res.body.imageId).toBe(newImageId)
      expect(res.body.user).toBe('Admin');
      expect(res.body.evaluation.brand).toBe('Artek');
      expect(res.body.evaluation.model).toBe('E60');
      expect(res.body.priceEstimation.recommended_price).toBe(120);
      expect(res.body.status).toBe('not reviewed');
    });
  });


  // PUT method ------------------------------------------------------------------------------------------------------------------
  describe('PUT', () => {
    it('should fail with a wrong evaluation id', async () => {
      const res = await request(app)
        .put(`/api/evaluation/${wrongId}`)
        .set('Authorization', `Bearer ${token}`)
        .send()

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Evaluation not found');
    });

    it('should update given values and return updated evaluation', async () => {
      const res = await request(app)
        .put(`/api/evaluation/${newEvaluationId}`)
        .set('Authorization', `Bearer ${token}`)
        .field('merkki', 'muokkaus')
        .field('malli', 'testi')
        .field('vari', 'läpinäkyvä')
        .field('description', 'muokkaus testi toimii!')

      expect(res.status).toBe(200);
      expect(res.body).toBeInstanceOf(Object);
      expect(res.body.id).toBe(newEvaluationId);
      expect(res.body.imageId).toBe(newImageId);
      expect(res.body.user).toBe('Admin');
      expect(res.body.evaluation.brand).not.toBe('Artek');
      expect(res.body.evaluation.model).not.toBe('E60');
      expect(res.body.evaluation.brand).toBe('muokkaus')
      expect(res.body.evaluation.model).toBe('testi')
      expect(res.body.evaluation.color).toBe('läpinäkyvä')
      expect(res.body.evaluation.condition).toBe('Hyvä')
      expect(res.body.description).toBe('muokkaus testi toimii!');
    });
  });


  // PATCH method ------------------------------------------------------------------------------------------------------------------
  describe('PATCH', () => {
    it('should fail with a wrong evaluation id', async () => {
      const res = await request(app)
        .patch(`/api/evaluation/${wrongId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send()

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Evaluation not found');
    });

    it('should fail with an invalid status', async () => {
      const res = await request(app)
        .patch(`/api/evaluation/${newEvaluationId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .field('status', 'invalid status')

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Given status is not valid');
    });

    it('should update the status of the evaluation', async () => {
      const res = await request(app)
        .patch(`/api/evaluation/${newEvaluationId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .field('status', 'reviewed')

      expect(res.status).toBe(200);
      expect(res.body).toBeInstanceOf(Object);
      expect(res.body.evaluation.id).toBe(newEvaluationId);
      expect(res.body.evaluation.user).toBe('Admin');
      expect(res.body.evaluation.status).toBe('reviewed');
    })
  });


  // DELETE method ------------------------------------------------------------------------------------------------------------------
  describe('DELETE', () => {
    it('should fail with a wrong evaluation id', async () => {
      const res = await request(app)
        .delete(`/api/evaluation/${wrongId}`)
        .set('Authorization', `Bearer ${token}`)
        .send()

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Evaluation not found')
    });

    it('should delete evaluation with id', async () => {
      const res = await request(app)
        .delete(`/api/evaluation/${newEvaluationId}`)
        .set('Authorization', `Bearer ${token}`)
        .send()

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Evaluation and related image deleted successfully');
    });

  });
});


// Photo quality api test ------------------------------------------------------------------------------------------------------------------
describe('POST /api/photo/', () => {
  const seconds: number = 1000;
  let token: string;

  beforeAll(async () => {
    await mongoose.connect(config.mongodb.uri);
    const loginRes = await request(app)
      .post('/api/login')
      .send({ username: 'Admin', password: 'Admin' });
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
  }, 20 * seconds); // Set timeout to be longer than default so test doesn't crash/fail

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
  }, 20 * seconds); // Set timeout to be longer than default so test doesn't crash / fail

  afterAll(async () => {
    await mongoose.disconnect();
  });
});
