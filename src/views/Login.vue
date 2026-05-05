<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>Цветочный магазин</h1>
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
.login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #e0e0e0;
}

.login-card {
  background: white;
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h1 {
  color: #000000;
  margin-bottom: 8px;
  font-size: 24px;
}

.login-header p {
  color: #666666;
  font-size: 14px;
}

.login-form .form-group {
  margin-bottom: 20px;
}

.login-form label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #000000;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #cccccc;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s;
  color: #000000;
}

.form-input:focus {
  outline: none;
  border-color: #999999;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
}

.login-btn {
  width: 100%;
  padding: 12px;
  background: #e0e0e0;
  color: #000000;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.login-btn:hover {
  background: #cccccc;
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  background: #f0f0f0;
  color: #f44336;
  padding: 10px;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 15px;
  text-align: center;
}
</style>
