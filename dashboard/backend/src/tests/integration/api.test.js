import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');

// We'll create a mini-app for testing or use the real server if possible.
// For integration tests, it's often better to test the routes directly.
const opportunityRoutes = require('../../api/routes/opportunities');
const profileRoutes = require('../../api/routes/profile');

describe('API Integration Tests', () => {
    let app;

    beforeAll(() => {
        app = express();
        app.use(bodyParser.json());
        
        // Mock user middleware
        app.use((req, res, next) => {
            req.user = { id: 1, plan_id: 'pro', email: 'test@example.com' };
            next();
        });

        app.use('/api/opportunities', opportunityRoutes);
        app.use('/api/profile', profileRoutes);
    });

    it('GET /api/opportunities should return a list of opportunities', async () => {
        const res = await request(app).get('/api/opportunities');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /api/profile should return user profile data', async () => {
        const res = await request(app).get('/api/profile');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('email');
    });

    it('PUT /api/profile should update user bio', async () => {
        const res = await request(app)
            .put('/api/profile')
            .send({ bio: 'New bio for testing' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});
