<template>
  <div class="orders-page">
    <!-- Верхняя панель -->
    <div class="top-bar">
      <h1>Цветочный магазин</h1>
      <div class="profile-section">
        <div class="user-details">
          <span class="user-name">{{ authStore.user?.email?.split('@')[0] || 'Сотрудник' }}</span>
          <span class="user-role">{{ getRoleName() }}</span>
        </div>
        <router-link to="/dashboard" class="logout-btn">Выход</router-link>
      </div>
    </div>

    <!-- Навигация -->
    <div class="nav-tabs">
      <button @click="goToWarehouse" class="nav-btn">Склад</button>
      <button @click="goToClients" class="nav-btn">Клиенты</button>
      <button :class="{ active: activeNav === 'orders' }" class="nav-btn">Заказы</button>
      <button @click="goToAnalytics" class="nav-btn">Аналитика</button>
    </div>

    <!-- Кнопки действий -->
    <div class="action-buttons">
      <button @click="openOrderModal" class="btn-primary">Новый заказ</button>
      <button @click="openSaleModal" class="btn-primary">Продажа сейчас</button>
    </div>

    <!-- Календарь дней -->
    <div class="calendar-bar">
      <button
        v-for="day in weekDays"
        :key="day.fullDate"
        :class="{ active: selectedDate === day.fullDate }"
        @click="selectDate(day.fullDate)"
      >
        <div class="day-week">{{ day.weekday }}</div>
        <div class="day-date">{{ day.displayDate }}</div>
      </button>
    </div>

    <!-- Канбан-доска -->
    <div class="kanban-board">
      <!-- Колонка 1: Новые заказы -->
      <div class="kanban-column">
        <div class="column-header new">
          <span class="column-title">НОВЫЕ ЗАКАЗЫ</span>
          <span class="column-subtitle">(созданы в этот день)</span>
        </div>
        <div class="column-content">
          <template v-if="urgentOrders.length > 0">
            <div class="section-label urgent">СРОЧНЫЕ (сегодня):</div>
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
            Создать заказ
          </button>
        </div>
      </div>

      <!-- Колонка 2: К сборке -->
      <div class="kanban-column">
        <div class="column-header assembly">
          <span class="column-title">К СБОРКЕ</span>
          <span class="column-subtitle">(собрать сегодня)</span>
        </div>
        <div class="column-content">
          <OrderCard
            v-for="order in assemblyOrders"
            :key="order.id"
            :order="order"
            type="assembly"
            @status-change="updateOrderStatus"
            @view-details="viewOrderDetails"
          />
        </div>
      </div>

      <!-- Колонка 3: Готовые -->
      <div class="kanban-column">
        <div class="column-header ready">
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
            @view-details="viewOrderDetails"
          />
        </div>
      </div>

      <!-- Колонка 4: Завершенные -->
      <div class="kanban-column">
        <div class="column-header completed">
          <span class="column-title">ЗАВЕРШЕННЫЕ</span>
          <span class="column-subtitle">(выданы/доставлены)</span>
        </div>
        <div class="column-content">
          <OrderCard
            v-for="order in completedOrders"
            :key="order.id"
            :order="order"
            type="completed"
            @view-details="viewOrderDetails"
          />
        </div>
      </div>
    </div>

    <!-- Модальные окна -->
    <CreateOrderModal
      :show="showCreateOrderModal"
      :clients="dataStore.clients"
      :flowers="dataStore.flowers"
      :bouquets="dataStore.bouquets"
      :selected-date="selectedDate"
      @close="showCreateOrderModal = false"
      @save="handleCreateOrder"
    />

    <SaleModal
      :show="showSaleModal"
      :clients="dataStore.clients"
      :flowers="dataStore.flowers"
      :bouquets="dataStore.bouquets"
      @close="showSaleModal = false"
      @save="handleSale"
    />

    <InfaOrderModal
      :show="showDetailsModal"
      :order="selectedOrder"
      @close="closeDetailsModal"
      @status-change="updateOrderStatus"
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

// Заказы для выбранной даты (по дате доставки ИЛИ по дате создания)
const ordersForSelectedDate = computed(() => {
  return dataStore.orders.filter(order => {
    let deliveryDate = null
    if (order.delivery_date) {
      deliveryDate = order.delivery_date.split('T')[0]
    }
    return deliveryDate === selectedDate.value
  })
})

// Срочные заказы (доставка сегодня)
const urgentOrders = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return ordersForSelectedDate.value.filter(order =>
    order.status === 'new' &&
    (!order.delivery_date || order.delivery_date === today)
  )
})

// Плановые заказы (доставка не сегодня)
const plannedOrders = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return ordersForSelectedDate.value.filter(order =>
    order.status === 'new' &&
    order.delivery_date &&
    order.delivery_date !== today
  )
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

// Завершенные заказы
const completedOrders = computed(() => {
  return dataStore.orders.filter(order =>
    order.status === 'completed'
  )
})

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
})
</script>

<style scoped>
.orders-page {
  padding: 20px;
  max-width: 1600px;
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
  gap: 15px;
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

.nav-btn {
  padding: 10px 20px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  color: #000000;
}

.nav-btn.active {
  color: #000000;
  border-bottom: 2px solid #000000;
}

.action-buttons {
  display: flex;
  gap: 15px;
  margin-bottom: 25px;
}

.btn-primary {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
  background-color: #e0e0e0;
  color: #000000;
}

.btn-primary:hover {
  background-color: #cccccc;
}

.calendar-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  overflow-x: auto;
  padding-bottom: 10px;
}

.calendar-bar button {
  min-width: 70px;
  padding: 10px;
  background: #e0e0e0;
  border: 1px solid #cccccc;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  color: #000000;
}

.calendar-bar button.active {
  background: #cccccc;
  color: #000000;
  border-color: #999999;
}

.day-week {
  font-size: 12px;
  font-weight: bold;
}

.day-date {
  font-size: 16px;
}

.kanban-board {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.kanban-column {
  background: #f0f0f0;
  border-radius: 12px;
  overflow: hidden;
  min-height: 500px;
}

.column-header {
  padding: 15px;
  background-color: #e0e0e0;
  color: #000000;
  text-align: center;
  border-bottom: 1px solid #cccccc;
}

.column-title {
  font-size: 14px;
  font-weight: bold;
  display: block;
  margin: 5px 0;
}

.column-subtitle {
  font-size: 11px;
  color: #555555;
}

.column-content {
  padding: 15px;
  max-height: 600px;
  overflow-y: auto;
}

.section-label {
  font-size: 12px;
  font-weight: bold;
  margin: 10px 0;
  padding: 5px;
  border-radius: 4px;
}

.section-label.urgent {
  background: #e0e0e0;
  color: #000000;
}

.section-label.planned {
  background: #e0e0e0;
  color: #000000;
}

.add-order-btn {
  width: 100%;
  padding: 10px;
  margin-top: 15px;
  background: #e0e0e0;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
  color: #000000;
}

.add-order-btn:hover {
  background: #cccccc;
  transform: scale(1.02);
}

.error-message {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: #f44336;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  display: flex;
  gap: 10px;
  align-items: center;
  z-index: 1001;
}

.error-message button {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 18px;
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
</style>
