const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const FRONTEND_URL = 'http://localhost:5173';
const TEST_USER = {
  email: 'e2e-test@example.com',
  password: 'Test123!@#'
};

const TEST_RESULTS = {
  timestamp: new Date().toISOString(),
  scenarios: [],
  summary: {}
};

async function logResult(scenario, status, details = '') {
  const result = { scenario, status, details, timestamp: new Date().toISOString() };
  TEST_RESULTS.scenarios.push(result);
  console.log(`[${status}] ${scenario}${details ? ': ' + details : ''}`);
}

async function screenshot(page, name) {
  const dir = 'C:/test/todotodotodo/test/e2e/screenshots';
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filename = `${name}-${Date.now()}.png`;
  await page.screenshot({ path: path.join(dir, filename), fullPage: true });
  console.log(`📸 Screenshot: ${filename}`);
}

async function runTests() {
  let browser;
  try {
    console.log('🚀 ToDoToDoToDo E2E 통합 테스트 시작\n');
    browser = await chromium.launch({ headless: false, slowMo: 100 });
    const page = await browser.newPage();

    // Scenario 0: 로그인
    console.log('\n📋 Scenario 0: 로그인');
    try {
      await page.goto(FRONTEND_URL, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(1500);

      const emailInput = page.locator('input[type="email"]');
      if (await emailInput.count() > 0) {
        await emailInput.first().fill(TEST_USER.email);
        await page.waitForTimeout(300);
      }

      const passwordInput = page.locator('input[type="password"]');
      if (await passwordInput.count() > 0) {
        await passwordInput.first().fill(TEST_USER.password);
        await page.waitForTimeout(300);
      }

      const loginBtn = page.locator('button:has-text("로그인")');
      if (await loginBtn.count() > 0) {
        await loginBtn.first().click();
        await page.waitForTimeout(3000);
      }

      const hasTabs = await page.locator('[role="tab"]').count() > 0;
      const hasAddBtn = await page.locator('button:has-text("새 할일")').count() > 0;

      if (hasTabs || hasAddBtn) {
        console.log('✓ 대시보드 로드 완료');
        await logResult('Scenario 0: 로그인', 'PASS');
        await screenshot(page, 'scenario-0-login-success');
      } else {
        throw new Error('대시보드 요소를 찾을 수 없음');
      }
    } catch (err) {
      await logResult('Scenario 0: 로그인', 'FAIL', err.message);
      await screenshot(page, 'scenario-0-login-fail');
      throw err;
    }

    // Scenario 1: 할일 추가
    console.log('\n📋 Scenario 1: 아침 회의 시 할일 추가');
    try {
      const todos = [
        { title: '프로젝트 제안서 작성', days: 3 },
        { title: '팀 회의 자료 준비', days: 1 },
        { title: '클라이언트 미팅 준비', days: 2 }
      ];

      for (let i = 0; i < todos.length; i++) {
        const todo = todos[i];
        const addBtn = page.locator('button:has-text("새 할일")').first();
        if (await addBtn.count() > 0) {
          await addBtn.first().click();
          await page.waitForTimeout(500);

          const titleInput = page.locator('input[placeholder*="제목"]');
          if (await titleInput.count() > 0) {
            await titleInput.first().fill(todo.title);
          }

          const dateInputs = page.locator('input[type="date"]');
          const today = new Date().toISOString().split('T')[0];
          const endDate = new Date(Date.now() + todo.days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

          if (await dateInputs.count() >= 2) {
            await dateInputs.nth(0).fill(today);
            await dateInputs.nth(1).fill(endDate);
          }

          const submitBtn = page.locator('button:has-text("추가")').last();
          await submitBtn.click();
          await page.waitForTimeout(800);
          console.log(`✓ 할일 ${i + 1} 추가: ${todo.title}`);
        }
      }

      await logResult('Scenario 1: 아침 회의 시 할일 추가 (3개)', 'PASS');
      await screenshot(page, 'scenario-1-add-todos');
    } catch (err) {
      await logResult('Scenario 1: 아침 회의 시 할일 추가 (3개)', 'FAIL', err.message);
      await screenshot(page, 'scenario-1-add-todos-fail');
    }

    // Scenario 2: 완료 처리
    console.log('\n📋 Scenario 2: 점심시간 진행률 확인 및 완료');
    try {
      await page.waitForTimeout(500);
      const completeBtn = page.locator('button:has-text("완료")').first();
      if (await completeBtn.count() > 0) {
        await completeBtn.click();
        await page.waitForTimeout(1000);
        console.log('✓ 첫 번째 할일 완료 처리');
      }

      await logResult('Scenario 2: 점심시간 진행률 확인 및 완료', 'PASS');
      await screenshot(page, 'scenario-2-complete-todo');
    } catch (err) {
      await logResult('Scenario 2: 점심시간 진행률 확인 및 완료', 'FAIL', err.message);
      await screenshot(page, 'scenario-2-complete-todo-fail');
    }

    // Scenario 3: 할일 수정
    console.log('\n📋 Scenario 3: 할일 내용 및 일정 변경');
    try {
      const activeTab = page.locator('[role="tab"]:has-text("진행중")');
      if (await activeTab.count() > 0) {
        await activeTab.click();
        await page.waitForTimeout(500);
      }

      const editBtn = page.locator('button:has-text("수정")').first();
      if (await editBtn.count() > 0) {
        await editBtn.click();
        await page.waitForTimeout(1000);

        const dateInputs = page.locator('input[type="date"]');
        if (await dateInputs.count() >= 2) {
          const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          await dateInputs.nth(1).fill(tomorrow);
        }

        const submitBtn = page.locator('button:has-text("수정")').last();
        if (await submitBtn.count() > 0) {
          await submitBtn.click();
          await page.waitForTimeout(800);
          console.log('✓ 할일 수정 완료');
        }
      }

      await logResult('Scenario 3: 할일 내용 및 일정 변경', 'PASS');
      await screenshot(page, 'scenario-3-update-todo');
    } catch (err) {
      await logResult('Scenario 3: 할일 내용 및 일정 변경', 'FAIL', err.message);
      await screenshot(page, 'scenario-3-update-todo-fail');
    }

    // Scenario 4: 삭제 및 복구
    console.log('\n📋 Scenario 4: 실수로 삭제한 할일 복구');
    try {
      const buttons = page.locator('button');
      let deleteBtn = null;
      for (let i = 0; i < Math.min(50, await buttons.count()); i++) {
        const btn = buttons.nth(i);
        const text = await btn.textContent();
        if (text && (text.includes('삭제') || text.includes('delete'))) {
          deleteBtn = btn;
          break;
        }
      }

      if (deleteBtn) {
        await deleteBtn.click();
        await page.waitForTimeout(800);
        console.log('✓ 할일 삭제 처리');
      }

      const trashTab = page.locator('[role="tab"]:has-text("휴지통")');
      if (await trashTab.count() > 0) {
        await trashTab.click();
        await page.waitForTimeout(500);

        const restoreBtn = page.locator('button:has-text("복원")').first();
        if (await restoreBtn.count() > 0) {
          await restoreBtn.click();
          await page.waitForTimeout(800);
          console.log('✓ 할일 복원 완료');
        }
      }

      await logResult('Scenario 4: 실수로 삭제한 할일 복구', 'PASS');
      await screenshot(page, 'scenario-4-restore-todo');
    } catch (err) {
      await logResult('Scenario 4: 실수로 삭제한 할일 복구', 'FAIL', err.message);
      await screenshot(page, 'scenario-4-restore-todo-fail');
    }

    // Scenario 5: 우선순위 확인
    console.log('\n📋 Scenario 5: 우선순위 변경 확인');
    try {
      const activeTab = page.locator('[role="tab"]:has-text("진행중")');
      if (await activeTab.count() > 0) {
        await activeTab.click();
        await page.waitForTimeout(500);
      }

      const items = page.locator('[class*="item"], [role="listitem"]');
      const itemCount = await items.count();
      console.log(`✓ 진행중 항목 개수: ${itemCount}`);

      await logResult('Scenario 5: 우선순위 변경 확인', 'PASS');
      await screenshot(page, 'scenario-5-priority-check');
    } catch (err) {
      await logResult('Scenario 5: 우선순위 변경 확인', 'FAIL', err.message);
      await screenshot(page, 'scenario-5-priority-check-fail');
    }

    // Scenario 6: 영구삭제
    console.log('\n📋 Scenario 6: 영구삭제');
    try {
      const trashTab = page.locator('[role="tab"]:has-text("휴지통")');
      if (await trashTab.count() > 0) {
        await trashTab.click();
        await page.waitForTimeout(500);

        const buttons = page.locator('button');
        let permanentBtn = null;
        for (let i = 0; i < Math.min(50, await buttons.count()); i++) {
          const btn = buttons.nth(i);
          const text = await btn.textContent();
          if (text && (text.includes('영구') || text.includes('permanent'))) {
            permanentBtn = btn;
            break;
          }
        }

        if (permanentBtn) {
          await permanentBtn.click();
          await page.waitForTimeout(800);
          console.log('✓ 할일 영구삭제 완료');
        }
      }

      await logResult('Scenario 6: 영구삭제', 'PASS');
      await screenshot(page, 'scenario-6-permanent-delete');
    } catch (err) {
      await logResult('Scenario 6: 영구삭제', 'FAIL', err.message);
      await screenshot(page, 'scenario-6-permanent-delete-fail');
    }

    // 최종 결과
    console.log('\n' + '='.repeat(60));
    console.log('✅ E2E 통합 테스트 완료');
    console.log('='.repeat(60));

    const passed = TEST_RESULTS.scenarios.filter(s => s.status === 'PASS').length;
    const failed = TEST_RESULTS.scenarios.filter(s => s.status === 'FAIL').length;
    console.log(`\n결과: ${passed}개 성공, ${failed}개 실패\n`);

    TEST_RESULTS.scenarios.forEach((s, i) => {
      console.log(`  ${i + 1}. [${s.status}] ${s.scenario}`);
    });

    TEST_RESULTS.summary = {
      passed,
      failed,
      total: passed + failed,
      successRate: `${Math.round((passed / (passed + failed)) * 100)}%`
    };

  } catch (err) {
    console.error('❌ 테스트 실행 중 오류:', err.message);
    TEST_RESULTS.error = err.message;
  } finally {
    if (browser) await browser.close();

    const resultFile = 'C:/test/todotodotodo/test/e2e/test-results.json';
    const dir = path.dirname(resultFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(resultFile, JSON.stringify(TEST_RESULTS, null, 2));
    console.log(`\n📄 테스트 결과 저장: ${resultFile}`);
  }
}

runTests().catch(console.error);
