<template>
  <div class="analytics-page">
    <Header />

    <!-- Заголовок -->
    <h2 class="section-title">Аналитика и управление</h2>

    <!-- Блоки-квадраты -->
    <div class="modules-grid">
      <!-- Блок сотрудников -->
      <div class="module-card" @click="openEmployeesBlock">
        <div class="card-icon"></div>
        <h3>Сотрудники</h3>
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
        <h3>Расписание</h3>
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
        <h3>Отчеты</h3>
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
import Header from '../components/Header.vue'

const router = useRouter()
const authStore = useAuthStore()

// КОНСТАНТЫ
const ROLES_MAP = {
  'administrator': 'Администратор',
  'florist': 'Флорист',
  'seller': 'Продавец',
  'seller - florist': 'Продавец-флорист'
}

const ROUTES = {
  DASHBOARD: '/dashboard',
  WAREHOUSE: '/warehouse',
  CUSTOMERS: '/customers',
  ORDERS: '/orders'
}

// СОСТОЯНИЕ
const showEmployees = ref(false)
const showSchedule = ref(false)
const showReports = ref(false)




// Навигация
const goToDashboard = () => router.push(ROUTES.DASHBOARD)
const goToWarehouse = () => router.push(ROUTES.WAREHOUSE)
const goToCustomers = () => router.push(ROUTES.CUSTOMERS)
const goToOrders = () => router.push(ROUTES.ORDERS)

// Открытие компонентов (упрощенно)
const openEmployeesBlock = () => { showEmployees.value = true }
const openScheduleBlock = () => { showSchedule.value = true }
const openReportsBlock = () => { showReports.value = true }
</script>


<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700&display=swap');

.analytics-page {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  font-family: 'Inter', sans-serif;
  background-color: #ffffff;
  min-height: 100vh;
}



.top-bar h1 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 700;
  color: #f9cffd;
  letter-spacing: -0.5px;
}



/* Заголовок раздела */
.section-title {
  text-align: center;
  font-size: 2rem;
  font-weight: 700;
  color: #f9cffd;
  margin: 0 0 2rem 0;
  letter-spacing: -0.5px;
}

/* Сетка карточек */
.modules-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  max-width: 1000px;
  margin: 0 auto;
}

/* Карточка */
.module-card {
  background: #ffffff;
  border-radius: 28px;
  padding: 1.8rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  box-shadow: 0 8px 18px rgba(119, 183, 211, 0.08);
  border: 1px solid #f5f5f7;
  position: relative;
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

/* При наведении текст остается темным */
.module-card:hover h3 {
  color: #2c3e2f;
}

.module-card:hover .features p {
  color: #2c3e2f;
}

.card-icon {
  display: none;
}

.module-card h3 {
  margin-bottom: 1rem;
  font-size: 1.3rem;
  font-weight: 700;
  color: #2c3e2f;
  letter-spacing: 0.5px;
}

.features {
  margin: 1.2rem 0;
}

.features p {
  margin: 0.5rem 0;
  color: #4a5b4e;
  font-size: 0.85rem;
  text-align: left;
  padding-left: 1rem;
  transition: color 0.3s ease;
}

/* Кнопка внутри карточки */
.card-btn {
  margin-top: 1rem;
  padding: 0.6rem 1.5rem;
  background: #ffffff;
  border: 2px solid #d9eb61;
  border-radius: 40px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  color: #2c3e2f;
  transition: all 0.3s ease;
}

.card-btn:hover {
  background: #c4db3a;
  transform: scale(1.02);
  box-shadow: 0 2px 8px rgba(217, 235, 97, 0.3);
}

.module-card:hover .card-btn {
  background: #ffffff;
  border-color: #c4db3a;
}

/* Адаптив */
@media (max-width: 900px) {
  .modules-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }
}

@media (max-width: 768px) {
  .top-bar {
    flex-direction: column;
    gap: 1rem;
  }

  .nav-tabs {
    flex-wrap: wrap;
    justify-content: center;
  }

  .modules-grid {
    grid-template-columns: 1fr;
  }
}
</style>
