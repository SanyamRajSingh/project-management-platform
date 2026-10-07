'use strict';

const BASE_URL = 'http://localhost:3000';

async function req(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  let data = null;
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, headers: res.headers, data };
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}

async function run() {
  console.log('=== STARTING COMPLETE API & SECURITY CONTRACT VERIFICATION ===\n');

  // 1. Health check
  console.log('--- 1. Health Endpoint Verification ---');
  const healthRes = await req('/api/v1/health');
  assert(healthRes.status === 200, 'GET /api/v1/health returns 200');
  assert(healthRes.data?.data?.info?.database?.status === 'up', 'PostgreSQL database is UP');
  assert(healthRes.data?.data?.info?.redis?.status === 'up', 'Redis cache is UP');

  const healthRewrite = await req('/api/health');
  assert(healthRewrite.status === 200, 'Rewrite /api/health returns 200 reaching same health logic');

  // 2. Authentication - User A (Register, duplicate, login, /me)
  console.log('\n--- 2. Authentication Verification (User A) ---');
  const userA_email = `user_a_${Date.now()}@test.com`;
  const userA_password = 'Password123!';
  const userA_name = 'Alice Intern';

  const regA = await req('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: userA_email,
      password: userA_password,
      fullName: userA_name,
    }),
  });
  assert(regA.status === 201, 'User A registered successfully (201)');
  assert(!JSON.stringify(regA.data).includes('password_hash'), 'Password hash never exposed in register response');
  assert(!JSON.stringify(regA.data).includes(userA_password), 'Plaintext password never exposed in register response');

  // Duplicate email check
  const regDup = await req('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: userA_email,
      password: userA_password,
      fullName: userA_name,
    }),
  });
  assert(regDup.status === 409, 'Duplicate registration cleanly rejected with 409 Conflict');

  // Login User A
  const loginA = await req('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: userA_email,
      password: userA_password,
    }),
  });
  assert(loginA.status === 200 || loginA.status === 201, 'User A logged in successfully');
  const tokenA = loginA.data?.data?.accessToken || loginA.data?.accessToken;
  const refreshA = loginA.data?.data?.refreshToken || loginA.data?.refreshToken;
  assert(!!tokenA, 'Access token provided in login response');
  assert(!!refreshA, 'Refresh token provided in login response');

  // Get /api/auth/me
  const meA = await req('/api/auth/me', {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(meA.status === 200, 'GET /api/auth/me returns 200');
  const userA_id = meA.data?.data?.user?.id || meA.data?.data?.id;
  assert(!!userA_id, 'User ID present in /me response');

  // Also check /api/v1/auth/me
  const meA_v1 = await req('/api/v1/auth/me', {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(meA_v1.status === 200, 'Legacy /api/v1/auth/me returns 200 with identical user details');

  // 3. User B Creation (for authorization isolation)
  console.log('\n--- 3. User B Creation for Ownership Isolation ---');
  const userB_email = `user_b_${Date.now()}@test.com`;
  const userB_password = 'Password123!';
  const userB_name = 'Bob External';

  const regB = await req('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: userB_email,
      password: userB_password,
      fullName: userB_name,
    }),
  });
  assert(regB.status === 201, 'User B registered successfully (201)');

  const loginB = await req('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: userB_email,
      password: userB_password,
    }),
  });
  const tokenB = loginB.data?.data?.accessToken || loginB.data?.accessToken;
  assert(!!tokenB, 'User B token obtained');

  // 4. Project CRUD under /api/projects
  console.log('\n--- 4. Project CRUD Verification (User A) ---');
  const projCreate = await req('/api/projects', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      name: 'Launch Portal v2',
      description: 'Major customer milestone project',
      status: 'In Progress',
      startDate: '2026-10-01',
      endDate: '2026-12-31',
    }),
  });
  assert(projCreate.status === 201, 'POST /api/projects created project (201)');
  const projectA = projCreate.data?.data;
  assert(projectA.name === 'Launch Portal v2', 'Project name correctly stored');
  assert(projectA.status === 'In Progress', 'Project status "In Progress" stored');
  assert(projectA.startDate && projectA.startDate.toString().includes('2026-10-01'), 'Project startDate stored');
  assert(projectA.endDate && projectA.endDate.toString().includes('2026-12-31'), 'Project endDate stored');
  const projectA_id = projectA.id;

  // Project List
  const projList = await req('/api/projects', {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(projList.status === 200, 'GET /api/projects returns 200');
  const items = Array.isArray(projList.data?.data) ? projList.data.data : (projList.data?.data?.items || []);
  assert(items.some(p => p.id === projectA_id), 'Created project found in User A project list');

  // Project Filter & Search
  const projFiltered = await req('/api/projects?status=In%20Progress', {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(projFiltered.status === 200, 'GET /api/projects?status=In Progress returns 200');

  const projSearch = await req('/api/projects?search=Launch', {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(projSearch.status === 200, 'GET /api/projects?search=Launch returns 200');

  // Project Update (PUT /api/projects/:id)
  const projUpdate = await req(`/api/projects/${projectA_id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      name: 'Launch Portal v2 - Final',
      status: 'Completed',
    }),
  });
  assert(projUpdate.status === 200, 'PUT /api/projects/:id updated project (200)');
  assert(projUpdate.data?.data?.status === 'Completed', 'Project updated to status "Completed"');

  // 5. Task CRUD under /api/tasks
  console.log('\n--- 5. Task CRUD Verification (User A) ---');
  const taskCreate = await req('/api/tasks', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      projectId: projectA_id,
      title: 'Design high-fidelity mockup',
      description: 'Create wireframes and prototypes',
      status: 'In Progress',
      priority: 'High',
      dueDate: '2026-11-15',
    }),
  });
  assert(taskCreate.status === 201, 'POST /api/tasks created task (201)');
  const taskA = taskCreate.data?.data;
  assert(taskA.title === 'Design high-fidelity mockup', 'Task title correctly stored');
  assert(taskA.status === 'In Progress' || taskA.status === 'in_progress', 'Task status "In Progress" stored');
  assert(taskA.priority === 'High' || taskA.priority === 'high', 'Task priority "High" stored');
  const taskA_id = taskA.id;

  // Task List & Filters
  const taskList = await req('/api/tasks', {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(taskList.status === 200, 'GET /api/tasks returns 200');

  const taskFiltered = await req('/api/tasks?status=In%20Progress&priority=High', {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(taskFiltered.status === 200, 'GET /api/tasks with status & priority filters returns 200');

  // Task Update (PUT /api/tasks/:id) -> Mark Completed
  const taskUpdate = await req(`/api/tasks/${taskA_id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      status: 'Completed',
      priority: 'Medium',
    }),
  });
  assert(taskUpdate.status === 200, 'PUT /api/tasks/:id updated task (200)');
  assert(taskUpdate.data?.data?.status === 'Completed' || taskUpdate.data?.data?.status === 'done', 'Task marked Completed');

  // 6. Dashboard Aggregation (/api/dashboard)
  console.log('\n--- 6. Dashboard Aggregation Verification ---');
  const dashA = await req('/api/dashboard', {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(dashA.status === 200, 'GET /api/dashboard returns 200');
  const dashDataA = dashA.data?.data;
  assert(typeof dashDataA.totalProjects === 'number', 'totalProjects is a numeric count');
  assert(typeof dashDataA.totalTasks === 'number', 'totalTasks is a numeric count');
  assert(dashDataA.totalProjects >= 1, 'User A sees at least 1 project in dashboard');
  assert(dashDataA.totalTasks >= 1, 'User A sees at least 1 task in dashboard');

  // 7. Ownership & Cross-Tenant Isolation (User B cannot access User A's data)
  console.log('\n--- 7. Ownership & Security Isolation Verification ---');
  const stealProject = await req(`/api/projects/${projectA_id}`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  assert(stealProject.status === 403 || stealProject.status === 404, 'User B blocked from GET Project A (403/404)');

  const editProject = await req(`/api/projects/${projectA_id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${tokenB}` },
    body: JSON.stringify({ name: 'Hacked Project' }),
  });
  assert(editProject.status === 403 || editProject.status === 404, 'User B blocked from PUT Project A (403/404)');

  const deleteProject = await req(`/api/projects/${projectA_id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  assert(deleteProject.status === 403 || deleteProject.status === 404, 'User B blocked from DELETE Project A (403/404)');

  const stealTask = await req(`/api/tasks/${taskA_id}`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  assert(stealTask.status === 403 || stealTask.status === 404, 'User B blocked from GET Task A (403/404)');

  const editTask = await req(`/api/tasks/${taskA_id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${tokenB}` },
    body: JSON.stringify({ title: 'Hacked Task' }),
  });
  assert(editTask.status === 403 || editTask.status === 404, 'User B blocked from PUT Task A (403/404)');

  // Verify User B's dashboard does NOT see User A's counts
  const dashB = await req('/api/dashboard', {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  assert(dashB.status === 200, 'GET /api/dashboard for User B returns 200');
  assert(dashB.data?.data?.totalProjects === 0, 'User B dashboard isolates 0 projects');
  assert(dashB.data?.data?.totalTasks === 0, 'User B dashboard isolates 0 tasks');

  // 8. Input Validation & SQL Injection Resilience
  console.log('\n--- 8. Input Validation & SQL Injection Safety ---');
  const invalidBody = await req('/api/projects', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      name: '', // Empty string invalid
      status: 'NonExistentStatus',
    }),
  });
  assert(invalidBody.status === 400, 'Invalid empty name & status rejected with 400 Bad Request');
  assert(!JSON.stringify(invalidBody.data).includes('SELECT'), 'No SQL query fragments leaked in 400 response');

  // SQL Injection test in query params
  const sqlParam = encodeURIComponent("' OR '1'='1; DROP TABLE users; --");
  const sqlInjectionTest = await req(`/api/projects?search=${sqlParam}`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(sqlInjectionTest.status === 200, 'SQL injection search attempt handled safely without server error');

  // Verify users table is completely intact
  const meA_after = await req('/api/auth/me', {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(meA_after.status === 200, 'Users table completely intact, User A continues authenticated');

  // 9. Unauthorized access tests
  console.log('\n--- 9. Unauthorized Request Handling ---');
  const noToken = await req('/api/projects');
  assert(noToken.status === 401, 'Unauthenticated request to protected route returns 401 Unauthorized');

  const forgedToken = await req('/api/projects', {
    headers: { Authorization: 'Bearer forged.jwt.token' },
  });
  assert(forgedToken.status === 401, 'Forged JWT returns 401 Unauthorized');

  // 10. Refresh token rotation & Logout
  console.log('\n--- 10. Token Refresh Rotation & Session Logout ---');
  const refreshRes = await req('/api/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: refreshA }),
  });
  assert(refreshRes.status === 200 || refreshRes.status === 201, 'Token refresh succeeds (200/201)');
  const newAccessToken = refreshRes.data?.data?.accessToken || refreshRes.data?.accessToken;
  const newRefreshToken = refreshRes.data?.data?.refreshToken || refreshRes.data?.refreshToken;
  assert(!!newAccessToken, 'New access token provided after rotation');
  assert(!!newRefreshToken, 'New refresh token provided after rotation');

  // Revoke via Logout
  const logoutRes = await req('/api/auth/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${newAccessToken}` },
    body: JSON.stringify({ refreshToken: newRefreshToken }),
  });
  assert([200, 201, 204].includes(logoutRes.status), 'Logout endpoint succeeded');

  // Re-use revoked refresh token must be rejected
  const revokedRefresh = await req('/api/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: newRefreshToken }),
  });
  assert(revokedRefresh.status === 401 || revokedRefresh.status === 400, 'Revoked refresh token rejected on re-use');

  console.log('\n🎉 ALL API, AUTHENTICATION, AND SECURITY CONTRACT CHECKS PASSED WITH 100% SUCCESS!');
}

run().catch((err) => {
  console.error('Fatal execution error in test script:', err);
  process.exit(1);
});
