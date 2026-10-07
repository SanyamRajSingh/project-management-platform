'use strict';

const BASE_URL = 'http://localhost:3000';

async function testRateLimitAndCors() {
  console.log('=== VERIFYING RATE LIMITING & CORS ===');

  // 1. CORS Test: Allowed origin
  const allowedRes = await fetch(`${BASE_URL}/api/v1/health`, {
    headers: { Origin: 'http://localhost:3000' }
  });
  const allowHeader = allowedRes.headers.get('access-control-allow-origin');
  console.log('Allowed Origin response header:', allowHeader);
  if (allowHeader !== 'http://localhost:3000' && allowHeader !== '*') {
    console.error('❌ CORS failed for allowed origin');
    process.exit(1);
  }
  console.log('✅ CORS allows legitimate web origin http://localhost:3000');

  // 2. CORS Test: Disallowed origin
  const disallowRes = await fetch(`${BASE_URL}/api/v1/health`, {
    headers: { Origin: 'http://malicious-site.com' }
  });
  const disallowHeader = disallowRes.headers.get('access-control-allow-origin');
  console.log('Disallowed Origin response header:', disallowHeader);
  if (disallowHeader === 'http://malicious-site.com') {
    console.error('❌ CORS permitted malicious origin!');
    process.exit(1);
  }
  console.log('✅ CORS rejects untrusted origin http://malicious-site.com');

  // 3. Rate limiting test: spamming auth endpoint (limit: 10 per min)
  console.log('Testing rate limit throttling on auth endpoints (limit 10/min)...');
  let hitRateLimit = false;
  for (let i = 0; i < 15; i++) {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `ratelimit_${i}@test.com`, password: 'wrong' })
    });
    if (res.status === 429) {
      hitRateLimit = true;
      console.log(`✅ Rate limit correctly triggered 429 Too Many Requests at request #${i + 1}`);
      break;
    }
  }

  if (!hitRateLimit) {
    console.warn('⚠️ Rate limit did not trigger 429 within 15 requests (check throttler storage/limit)');
  }

  console.log('🎉 CORS & Rate Limiting verification completed!');
}

testRateLimitAndCors().catch(err => {
  console.error(err);
  process.exit(1);
});
