<template>
  <div class="analytics-page">
    <!-- Верхняя панель -->
    <div class="top-bar">
      <h1>Цветочный магазин</h1>
      <div class="profile-section">
        <div class="user-details">
          <span class="user-name">{{ authStore.user?.email?.split('@')[0] || 'Сотрудник' }}</span>
          <span class="user-role">{{ getRoleName() }}</span>
        </div>
        <button @click="goToDashboard" class="logout-btn">Выход</button>
      </div>
    </div>

    <!-- Навигация -->
    <div class="nav-tabs">
      <button @click="goToWarehouse">Склад</button>
      <button @click="goToCustomers">Клиенты</button>
      <button @click="goToOrders">Заказы</button>
      <button class="active">Аналитика</button>
    </div>

    <!-- Заголовок -->
    <h2 class="section-title">Аналитика и управление</h2>

    <!-- Блоки-квадраты -->
    <div class="modules-grid">
      <!-- Блок сотрудников -->
      <div class="module-card" @click="openEmployeesBlock">
        <div class="card-icon"></div>
        <h3>СОТРУДНИКИ</h3>
        <div class="features">
          <p>Список сотрудников</p>
          <p>Добавление</p>
          <p>Редактирование</p>
          <p>Удаление</p>
        </div>
        <button class="card-btn">Управление</button>
      </div>

      <!-- Блок расписания -->
      <div class="module-card" @click="openScheduleBlock">
        <div class="card-icon"></div>
        <h3>РАСПИСАНИЕ</h3>
        <div class="features">
          <p>Смены по дням</p>
          <p>Назначение сотрудников</p>
          <p>Замены</p>
        </div>
        <button class="card-btn">Управление</button>
      </div>

      <!-- Блок отчетов -->
      <div class="module-card" @click="openReportsBlock">
        <div class="card-icon"></div>
        <h3>ОТЧЕТЫ</h3>
        <div class="features">
          <p>По продажам</p>
          <p>По заказам</p>
          <p>По клиентам</p>
        </div>
        <button class="card-btn">Формирование</button>
      </div>
    </div>

    <!-- Модальные окна с компонентами -->
    <EmployeesBlock v-if="showEmployees" @close="showEmployees = false" />
    <ScheduleBlock v-if="showSchedule" @close="showSchedule = false" />
    <ReportsBlock v-if="showReports" @close="showReports = false" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import EmployeesBlock from '../components/analytics/EmployeesBlock.vue'
import ScheduleBlock from '../components/analytics/ScheduleBlock.vue'
import ReportsBlock from '../components/analytics/ReportsBlock.vue'
import { useAuthStore } from '@/stores/authStore.js'


const router = useRouter()

// Состояния для отображения компонентов
const showEmployees = ref(false)
const showSchedule = ref(false)
const showReports = ref(false)

const authStore = useAuthStore()

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


// Навигация
const goToDashboard = () => {
  router.push('/dashboard')
}

const goToWarehouse = () => {
  router.push('/warehouse')
}

const goToCustomers = () => {
  router.push('/customers')
}

const goToOrders = () => {
  router.push('/orders')
}

// Открытие компонентов
const openEmployeesBlock = () => {
  showEmployees.value = true
}

const openScheduleBlock = () => {
  showSchedule.value = true
}

const openReportsBlock = () => {
  showReports.value = true
}


</script>

<style scoped>
.analytics-page {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e0e0e0;
}

.top-bar h1 {
  margin: 0;
  color: #000000;
}

.profile-section {
  display: flex;
  gap: 20px;
  align-items: center;
}

.profile {
  font-weight: bold;
  color: #000000;
}

.logout-btn {
  display: inline-block;
  padding: 6px 16px;
  background-color: #e0e0e0;
  color: #000000;
  text-decoration: none;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.3s;
  cursor: pointer;
  border: none;
}

.logout-btn:hover {
  background-color: #cccccc;
  transform: scale(1.05);
}

.nav-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 10px;
}

.nav-tabs button {
  padding: 10px 20px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  color: #000000;
}

.nav-tabs button.active {
  color: #000000;
  border-bottom: 2px solid #000000;
}

.section-title {
  margin-bottom: 30px;
  color: #000000;
  font-size: 24px;
  text-align: center;
}

.modules-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  max-width: 1000px;
  margin: 0 auto;
}

.module-card {
  background: #f0f0f0;
  border-radius: 16px;
  padding: 1.5rem;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.module-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.card-icon {
  display: none;
}

.module-card h3 {
  margin-bottom: 1rem;
  color: #000000;
  font-size: 18px;
}

.features {
  margin: 1rem 0;
}

.features p {
  margin: 8px 0;
  color: #000000;
  font-size: 14px;
  text-align: left;
  padding-left: 10px;
}

.card-btn {
  margin-top: 15px;
  padding: 8px 16px;
  background-color: #e0e0e0;
  color: #000000;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.card-btn:hover {
  background-color: #cccccc;
  transform: scale(1.05);
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

@media (max-width: 800px) {
  .modules-grid {
    grid-template-columns: 1fr;
  }
}
</style>
