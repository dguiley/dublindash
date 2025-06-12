// This file wraps our Fastify app for Vercel Serverless Functions
import app from '../dist/index.js';

export default async function handler(req, res) {
  await app.ready();
  app.server.emit('request', req, res);
}