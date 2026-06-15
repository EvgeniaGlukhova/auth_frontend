<template>
  <div class="orders-page">
    <Header />

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

    <!-- Модальные окна  -->
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
import Header from '../components/Header.vue'

const router = useRouter()
const dataStore = useDataStore()
const authStore = useAuthStore()


// константы


const STATUS_TRANSITIONS = {
  'assembly': 'new',
  'ready': 'assembly',
  'completed': 'ready'
}

const STATUS_TEXT = {
  'new': 'Новый',
  'assembly': 'В сборке',
  'ready': 'Готов'
}

// состояние
const activeNav = ref('orders')
const selectedDate = ref('')
const showCreateOrderModal = ref(false)
const showSaleModal = ref(false)
const showDetailsModal = ref(false)
const selectedOrder = ref(null)




// Заказы для выбранной даты (по дате доставки)
const ordersForSelectedDate = computed(() => {
  return dataStore.orders.filter(order => {
    const deliveryDate = order.delivery_date?.split('T')[0]
    return deliveryDate === selectedDate.value
  })
})

// Срочные заказы (доставка сегодня)
const urgentOrders = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return ordersForSelectedDate.value.filter(order => {
    const deliveryDate = order.delivery_date?.split('T')[0]
    return order.status === 'new' && (!order.delivery_date || deliveryDate === today)
  })
})

// Плановые заказы (доставка не сегодня)
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
  return dataStore.orders.filter(order => order.status === 'ready')
})

// Завершенные заказы (за выбранную дату)
const completedOrders = computed(() => {
  return dataStore.orders.filter(order => {
    if (order.status !== 'completed') return false

    // Для продаж (sale) - по дате создания
    if (order.type === 'sale') {
      return order.created_at?.split('T')[0] === selectedDate.value
    }

    // Для заказов (order) - по дате завершения
    return order.updated_at?.split('T')[0] === selectedDate.value
  })
})

// методы
const getToday = () => new Date().toISOString().split('T')[0]

const loadOrdersForDate = async () => {
  await dataStore.get_orders()
}

// Выбрать дату
const selectDate = (date) => {
  selectedDate.value = date
  loadOrdersForDate()
}

// Открыть модалки
const openOrderModal = () => { showCreateOrderModal.value = true }
const openSaleModal = () => { showSaleModal.value = true }

// Общая обработка создания заказа/продажи
const handleOrderCreate = async (data, isSale = false) => {
  try {
    await dataStore.create_order(data)
    if (isSale) {
      showSaleModal.value = false
    } else {
      showCreateOrderModal.value = false
    }
    await loadOrdersForDate()
    alert(isSale ? 'Продажа успешно оформлена!' : 'Заказ успешно создан!')
  } catch (error) {
    console.error('Ошибка:', error)
    alert(isSale ? 'Ошибка при оформлении продажи' : 'Ошибка при создании заказа')
  }
}

const handleCreateOrder = (orderData) => handleOrderCreate(orderData, false)
const handleSale = (saleData) => handleOrderCreate(saleData, true)

// Общая функция завершения заказа (с списанием товаров)
const completeOrderWithConfirm = async (orderId, closeModal = false) => {
  if (!confirm('Выдать заказ? Товары будут списаны со склада')) return

  try {
    await dataStore.complete_order(orderId)
    await loadOrdersForDate()
    if (closeModal) closeDetailsModal()
    alert('Заказ выдан, товары списаны со склада')
  } catch (error) {
    console.error('Ошибка:', error)
    alert(error.response?.data?.message || 'Ошибка при списании товаров')
  }
}

const completeOrder = (orderId) => completeOrderWithConfirm(orderId, false)
const completeOrderFromModal = (orderId) => completeOrderWithConfirm(orderId, true)

// Обновить статус заказа
const updateOrderStatus = async (orderId, newStatus) => {
  try {
    await dataStore.update_order_status(orderId, newStatus)
    await loadOrdersForDate()

    // Обновляем выбранный заказ, если он открыт
    if (selectedOrder.value?.id === orderId) {
      const updatedOrder = dataStore.orders.find(o => o.id === orderId)
      if (updatedOrder) selectedOrder.value = updatedOrder
    }
  } catch (error) {
    console.error('Ошибка обновления статуса:', error)
  }
}

// Вернуть заказ в предыдущий статус
const goBackOrder = async (orderId) => {
  const order = dataStore.orders.find(o => o.id === orderId)
  if (!order) return

  const prevStatus = STATUS_TRANSITIONS[order.status]
  if (!prevStatus) {
    alert('Нельзя вернуть этот заказ')
    return
  }

  if (confirm(`Вернуть заказ #${orderId} из статуса "${order.status}" в "${STATUS_TEXT[prevStatus]}"?`)) {
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

// Просмотр деталей заказа
const viewOrderDetails = (order) => {
  selectedOrder.value = order
  showDetailsModal.value = true
}

const closeDetailsModal = () => {
  showDetailsModal.value = false
  selectedOrder.value = null
}

// Загрузка всех данных
const loadAllData = async () => {
  await Promise.all([
    dataStore.get_orders(),
    dataStore.get_clients(),
    dataStore.get_flowers(),
    dataStore.get_bouquets(),
    dataStore.get_materials(),
    dataStore.get_users()
  ])
}


onMounted(async () => {
  selectedDate.value = getToday()
  await loadAllData()
})
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
