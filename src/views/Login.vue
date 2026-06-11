<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>Sunshine</h1>
        <p>Вход в систему</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label>Email</label>
          <input
            v-model="email"
            type="email"
            class="form-input"
            placeholder="example@mail.ru"
            required
            autocomplete="email"
          >
        </div>

        <div class="form-group">
          <label>Пароль</label>
          <input
            v-model="password"
            type="password"
            class="form-input"
            placeholder="......"
            required
            autocomplete="current-password"
          >
        </div>

        <div v-if="authStore.errorMessage" class="error-message">
          {{ authStore.errorMessage }}
        </div>

        <button type="submit" class="login-btn" :disabled="authStore.loading">
          {{ authStore.loading ? 'Вход...' : 'Войти' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')

const handleLogin = async () => {
  const success = await authStore.login(email.value, password.value)
  if (success) {
    router.push('/dashboard')
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700&display=swap');

.login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #ffffff;
  font-family: 'Inter', sans-serif;
}

.login-card {
  background: #ffffff;
  border-radius: 28px;
  padding: 48px 40px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 40px rgba(249, 207, 253, 0.15), 0 8px 18px rgba(0, 0, 0, 0.05);
  border: 1px solid #f5f5f7;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-header h1 {
  color: #e07bc4;
  margin-bottom: 10px;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.login-header p {
  color: #4a5b4e;
  font-size: 15px;
  font-weight: 400;
}

.login-form .form-group {
  margin-bottom: 24px;
}

.login-form label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  font-size: 14px;
  color: #2c3e2f;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #f5f5f7;
  border-radius: 40px;
  font-size: 14px;
  font-family: 'Inter', sans-serif;
  transition: all 0.3s ease;
  color: #2c3e2f;
  background: #ffffff;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #d9eb61;
  box-shadow: 0 0 0 3px #d9eb6140;
}

.form-input::placeholder {
  color: #cccccc;
}

.login-btn {
  width: 100%;
  padding: 14px;
  background: #d9eb61;
  color: #2c3e2f;
  border: none;
  border-radius: 40px;
  font-size: 16px;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 8px;
  box-shadow: 0 2px 8px rgba(217, 235, 97, 0.3);
}

.login-btn:hover {
  background: #c4db3a;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(217, 235, 97, 0.4);
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.error-message {
  background: #fef2f0;
  color: #e85d4a;
  padding: 12px 16px;
  border-radius: 40px;
  font-size: 13px;
  margin-bottom: 20px;
  text-align: center;
  font-weight: 500;

}
</style>
