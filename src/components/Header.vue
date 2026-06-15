<template>
  <div class="top-bar">
    <h1>Sunshine</h1>

    <!-- Навигация (показываем не на всех страницах) -->
    <div class="nav-tabs" v-if="showNavigation">
      <router-link
        v-for="link in navLinks"
        :key="link.to"
        :to="link.to"
        class="nav-link"
        :class="{ active: $route.path === link.to }"
      >
        {{ link.label }}
      </router-link>
    </div>

    <!-- Правая часть с пользователем -->
    <div class="profile-section">
      <div class="user-details">
        <span class="user-name">{{ userName }}</span>
        <span class="user-role">{{ userRole }}</span>
      </div>
      <button v-if="showLogout" @click="handleLogout" class="logout-btn">Выйти</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const props = defineProps({
  // Показывать навигацию
  showNavigation: {
    type: Boolean,
    default: true
  },
  // Показывать кнопку выхода
  showLogout: {
    type: Boolean,
    default: true
  },
  // Кастомные ссылки для навигации (если нужно переопределить)
  customNavLinks: {
    type: Array,
    default: null
  }
})

const route = useRoute()
const authStore = useAuthStore()

// ==================== КОНСТАНТЫ ====================
const ROLES_MAP = {
  'administrator': 'Администратор',
  'florist': 'Флорист',
  'seller': 'Продавец',
  'seller - florist': 'Продавец-флорист'
}

const DEFAULT_NAV_LINKS = [
  { to: '/dashboard', label: 'Главная' },
  { to: '/warehouse', label: 'Склад' },
  { to: '/customers', label: 'Клиенты' },
  { to: '/orders', label: 'Заказы' },
  { to: '/analytics', label: 'Аналитика' }
]

// ==================== COMPUTED ====================
const navLinks = computed(() => {
  return props.customNavLinks || DEFAULT_NAV_LINKS
})

const userName = computed(() => {
  return authStore.user?.email?.split('@')[0] || 'Сотрудник'
})

const userRole = computed(() => {
  const role = authStore.user?.role
  return ROLES_MAP[role] || role || 'Сотрудник'
})

// ==================== МЕТОДЫ ====================
const handleLogout = async () => {
  await authStore.logout()
  // Редирект на логин нужно делать в родительском компоненте или через event
  window.location.href = '/login'
}
</script>

<style scoped>
/* Все стили шапки из оригинальных компонентов */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f9cffd;
}

.top-bar h1 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 700;
  color: #f9cffd;
  letter-spacing: -0.5px;
}

.nav-tabs {
  display: flex;
  gap: 0.5rem;
  background: #f5f5f7;
  padding: 0.3rem;
  border-radius: 60px;
}

.nav-link {
  padding: 0.6rem 1.5rem;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;
  color: #4a5b4e;
  border-radius: 40px;
  transition: all 0.3s ease;
  font-family: 'Inter', sans-serif;
}

.nav-link:hover {
  background: linear-gradient(135deg, #d9eb61 0%, #f9cffd 100%);
  color: #2c3e2f;
  transform: translateY(-2px);
}

.nav-link.active {
  background: linear-gradient(135deg, #d9eb61 0%, #f9cffd 100%);
  color: #2c3e2f;
}

.profile-section {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.user-details {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.2rem;
}

.user-name {
  font-weight: 700;
  font-size: 0.9rem;
  color: #2c3e2f;
  background: #f9cffd30;
  padding: 4px 12px;
  border-radius: 20px;
}

.user-role {
  font-weight: 600;
  font-size: 0.8rem;
  color: #000000;
}

.logout-btn {
  padding: 0.5rem 1.2rem;
  background: #d9eb61;
  text-decoration: none;
  border-radius: 40px;
  font-weight: 600;
  font-size: 0.85rem;
  font-family: 'Inter', sans-serif;
  color: #2c3e2f;
  transition: all 0.3s ease;
  cursor: pointer;
  border: none;
}

.logout-btn:hover {
  background: #c4db3a;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px #d9eb6180;
}

/* Адаптив */
@media (max-width: 768px) {
  .top-bar {
    flex-direction: column;
    gap: 1rem;
  }

  .nav-tabs {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>
