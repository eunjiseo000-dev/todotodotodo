const axios = require('axios');

async function createTestUser() {
  try {
    const response = await axios.post('http://localhost:3000/api/auth/signup', {
      email: 'test@example.com',
      password: 'test123',
      name: '테스트유저'
    });
    console.log('테스트 계정 생성 성공:', response.data);
  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    if (msg.includes('이미 존재')) {
      console.log('테스트 계정이 이미 존재합니다');
    } else {
      console.error('오류:', msg);
    }
  }
}

createTestUser();
