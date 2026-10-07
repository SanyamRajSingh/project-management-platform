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
  return { status: res.status, data };
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ SYNC ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}

async function runSyncTest() {
  console.log('=== STARTING MANDATORY CROSS-PLATFORM SYNCHRONIZATION TEST ===\n');

  // Shared account setup
  const syncEmail = `sync_user_${Date.now()}@test.com`;
  const syncPassword = 'Password123!';

  console.log('1. Registering shared user account for Web and Mobile...');
  const reg = await req('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: syncEmail,
      password: syncPassword,
      fullName: 'Sync Tester',
    }),
  });
  assert(reg.status === 201, 'User registered');

  // Login Web Client
  console.log('2. Web Client logs in...');
  const webLogin = await req('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: syncEmail, password: syncPassword }),
  });
  const webToken = webLogin.data?.data?.accessToken || webLogin.data?.accessToken;
  assert(!!webToken, 'Web client authenticated with token');

  // Login Mobile Client (Same Account)
  console.log('3. Mobile Client logs in with SAME account...');
  const mobileLogin = await req('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: syncEmail, password: syncPassword }),
  });
  const mobileToken = mobileLogin.data?.data?.accessToken || mobileLogin.data?.accessToken;
  assert(!!mobileToken, 'Mobile client authenticated with token');

  // TEST A: Web creates Project and Task -> Mobile pulls and sees it
  console.log('\n--- TEST A: Web creates Project & Task -> Mobile pull-to-refresh ---');
  const createProj = await req('/api/projects', {
    method: 'POST',
    headers: { Authorization: `Bearer ${webToken}` },
    body: JSON.stringify({
      name: 'Cross Platform Project',
      description: 'Synchronized workspace test',
      status: 'In Progress',
    }),
  });
  assert(createProj.status === 201, 'Web created project');
  const projectId = createProj.data?.data?.id;

  const createTaskWeb = await req('/api/tasks', {
    method: 'POST',
    headers: { Authorization: `Bearer ${webToken}` },
    body: JSON.stringify({
      projectId,
      title: 'Web Created Task',
      status: 'In Progress',
      priority: 'Low',
    }),
  });
  assert(createTaskWeb.status === 201, 'Web created task');
  const taskId = createTaskWeb.data?.data?.id;

  // Mobile pull-to-refresh
  const mobileTasks = await req('/api/tasks', {
    headers: { Authorization: `Bearer ${mobileToken}` },
  });
  const mList = Array.isArray(mobileTasks.data?.data) ? mobileTasks.data.data : (mobileTasks.data?.data?.items || []);
  const foundOnMobile = mList.find(t => t.id === taskId);
  assert(!!foundOnMobile, 'Mobile pull-to-refresh displays task created on Web');
  assert(foundOnMobile.title === 'Web Created Task', 'Mobile sees correct title');

  // TEST B: Mobile creates Task -> Web refreshes and sees it
  console.log('\n--- TEST B: Mobile creates Task -> Web refresh ---');
  const createTaskMobile = await req('/api/tasks', {
    method: 'POST',
    headers: { Authorization: `Bearer ${mobileToken}` },
    body: JSON.stringify({
      projectId,
      title: 'Mobile Created Task',
      status: 'Pending',
      priority: 'High',
    }),
  });
  assert(createTaskMobile.status === 201, 'Mobile created task');
  const mobileTaskId = createTaskMobile.data?.data?.id;

  // Web refreshes task list
  const webTasks = await req('/api/tasks', {
    headers: { Authorization: `Bearer ${webToken}` },
  });
  const wList = Array.isArray(webTasks.data?.data) ? webTasks.data.data : (webTasks.data?.data?.items || []);
  const foundOnWeb = wList.find(t => t.id === mobileTaskId);
  assert(!!foundOnWeb, 'Web refresh displays task created on Mobile');
  assert(foundOnWeb.title === 'Mobile Created Task', 'Web sees correct title');

  // TEST C: Update task status on Mobile -> Web refresh
  console.log('\n--- TEST C: Mobile updates task status -> Web refresh ---');
  const updateMobile = await req(`/api/tasks/${taskId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${mobileToken}` },
    body: JSON.stringify({ status: 'Completed' }),
  });
  assert(updateMobile.status === 200, 'Mobile updated task status to Completed');

  const webVerifyStatus = await req(`/api/tasks/${taskId}`, {
    headers: { Authorization: `Bearer ${webToken}` },
  });
  const updatedStatus = webVerifyStatus.data?.data?.status;
  assert(updatedStatus === 'Completed' || updatedStatus === 'done', 'Web refresh reflects status updated on Mobile');

  // TEST D: Update task priority on Web -> Mobile pull-to-refresh
  console.log('\n--- TEST D: Web updates task priority -> Mobile pull-to-refresh ---');
  const updateWebPriority = await req(`/api/tasks/${mobileTaskId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${webToken}` },
    body: JSON.stringify({ priority: 'Low' }),
  });
  assert(updateWebPriority.status === 200, 'Web updated task priority to Low');

  const mobileVerifyPriority = await req(`/api/tasks/${mobileTaskId}`, {
    headers: { Authorization: `Bearer ${mobileToken}` },
  });
  const updatedPriority = mobileVerifyPriority.data?.data?.priority;
  assert(updatedPriority === 'Low' || updatedPriority === 'low', 'Mobile pull-to-refresh reflects priority updated on Web');

  // TEST E: Delete task on Web -> Mobile pull-to-refresh
  console.log('\n--- TEST E: Web deletes task -> Mobile pull-to-refresh ---');
  const deleteWeb = await req(`/api/tasks/${taskId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${webToken}` },
  });
  assert(deleteWeb.status === 200 || deleteWeb.status === 204, 'Web deleted task');

  const mobileVerifyDelete = await req(`/api/tasks/${taskId}`, {
    headers: { Authorization: `Bearer ${mobileToken}` },
  });
  assert(mobileVerifyDelete.status === 404, 'Mobile cannot find deleted task (404)');

  console.log('\n🎉 ALL 5 CROSS-PLATFORM SYNCHRONIZATION TESTS PASSED WITH 100% SUCCESS!');
}

runSyncTest().catch(err => {
  console.error(err);
  process.exit(1);
});
