<template>
  <div class="orders-page">
    <!-- Верхняя панель с навигацией -->
    <div class="top-bar">
      <h1>Sunshine</h1>
      <div class="nav-tabs">
        <router-link to="/dashboard" class="nav-link">Главная</router-link>
        <router-link to="/warehouse" class="nav-link">Склад</router-link>
        <router-link to="/customers" class="nav-link">Клиенты</router-link>
        <router-link to="/orders" class="nav-link active">Заказы</router-link>
        <router-link to="/analytics" class="nav-link">Аналитика</router-link>
      </div>
      <div class="profile-section">
        <div class="user-details">
          <span class="user-name">{{ authStore.user?.email?.split('@')[0] || 'Сотрудник' }}</span>
          <span class="user-role">{{ getRoleName() }}</span>
        </div>
<!--        <router-link to="/dashboard" class="logout-btn">Выйти</router-link>-->
      </div>
    </div>

    <h2 class="section-title">Управление заказами</h2>

    <!-- Кнопки действий -->
    <div class="action-buttons">
      <button @click="openOrderModal" class="btn-action"> Новый заказ</button>
      <button @click="openSaleModal" class="btn-action">Продажа сейчас</button>
    </div>

    <!-- Календарь дней -->
    <div class="calendar-bar">
      <input
        type="date"
        v-model="selectedDate"
        @change="selectDate(selectedDate)"
        class="date-picker-input"
      />
    </div>

    <!-- Канбан-доска -->
    <div class="kanban-board">
      <!-- Колонка 1: Новые заказы -->
      <div class="kanban-column new-column">
        <div class="column-header new-header">
          <span class="column-title">НОВЫЕ ЗАКАЗЫ</span>
          <span class="column-subtitle">(созданы в этот день)</span>
        </div>
        <div class="column-content">
          <template v-if="urgentOrders.length > 0">
            <div class="section-label urgent"> СРОЧНЫЕ (сегодня):</div>
            <OrderCard
              v-for="order in urgentOrders"
              :key="order.id"
              :order="order"
              type="urgent"
              @status-change="updateOrderStatus"
              @view-details="viewOrderDetails"
            />
          </template>

          <template v-if="plannedOrders.length > 0">
            <div class="section-label planned">ПЛАНОВЫЕ (на другую дату):</div>
            <OrderCard
              v-for="order in plannedOrders"
              :key="order.id"
              :order="order"
              type="planned"
              @status-change="updateOrderStatus"
              @view-details="viewOrderDetails"
            />
          </template>

          <button @click="openOrderModal" class="add-order-btn">
            + Создать заказ
          </button>
        </div>
      </div>

      <!-- Колонка 2: К сборке -->
      <div class="kanban-column assembly-column">
        <div class="column-header assembly-header">
          <span class="column-title"> К СБОРКЕ</span>
          <span class="column-subtitle">(собрать сегодня)</span>
        </div>
        <div class="column-content">
          <OrderCard
            v-for="order in assemblyOrders"
            :key="order.id"
            :order="order"
            type="assembly"
            @status-change="updateOrderStatus"
            @go-back="goBackOrder"
            @view-details="viewOrderDetails"
          />
        </div>
      </div>

      <!-- Колонка 3: Готовые -->
      <div class="kanban-column ready-column">
        <div class="column-header ready-header">
          <span class="column-title">ГОТОВЫЕ</span>
          <span class="column-subtitle">(ждут выдачи)</span>
        </div>
        <div class="column-content">
          <OrderCard
            v-for="order in readyOrders"
            :key="order.id"
            :order="order"
            type="ready"
            @status-change="updateOrderStatus"
            @complete-order="completeOrder"
            @go-back="goBackOrder"
            @view-details="viewOrderDetails"
          />
        </div>
      </div>

      <!-- Колонка 4: Завершенные -->
      <div class="kanban-column completed-column">
        <div class="column-header completed-header">
          <span class="column-title"> ЗАВЕРШЕННЫЕ</span>
          <span class="column-subtitle">(выданы/доставлены)</span>
        </div>
        <div class="column-content">
          <OrderCard
            v-for="order in completedOrders"
            :key="order.id"
            :order="order"
            type="completed"
            @go-back="goBackOrder"
            @view-details="viewOrderDetails"
          />
        </div>
      </div>
    </div>

    <!-- Модальные окна (без изменений) -->
    <CreateOrderModal
      :show="showCreateOrderModal"
      :clients="dataStore.clients"
      :flowers="dataStore.flowers"
      :bouquets="dataStore.bouquets"
      :materials="dataStore.materials"
      :users="dataStore.users"
      :selected-date="selectedDate"
      @close="showCreateOrderModal = false"
      @save="handleCreateOrder"
    />

    <SaleModal
      :show="showSaleModal"
      :clients="dataStore.clients"
      :flowers="dataStore.flowers"
      :bouquets="dataStore.bouquets"
      :materials="dataStore.materials"
      :users="dataStore.users"
      @close="showSaleModal = false"
      @save="handleSale"
    />

    <InfaOrderModal
      :show="showDetailsModal"
      :order="selectedOrder"
      @close="closeDetailsModal"
      @status-change="updateOrderStatus"
      @complete-order="completeOrderFromModal"
    />

    <!-- Сообщение об ошибке -->
    <div v-if="dataStore.errorMessage" class="error-message">
      {{ dataStore.errorMessage }}
      <button @click="dataStore.errorMessage = ''">✕</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDataStore } from '../stores/dataStore'
import OrderCard from '../components/orders/OrderCard.vue'
import CreateOrderModal from '../components/orders/CreateOrderModal.vue'
import SaleModal from '../components/orders/SaleModal.vue'
import InfaOrderModal from '../components/orders/InfaOrderModal.vue'
import { useAuthStore } from '@/stores/authStore.js'

const router = useRouter()
const dataStore = useDataStore()

// Состояние
const activeNav = ref('orders')
const selectedDate = ref('')
const showCreateOrderModal = ref(false)
const showSaleModal = ref(false)
const showDetailsModal = ref(false)
const selectedOrder = ref(null)

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
const goToWarehouse = () => router.push('/warehouse')
const goToClients = () => router.push('/customers')
const goToAnalytics = () => router.push('/analytics')


// Генерация дней на 30 дней вперед
const weekDays = computed(() => {
  const days = []
  const today = new Date()

  for (let i = 0; i < 30; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)

    const weekday = date.toLocaleDateString('ru-RU', { weekday: 'short' }).replace(',', '')
    const day = date.getDate()
    const month = date.getMonth() + 1
    const year = date.getFullYear()

    days.push({
      fullDate: date.toISOString().split('T')[0],  // ← полная дата для сравнения
      displayDate: `${day}.${month}`,              // ← для отображения
      weekday: weekday,
      year: year,
      month: month,
      day: day
    })
  }
  return days
})

// // Заказы для выбранной даты (по дате доставки ИЛИ по дате создания)
// const ordersForSelectedDate = computed(() => {
//   return dataStore.orders.filter(order => {
//     let deliveryDate = null
//     if (order.delivery_date) {
//       deliveryDate = order.delivery_date.split('T')[0]
//     }
//     return deliveryDate === selectedDate.value
//   })
// })

const ordersForSelectedDate = computed(() => {
  const filtered = dataStore.orders.filter(order => {
    let deliveryDate = null
    if (order.delivery_date) {
      deliveryDate = order.delivery_date.split('T')[0]
    }

    return deliveryDate === selectedDate.value
  })

  return filtered
})



// Срочные заказы (доставка сегодня)
// const urgentOrders = computed(() => {
//   const today = new Date().toISOString().split('T')[0]
//   console.log('Сегодня:', today)
//   return ordersForSelectedDate.value.filter(order =>
//     order.status === 'new' &&
//     (!order.delivery_date || order.delivery_date === today)
//   )
//
// })

const urgentOrders = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  const filtered = ordersForSelectedDate.value.filter(order => {
    const deliveryDate = order.delivery_date?.split('T')[0]
    const isUrgent = order.status === 'new' && (!order.delivery_date || deliveryDate === today)

    return isUrgent
  })

  return filtered
})

// Плановые заказы (доставка не сегодня)
// const plannedOrders = computed(() => {
//   const today = new Date().toISOString().split('T')[0]
//   return ordersForSelectedDate.value.filter(order =>
//     order.status === 'new' &&
//     order.delivery_date &&
//     order.delivery_date !== today
//   )
// })
const plannedOrders = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return ordersForSelectedDate.value.filter(order => {
    const deliveryDate = order.delivery_date?.split('T')[0]
    return order.status === 'new' && deliveryDate && deliveryDate !== today
  })
})

// Заказы к сборке
const assemblyOrders = computed(() => {
  return dataStore.orders.filter(order => order.status === 'assembly')
})

// Готовые заказы
const readyOrders = computed(() => {
  return dataStore.orders.filter(order =>
    order.status === 'ready'
  )
})


// Завершенные заказы (за выбранную дату И предыдущие)
// const completedOrders = computed(() => {
//   // Преобразуем выбранную дату в объект Date для сравнения
//   const selected = new Date(selectedDate.value)
//   selected.setHours(0, 0, 0, 0)
//
//   return dataStore.orders.filter(order => {
//     if (order.status !== 'completed') return false
//
//     // Получаем дату завершения заказа
//     let completedDate = null
//     if (order.updated_at) {
//       completedDate = new Date(order.updated_at)
//       completedDate.setHours(0, 0, 0, 0)
//     }
//
//     // Показываем заказы, завершенные в выбранную дату ИЛИ ранее
//     return completedDate && completedDate <= selected
//   })
// })

// Завершенные заказы (за выбранную дату)
const completedOrders = computed(() => {
  return dataStore.orders.filter(order => {
    if (order.status !== 'completed') return false

    // Получаем дату завершения
    const completedDate = order.updated_at?.split('T')[0]

    // Для продаж (sale) - по дате создания (created_at)
    if (order.type === 'sale') {
      const createdDate = order.created_at?.split('T')[0]
      return createdDate === selectedDate.value
    }

    // Для заказов (order) - по дате завершения (updated_at)
    return completedDate === selectedDate.value
  })
})

// Завершить заказ (списать товары)
const completeOrder = async (orderId) => {
  if (confirm('Выдать заказ? Товары будут списаны со склада')) {
    try {
      await dataStore.complete_order(orderId)
      await loadOrdersForDate()
      alert('Заказ выдан, товары списаны со склада')
    } catch (error) {
      console.error('Ошибка:', error)
      alert(error.response?.data?.message || 'Ошибка при списании товаров')
    }
  }
}

// Завершить заказ из модального окна
const completeOrderFromModal = async (orderId) => {
  if (confirm('Выдать заказ? Товары будут списаны со склада')) {
    try {
      await dataStore.complete_order(orderId)
      await loadOrdersForDate()
      closeDetailsModal()
      alert('Заказ выдан, товары списаны со склада')
    } catch (error) {
      console.error('Ошибка:', error)
      alert(error.response?.data?.message || 'Ошибка при списании товаров')
    }
  }
}

// Выбрать дату
const selectDate = (date) => {
  selectedDate.value = date
  loadOrdersForDate()
}


// Загрузка заказов для даты
const loadOrdersForDate = async () => {
  await dataStore.get_orders()
}

// Открыть модалки
const openOrderModal = () => {
  showCreateOrderModal.value = true
}

const openSaleModal = () => {
  showSaleModal.value = true
}

// Обработка создания заказа
const handleCreateOrder = async (orderData) => {
  try {
    await dataStore.create_order(orderData)
    showCreateOrderModal.value = false
    await loadOrdersForDate()
    alert('Заказ успешно создан!')
  } catch (error) {
    console.error('Ошибка создания заказа:', error)
    alert('Ошибка при создании заказа')
  }
}

// Обработка продажи
const handleSale = async (saleData) => {
  try {
    await dataStore.create_order(saleData)
    showSaleModal.value = false
    await loadOrdersForDate()
    alert('Продажа успешно оформлена!')
  } catch (error) {
    console.error('Ошибка оформления продажи:', error)
    alert('Ошибка при оформлении продажи')
  }
}

// Обновить статус заказа
const updateOrderStatus = async (orderId, newStatus) => {
  try {
    await dataStore.update_order_status(orderId, newStatus)
    await loadOrdersForDate()
    if (selectedOrder.value?.id === orderId) {
      const updatedOrder = dataStore.orders.find(o => o.id === orderId)
      if (updatedOrder) {
        selectedOrder.value = updatedOrder
      }
    }
  } catch (error) {
    console.error('Ошибка обновления статуса:', error)
  }
}

// Просмотр деталей заказа
const viewOrderDetails = (order) => {
  selectedOrder.value = order
  showDetailsModal.value = true
}

// Закрыть детали
const closeDetailsModal = () => {
  showDetailsModal.value = false
  selectedOrder.value = null
}

// Загрузка данных при монтировании
onMounted(async () => {
  selectedDate.value = new Date().toISOString().split('T')[0]
  await dataStore.get_orders()
  await dataStore.get_clients()
  await dataStore.get_flowers()
  await dataStore.get_bouquets()
  await dataStore.get_materials()
  await dataStore.get_users()
})

// Вернуть заказ в предыдущий статус
const goBackOrder = async (orderId) => {
  const order = dataStore.orders.find(o => o.id === orderId)
  if (!order) return

  let prevStatus = ''
  switch (order.status) {
    case 'assembly':
      prevStatus = 'new'
      break
    case 'ready':
      prevStatus = 'assembly'
      break
    case 'completed':
      prevStatus = 'ready'
      break
    default:
      alert('Нельзя вернуть этот заказ')
      return
  }

  // Получаем текст статуса для отображения
  const statusText = {
    'new': 'Новый',
    'assembly': 'В сборке',
    'ready': 'Готов'
  }

  if (confirm(`Вернуть заказ #${orderId} из статуса "${order.status}" в "${statusText[prevStatus]}"?`)) {
    try {
      await dataStore.update_order_status(orderId, prevStatus)
      await loadOrdersForDate()
      alert('Заказ возвращен!')
    } catch (error) {
      console.error('Ошибка возврата:', error)
      alert('Ошибка при возврате заказа')
    }
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700&display=swap');

.orders-page {
  padding: 2rem;
  max-width: 1600px;
  margin: 0 auto;
  font-family: 'Inter', sans-serif;
  background-color: #ffffff;
  min-height: 100vh;
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
  font-size: 1.8rem;
  font-weight: 700;
  color: #f9cffd;
  letter-spacing: -0.5px;
}

/* Навигация */
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

/* Профиль */
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
}

.logout-btn:hover {
  background: #c4db3a;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px #d9eb6180;
}

/* Заголовок раздела */
.section-title {
  text-align: center;
  font-size: 2rem;
  font-weight: 700;
  color: #f9cffd;
  margin: 0 0 1.5rem 0;
  letter-spacing: -0.5px;
}

/* Кнопки действий */
.action-buttons {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  justify-content: center;
}

.btn-action {
  padding: 0.8rem 2rem;
  background: #ffffff;
  border: 2px solid #d9eb61;
  border-radius: 40px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  color: #2c3e2f;
  transition: all 0.3s ease;
}

.btn-action:hover {
  background: #d9eb61;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(217, 235, 97, 0.3);
}

/* Календарь */
.calendar-bar {
  margin-bottom: 2rem;
  text-align: center;
}

.date-picker-input {
  padding: 0.8rem 1.5rem;
  background: white;
  border: 2px solid #f5f5f7;
  border-radius: 40px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Inter', sans-serif;
  color: #2c3e2f;
  outline: none;
}

.date-picker-input:hover {
  border-color: #d9eb61;
}

.date-picker-input:focus {
  border-color: #d9eb61;
  box-shadow: 0 0 0 3px #d9eb6140;
}

/* Канбан-доска */
.kanban-board {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
}

/* Общие стили колонок */
.kanban-column {
  border-radius: 20px;
  overflow: hidden;
  min-height: 500px;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: none;
}

.kanban-column:hover {
  transform: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* Заголовки колонок */
.column-header {
  padding: 1.2rem;
  text-align: center;
  background: #fffded;
  color: #2c3e2f;
  border-bottom: 2px solid #d9eb61;
}

.column-title {
  font-size: 1rem;
  font-weight: 700;
  display: block;
  margin-bottom: 0.3rem;
  letter-spacing: 0.5px;
  color: #2c3e2f;
}

.column-subtitle {
  font-size: 0.7rem;
  opacity: 0.8;
  color: #4a5b4e;
}

/* Содержимое колонок */
.column-content {
  padding: 1rem;
  max-height: 600px;
  overflow-y: auto;
  background: #ffffff;
}

/* Секции внутри колонок */
.section-label {
  font-size: 0.75rem;
  font-weight: 700;
  margin: 0.8rem 0;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  display: inline-block;
}

.section-label.urgent {
  background: #f9cffd;
  color: #8b3a8b;
}

.section-label.planned {
  background: #d9eb61;
  color: #2c5e2c;
}

/* Кнопка добавления заказа */
.add-order-btn {
  width: 100%;
  padding: 0.7rem;
  margin-top: 1rem;
  background: #f5f5f7;
  border: 2px dashed #d9eb61;
  border-radius: 40px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  color: #4a5b4e;
  transition: all 0.3s ease;
}

.add-order-btn:hover {
  background: #d9eb61;
  border: 2px solid #d9eb61;
  transform: scale(1.02);
}

/* Скроллбар */
.column-content::-webkit-scrollbar {
  width: 6px;
}

.column-content::-webkit-scrollbar-track {
  background: #f0f0f0;
  border-radius: 10px;
}

.column-content::-webkit-scrollbar-thumb {
  background: #cccccc;
  border-radius: 10px;
}

.column-content::-webkit-scrollbar-thumb:hover {
  background: #aaaaaa;
}

/* Ошибка */
.error-message {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #fef2f0;
  color: #e85d4a;
  padding: 0.8rem 1.2rem;
  border-radius: 40px;
  display: flex;
  gap: 0.8rem;
  align-items: center;
  z-index: 1001;
  font-size: 0.85rem;
  font-weight: 500;
  border-left: 3px solid #e85d4a;
}

.error-message button {
  background: none;
  border: none;
  color: #e85d4a;
  cursor: pointer;
  font-size: 1rem;
}

/* Адаптив */
@media (max-width: 1200px) {
  .kanban-board {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
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

  .kanban-board {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-direction: column;
    align-items: center;
  }
}
</style>
