<template>
  <div class="dashboard">
    <div class="top-bar">
      <h1>Sunshine</h1>
      <div class="user-info">
        <div class="user-details">
          <span class="user-name">{{ authStore.user?.email?.split('@')[0] || 'Сотрудник' }}</span>
          <span class="user-role">{{ getRoleName() }}</span>
        </div>
        <button @click="handleLogout" class="logout-btn">Выйти</button>
      </div>
    </div>

    <!-- Компонент управления сменой -->
    <ShiftControl
      :active-shift="activeShift"
      @shift-opened="onShiftChanged"
      @shift-closed="onShiftChanged"
    />

    <div class="modules-grid">
      <div class="module-card" @click="goToWarehouse">
        <div class="card-icon"></div>
        <h3>Складской учет</h3>
        <p>Управление товарами и контроль остатков на складе</p>
      </div>

      <div class="module-card" @click="goToCustomers">
        <div class="card-icon"></div>
        <h3>Клиенты</h3>
        <p>Ведение базы клиентов</p>
      </div>

      <div class="module-card" @click="goToOrders">
        <div class="card-icon"></div>
        <h3>Управление заказами</h3>
        <p>Создание, отслеживание и контроль выполнения заказов</p>
      </div>

      <div class="module-card" @click="goToAnalytics">
        <div class="card-icon"></div>
        <h3>Аналитика и управление</h3>
        <p>Управление сотрудниками и визуализация показателей</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { useDataStore } from '../stores/dataStore'
import ShiftControl from '../components/ShiftControl.vue'

const router = useRouter()
const authStore = useAuthStore()
const dataStore = useDataStore()
const activeShift = ref(null)

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

const goToWarehouse = () => router.push('/warehouse')
const goToCustomers = () => router.push('/customers')
const goToOrders = () => router.push('/orders')
const goToAnalytics = () => router.push('/analytics')

const getRoleName = () => {
  const role = authStore.user?.role
  const roles = {
    'administrator': 'Администратор',
    'florist': 'Флорист',
    'seller': 'Продавец',
    'seller - florist': 'Продавец-флорист'
  }
  return roles[role] || role || 'Сотрудник'
}

// Загрузка активной смены
const loadActiveShift = async () => {
  try {
    await dataStore.get_workshifts()

    const now = new Date()
    const today = now.toISOString().split('T')[0]

    // Ищем активную смену для текущего пользователя
    const active = dataStore.workshifts?.find(shift => {
      const shiftDate = shift.date ? shift.date.split('T')[0] : null
      return shift.user_id === authStore.user?.id &&
        shiftDate === today &&
        !shift.end_time
    })

    activeShift.value = active || null
  } catch (error) {
    console.error('Ошибка загрузки смен:', error)
    activeShift.value = null
  }

}

// Обновление после изменения смены
const onShiftChanged = () => {
  loadActiveShift()
}

onMounted(() => {
  loadActiveShift()
})
</script>

<style scoped>
/* Глобальный шрифт */
@import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700&display=swap');

.dashboard {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 100vh;
  font-family: 'Inter', sans-serif;
}

/* Фон на весь экран (через глобальный стиль) */
:global(body) {
  background-color: #ffffff !important;
  margin: 0;
  padding: 0;
  font-family: 'Inter', sans-serif;
}

:global(.floating-flower) {
  user-select: none;
  transition: opacity 0.3s ease, transform 0.3s ease;
  will-change: transform, opacity;
  pointer-events: none;
}

/* Верхняя панель */
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
  font-size: 2rem;
  font-weight: 700;
  color: #f9cffd; /* розовый из основных цветов */
  letter-spacing: -0.5px;
}

/* Блок с пользователем и кнопкой — увеличили расстояние */
.user-info {
  display: flex;
  align-items: center;
  gap: 2rem; /* было 1.5rem — увеличили */
}

.user-details {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.2rem;
}

.user-name {
  font-weight: 700;
  font-size: 0.95rem;
  color: #2c3e2f;
  background: #f9cffd30;
  padding: 4px 12px;
  border-radius: 20px;
}

.user-role {
  font-weight: 600;
  font-size: 1rem;
  color: #000000;
}

.logout-btn {
  padding: 0.5rem 1.2rem;
  background: #d9eb61;
  border: none;
  border-radius: 40px;
  cursor: pointer;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  color: #2c3e2f;
  transition: all 0.3s ease;
}

.logout-btn:hover {
  background: #c4db3a;
  transform: scale(1.02);
  box-shadow: 0 2px 8px #d9eb6180;
}

/* Сетка модулей */
.modules-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  max-width: 800px;
  margin: 2rem auto;
}

/* Карточка */
.module-card {
  background: #ffffff;
  border-radius: 28px;
  padding: 2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  box-shadow: 0 8px 18px rgba(119, 183, 211, 0.08);
  border: 1px solid #f5f5f7;
  position: relative;
  overflow: visible;
  z-index: 1;
}

/* Зеленая подсветка всегда */
.module-card {
  box-shadow: 0 0 0 2px #d9eb61, 0 8px 18px rgba(119, 183, 211, 0.08);
}

/* При наведении - полностью зеленый фон */
.module-card:hover {
  background: #d9eb61;
  transform: translateY(-5px);
  box-shadow: 0 0 0 3px #c4db3a, 0 20px 30px -12px rgba(217, 235, 97, 0.5);
  border-color: #c4db3a;
}

/* При наведении текст не меняет цвет (остается темным) */
.module-card:hover h3 {
  color: #2c3e2f;
}

.module-card:hover p {
  color: #2c3e2f;
}

/* Заголовки и текст */
h3 {
  margin-bottom: 0.75rem;
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e2f;
}

p {
  color: #4a5b4e;
  font-size: 0.95rem;
  line-height: 1.4;
  font-weight: 400;
}

.card-icon {
  display: none;
}
</style>
