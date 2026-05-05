<template>
  <div class="dashboard">
    <div class="top-bar">
      <h1>Цветочный магазин</h1>
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
        <h3>Складской учет (ERP)</h3>
        <p>Управление товарами и контроль остатков на складе</p>
      </div>

      <div class="module-card" @click="goToCustomers">
        <div class="card-icon"></div>
        <h3>Клиенты (CRM)</h3>
        <p>Ведение базы клиентов и истории взаимодействия</p>
      </div>

      <div class="module-card" @click="goToOrders">
        <div class="card-icon"></div>
        <h3>Управление заказами</h3>
        <p>Создание, отслеживание и контроль выполнения заказов</p>
      </div>

      <div class="module-card" @click="goToAnalytics">
        <div class="card-icon"></div>
        <h3>Аналитика</h3>
        <p>Отчеты и визуализация показателей</p>
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
.dashboard {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.top-bar h1 {
  margin: 0;
  color: #000000;
  font-size: 1.8rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.user-details {
  display: flex;
  align-items: flex-end;
  gap: 0.25rem;
}

.user-name {
  font-weight: 600;
  color: #000000;

}

.user-role {
  font-weight: 600;
  color: #000000;
}

.logout-btn {
  padding: 0.5rem 1rem;
  background: #e0e0e0;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.3s;
  color: #000000;
}

.logout-btn:hover {
  background: #cccccc;
  transform: scale(1.05);
}

.welcome {
  text-align: center;
  margin-bottom: 2rem;
}

.welcome h2 {
  color: #000000;
  font-size: 1.5rem;
}

.modules-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.module-card {
  background: #f0f0f0;
  border-radius: 12px;
  padding: 2rem;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.module-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  background: #e0e0e0;
}

.card-icon {
  display: none;
}

h3 {
  margin-bottom: 0.5rem;
  color: #000000;
}

p {
  color: #666666;
  font-size: 0.9rem;
}
</style>
