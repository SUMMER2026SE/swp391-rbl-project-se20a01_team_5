export const mockLogin = (username, password) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const lowerUser = username.toLowerCase();
      
      // Giả lập sai mật khẩu
      if (password !== '123456') {
        return reject(new Error('Sai tên đăng nhập hoặc mật khẩu! (Mock: dùng pass 123456)'));
      }

      let computedRole = 'STUDENT';
      if (lowerUser.includes('admin')) computedRole = 'ADMIN';
      else if (lowerUser.includes('phuxe')) computedRole = 'ASSISTANT';
      else if (lowerUser.includes('taixe')) computedRole = 'DRIVER';
      else if (lowerUser.includes('dieuphoi')) computedRole = 'COORDINATOR';

      resolve({
        access_token: `mock_${computedRole.toLowerCase()}_token_123`,
        user: {
          id: 1,
          username: username,
          role: computedRole,
          name: `Người Dùng ${computedRole}`,
        }
      });
    }, 1000); // Fake delay 1s
  });
};

export const mockGoogleLogin = (googleToken) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        access_token: 'mock_google_token_456',
        user: {
          id: 2,
          username: 'google_user',
          role: 'STUDENT',
          name: 'Sinh Viên Google',
        }
      });
    }, 1000);
  });
};

export const mockRegister = (fullName, studentId, email, password) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        access_token: 'mock_student_token_new_user',
        user: {
          id: 99,
          username: studentId,
          role: 'STUDENT',
          name: fullName,
        }
      });
    }, 1000);
  });
};
