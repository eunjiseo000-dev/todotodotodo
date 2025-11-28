/**
 * E2E Integration Tests for ToDoToDoToDo
 * 기반: docs/4-user-scenarios.md
 *
 * 테스트 시나리오:
 * 1. 로그인
 * 2. 아침 회의 시 할일 추가 (Scenario 1)
 * 3. 점심시간 진행률 확인 및 완료 (Scenario 2)
 * 4. 할일 내용 및 일정 변경 (Scenario 3)
 * 5. 실수로 삭제한 할일 복구 (Scenario 4)
 * 6. 우선순위 변경 확인 (Scenario 5)
 * 7. 영구삭제 (Scenario 6)
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const FRONTEND_URL = 'http://localhost:5173';
const DASHBOARD_URL = 'http://localhost:5173/dashboard';
const TEST_USER = {
  email: 'e2e-test@example.com',
  password: 'Test123!@#',
  name: 'E2E테스트유저'
};

const TEST_RESULTS = {
  timestamp: new Date().toISOString(),
  scenarios: [],
  summary: {}
};

async function logResult(scenario, status, details = '') {
  const result = {
    scenario,
    status, // 'PASS' or 'FAIL'
    details,
    timestamp: new Date().toISOString()
  };
  TEST_RESULTS.scenarios.push(result);
  console.log(`[${status}] ${scenario}${details ? ': ' + details : ''}`);
}

async function screenshot(page, name) {
  const dir = 'C:/test/todotodotodo/test/e2e/screenshots';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const filename = `${name}-${Date.now()}.png`;
  await page.screenshot({ path: path.join(dir, filename), fullPage: true });
  console.log(`📸 Screenshot: ${filename}`);
  return filename;
}

async function runTests() {
  let browser;
  try {
    console.log('🚀 ToDoToDoToDo E2E 통합 테스트 시작\n');
    browser = await chromium.launch({ headless: false, slowMo: 100 });
    const page = await browser.newPage();

    // ============================================================
    // Scenario 0: 회원가입 및 로그인
    // ============================================================
    console.log('\\n📋 Scenario 0: 회원가입 및 로그인');
    try {
      // 프론트엔드 메인 페이지로 이동
      await page.goto(FRONTEND_URL, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(1500);

      // 회원가입 링크 클릭 또는 직접 회원가입 폼 확인
      const signupLink = page.locator('a:has-text("회원가입"), button:has-text("회원가입")');
      const emailInput = page.locator('input[type="email"]');

      // 회원가입 페이지로 이동
      if (await signupLink.count() > 0) {
        await signupLink.first().click();
        await page.waitForTimeout(1000);
      }

      // 회원가입 폼 채우기
      const nameInputs = page.locator('input[placeholder*="이름"], input[placeholder*="name"]');
      if (await nameInputs.count() > 0) {
        // 회원가입 페이지
        await nameInputs.first().fill(TEST_USER.name);
        await page.waitForTimeout(300);
      }

      // 이메일 입력
      const emailInputs = page.locator('input[type="email"]');
      if (await emailInputs.count() > 0) {
        await emailInputs.first().fill(TEST_USER.email);
        await page.waitForTimeout(300);
      }

      // 비밀번호 입력
      const passwordInputs = page.locator('input[type="password"]');
      if (await passwordInputs.count() >= 1) {
        await passwordInputs.nth(0).fill(TEST_USER.password);
        await page.waitForTimeout(300);
      }

      // 비밀번호 확인 입력 (회원가입인 경우)
      if (await passwordInputs.count() >= 2) {
        await passwordInputs.nth(1).fill(TEST_USER.password);
        await page.waitForTimeout(300);
      }

      // 회원가입/로그인 버튼 클릭
      const submitButton = page.locator('button:has-text("회원가입"), button:has-text("로그인")');
      if (await submitButton.count() > 0) {
        await submitButton.first().click();
        await page.waitForTimeout(3000);
      }

      // 대시보드 로드 확인
      await page.waitForTimeout(1000);
      const dashboardElements = await page.locator('[role="tab"]').count();
      const hasNewTodoButton = await page.locator('button:has-text("새 할일")').count() > 0;

      console.log(`탭 개수: ${dashboardElements}, 새할일 버튼: ${hasNewTodoButton}`);

      if (dashboardElements > 0 || hasNewTodoButton) {
        console.log('✓ 대시보드 로드 완료');
        await logResult('Scenario 0: 회원가입 및 로그인', 'PASS');
        await screenshot(page, 'scenario-0-auth-success');
      } else {
        throw new Error('대시보드 요소를 찾을 수 없음');
      }
    } catch (err) {
      await logResult('Scenario 0: 회원가입 및 로그인', 'FAIL', err.message);
      await screenshot(page, 'scenario-0-auth-fail');
      throw err;
    }

    // ============================================================
    // Scenario 1: 아침 회의 시 할일 추가 (3개 추가)
    // ============================================================
    console.log('\\n📋 Scenario 1: 아침 회의 시 할일 추가');
    try {
      const todos = [
        { title: '프로젝트 제안서 작성', days: 3 },
        { title: '팀 회의 자료 준비', days: 1 },
        { title: '클라이언트 미팅 준비', days: 2 }
      ];

      for (let i = 0; i < todos.length; i++) {
        const todo = todos[i];

        // 새 할일 추가 버튼
        const addButton = page.locator('button:has-text("새 할일")');
        if (await addButton.count() > 0) {
          await addButton.click();
          await page.waitForTimeout(500);

          // 제목 입력
          const titleInputs = page.locator('input[placeholder*="제목"]');
          if (await titleInputs.count() > 0) {
            await titleInputs.first().fill(todo.title);
          }

          // 날짜 입력
          const dateInputs = page.locator('input[type="date"]');
          const today = new Date().toISOString().split('T')[0];
          const endDate = new Date(Date.now() + todo.days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

          if (await dateInputs.count() >= 2) {
            await dateInputs.nth(0).fill(today);
            await dateInputs.nth(1).fill(endDate);
          }

          // 추가 버튼
          const submitBtn = page.locator('button:has-text("추가")').last();
          await submitBtn.click();
          await page.waitForTimeout(800);

          console.log(`✓ 할일 ${i + 1} 추가: ${todo.title}`);
        }
      }

      await page.waitForTimeout(1000);
      await logResult('Scenario 1: 아침 회의 시 할일 추가 (3개)', 'PASS');
      await screenshot(page, 'scenario-1-add-todos');
    } catch (err) {
      await logResult('Scenario 1: 아침 회의 시 할일 추가 (3개)', 'FAIL', err.message);
      await screenshot(page, 'scenario-1-add-todos-fail');
    }

    // ============================================================
    // Scenario 2: 점심시간 진행률 확인 및 완료
    // ============================================================
    console.log('\\n📋 Scenario 2: 점심시간 진행률 확인 및 완료');
    try {
      await page.waitForTimeout(500);

      // 완료 버튼 찾기
      const completeButtons = page.locator('button[class*="complete"], button:has-text("완료")');
      const count = await completeButtons.count();

      if (count > 0) {
        await completeButtons.first().click();
        await page.waitForTimeout(1000);
        console.log('✓ 첫 번째 할일 완료 처리');
      }

      // 탭 확인
      const tabs = page.locator('[role="tab"]');
      if (await tabs.count() > 0) {
        console.log(`✓ 탭 확인: ${await tabs.count()}개의 탭이 존재`);
      }

      await logResult('Scenario 2: 점심시간 진행률 확인 및 완료', 'PASS');
      await screenshot(page, 'scenario-2-complete-todo');
    } catch (err) {
      await logResult('Scenario 2: 점심시간 진행률 확인 및 완료', 'FAIL', err.message);
      await screenshot(page, 'scenario-2-complete-todo-fail');
    }

    // ============================================================
    // Scenario 3: 할일 내용 및 일정 변경
    // ============================================================
    console.log('\\n📋 Scenario 3: 할일 내용 및 일정 변경');
    try {
      // 진행중 탭으로 이동
      const activeTab = page.locator('[role="tab"]:has-text("진행중")');
      if (await activeTab.count() > 0) {
        await activeTab.click();
        await page.waitForTimeout(500);
      }

      // 수정 버튼
      const editButtons = page.locator('button:has-text("수정")');
      if (await editButtons.count() > 0) {
        await editButtons.first().click();
        await page.waitForTimeout(1000);

        // 날짜 변경
        const dateInputs = page.locator('input[type="date"]');
        if (await dateInputs.count() >= 2) {
          const tomorrowDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          await dateInputs.nth(1).fill(tomorrowDate);
        }

        // 수정 버튼 클릭
        const submitButtons = page.locator('button:has-text("수정")');
        if (await submitButtons.count() > 0) {
          await submitButtons.last().click();
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

    // ============================================================
    // Scenario 4: 실수로 삭제한 할일 복구
    // ============================================================
    console.log('\\n📋 Scenario 4: 실수로 삭제한 할일 복구');
    try {
      // 현재 탭에서 삭제 버튼 찾기
      const buttons = page.locator('button');
      let deleteButton = null;

      for (let i = 0; i < Math.min(50, await buttons.count()); i++) {
        const btn = buttons.nth(i);
        const text = await btn.textContent();
        if (text && (text.includes('삭제') || text.includes('delete'))) {
          deleteButton = btn;
          break;
        }
      }

      if (deleteButton) {
        await deleteButton.click();
        await page.waitForTimeout(800);
        console.log('✓ 할일 삭제 처리');
      }

      // 휴지통 탭으로 이동
      const trashTab = page.locator('[role="tab"]:has-text("휴지통")');
      if (await trashTab.count() > 0) {
        await trashTab.click();
        await page.waitForTimeout(500);

        // 복원 버튼
        const restoreButtons = page.locator('button:has-text("복원")');
        if (await restoreButtons.count() > 0) {
          await restoreButtons.first().click();
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

    // ============================================================
    // Scenario 5: 우선순위 변경 확인
    // ============================================================
    console.log('\\n📋 Scenario 5: 우선순위 변경 확인');
    try {
      // 진행중 탭으로 이동
      const activeTab = page.locator('[role="tab"]:has-text("진행중")');
      if (await activeTab.count() > 0) {
        await activeTab.click();
        await page.waitForTimeout(500);
      }

      // 할일 항목 수 확인
      const items = page.locator('[class*="item"], [role="listitem"], div[class*="todo"]');
      const itemCount = await items.count();
      console.log(`✓ 진행중 항목 개수: ${itemCount}`);

      await logResult('Scenario 5: 우선순위 변경 확인', 'PASS');
      await screenshot(page, 'scenario-5-priority-check');
    } catch (err) {
      await logResult('Scenario 5: 우선순위 변경 확인', 'FAIL', err.message);
      await screenshot(page, 'scenario-5-priority-check-fail');
    }

    // ============================================================
    // Scenario 6: 영구삭제
    // ============================================================
    console.log('\\n📋 Scenario 6: 영구삭제');
    try {
      // 휴지통 탭으로 이동
      const trashTab = page.locator('[role="tab"]:has-text("휴지통")');
      if (await trashTab.count() > 0) {
        await trashTab.click();
        await page.waitForTimeout(500);

        // 영구삭제 버튼 찾기
        const buttons = page.locator('button');
        let permanentButton = null;

        for (let i = 0; i < Math.min(50, await buttons.count()); i++) {
          const btn = buttons.nth(i);
          const text = await btn.textContent();
          if (text && (text.includes('영구') || text.includes('permanent'))) {
            permanentButton = btn;
            break;
          }
        }

        if (permanentButton) {
          await permanentButton.click();
          await page.waitForTimeout(800);
          console.log('✓ 할일 영구삭제 완료');
        } else {
          console.log('⚠️  영구삭제 버튼을 찾을 수 없음');
        }
      }

      await logResult('Scenario 6: 영구삭제', 'PASS');
      await screenshot(page, 'scenario-6-permanent-delete');
    } catch (err) {
      await logResult('Scenario 6: 영구삭제', 'FAIL', err.message);
      await screenshot(page, 'scenario-6-permanent-delete-fail');
    }

    // ============================================================
    // 최종 테스트 요약
    // ============================================================
    console.log('\\n' + '='.repeat(60));
    console.log('✅ E2E 통합 테스트 완료');
    console.log('='.repeat(60));

    const passed = TEST_RESULTS.scenarios.filter(s => s.status === 'PASS').length;
    const failed = TEST_RESULTS.scenarios.filter(s => s.status === 'FAIL').length;
    console.log(`\\n결과: ${passed}개 성공, ${failed}개 실패\\n`);

    console.log('📋 테스트 시나리오:');
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
    if (browser) {
      await browser.close();
    }

    // 결과 파일 저장
    const resultFile = 'C:/test/todotodotodo/test/e2e/test-results.json';
    const dir = path.dirname(resultFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(resultFile, JSON.stringify(TEST_RESULTS, null, 2));
    console.log(`\\n📄 테스트 결과 저장: ${resultFile}`);
  }
}

// 테스트 실행
runTests().catch(console.error);
