const request = require('supertest');
const app = require('../src/app'); // Import app without starting server

describe('App Endpoints', () => {
  it('should return a 200 OK from the root health check', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'healthy');
  });

  it('should return a 404 for an unknown route', async () => {
    const res = await request(app).get('/unknown-route');
    expect(res.statusCode).toEqual(404);
  });
});
