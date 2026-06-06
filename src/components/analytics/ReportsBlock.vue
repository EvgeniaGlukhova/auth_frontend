<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>Отчеты и аналитика</h3>
        <button class="close-btn" @click="$emit('close')">X</button>
      </div>

      <div class="modal-body">
        <!-- Весь контент отчетов -->
        <div class="reports-container">
          <!-- Период и навигация -->
          <div class="period-selector">
            <div class="period-buttons">
              <button
                v-for="p in periods"
                :key="p.value"
                :class="{ active: selectedPeriod === p.value }"
                @click="changePeriod(p.value)"
              >
                {{ p.label }}
              </button>
            </div>
            <div class="date-range" v-if="selectedPeriod === 'custom'">
              <input type="date" v-model="customStartDate" @change="loadAllData">
              <span>—</span>
              <input type="date" v-model="customEndDate" @change="loadAllData">
            </div>
            <div class="month-selector" v-if="selectedPeriod === 'month'">
              <input type="month" v-model="selectedMonth" @change="loadAllData">
            </div>
          </div>

          <!-- Карточки с общей статистикой -->
          <div class="stats-cards">
            <div class="stat-card">
              <div class="stat-title">Выручка</div>
              <div class="stat-value">{{ formatMoney(revenue) }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">Новых клиентов</div>
              <div class="stat-value">{{ clientsStat.new_clients || 0 }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">Всего клиентов</div>
              <div class="stat-value">{{ clientsStat.total_clients || 0 }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">Заказов выполнено</div>
              <div class="stat-value">{{ ordersStat.completed_orders || 0 }}</div>
            </div>
          </div>

          <!-- График выручки -->
          <div class="chart-container">
            <h3>Динамика выручки</h3>
            <canvas ref="revenueChartCanvas"></canvas>
          </div>

          <div class="charts-row">
            <div class="chart-half">
              <h3>Топ товаров за {{ monthName }}</h3>
              <canvas ref="topProductsChartCanvas"></canvas>
            </div>
            <div class="chart-half">
              <h3>Статусы заказов</h3>
              <canvas ref="ordersStatusChartCanvas"></canvas>
            </div>
          </div>

          <div class="charts-row">
            <div class="chart-half">
              <h3>Движение цветов</h3>
              <canvas ref="flowerMovementsChartCanvas"></canvas>
              <div class="movements-summary">
                <div>Приход: {{ movementsSummary.total_incoming || 0 }} шт</div>
                <div>Расход: {{ movementsSummary.total_outgoing || 0 }} шт</div>
                <div>Потери: {{ movementsSummary.total_loss || 0 }} шт</div>
              </div>
            </div>
            <div class="chart-half">
              <h3>Продажи по сотрудникам</h3>
              <canvas ref="employeeSalesChartCanvas"></canvas>
            </div>
          </div>

          <!-- Таблица отработанных смен -->
          <div class="table-container">
            <h3>Отработанные смены</h3>
            <table class="data-table">
              <thead>
              <tr>
                <th>Сотрудник</th>
                <th>Всего смен</th>
                <th>Закрытых смен</th>
                <th>Отработано часов</th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="shift in employeeShifts" :key="shift.user_id">
                <td>{{ shift.user_name || shift.user?.name || shift.user?.full_name || 'Сотрудник' }}</td>
                <td>{{ shift.total_shifts }}</td>
                <td>{{ shift.closed_shifts }}</td>
                <td>{{ shift.total_hours }}</td>
              </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="loading-overlay" v-if="loading">
        <div class="spinner"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { Chart, registerables } from 'chart.js'
import api from '../../services/api'
import { useDataStore } from '../../stores/dataStore'

Chart.register(...registerables)

const emit = defineEmits(['close'])

const loading = ref(false)

const dataStore = useDataStore()

// Refs для canvas
const revenueChartCanvas = ref(null)
const topProductsChartCanvas = ref(null)
const ordersStatusChartCanvas = ref(null)
const flowerMovementsChartCanvas = ref(null)
const employeeSalesChartCanvas = ref(null)
const revenueChartData = ref([])
const revenueChartLabels = ref([])

// Объекты графиков
let revenueChart = null
let topProductsChart = null
let ordersStatusChart = null
let flowerMovementsChart = null
let employeeSalesChart = null

// Периоды
const periods = [
  { value: 'day', label: 'День' },
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
  { value: 'custom', label: 'Свои даты' }
]
const selectedPeriod = ref('month')
const customStartDate = ref('')
const customEndDate = ref('')
const selectedMonth = ref(new Date().toISOString().slice(0, 7))

// Данные
const revenue = ref(0)
const clientsStat = ref({})
const ordersStat = ref({})
const topFlowers = ref([])
const topBouquets = ref([])
const flowerMovements = ref([])
const movementsSummary = ref({})
const employeeShifts = ref([])
const employeeSales = ref([])

const monthName = computed(() => {
  const [year, month] = selectedMonth.value.split('-')
  const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
  return `${months[parseInt(month) - 1]} ${year}`
})

const formatMoney = (value) => {
  return new Intl.NumberFormat('ru-RU').format(value) + ' руб'
}

// Получить параметры для выручки, клиентов, заказов (отправляем date)
const getStatsParams = () => {
  const params = { period: selectedPeriod.value }

  if (selectedPeriod.value === 'month') {
    params.date = `${selectedMonth.value}-01`
  }
  else if (selectedPeriod.value === 'day' || selectedPeriod.value === 'week') {
    params.date = new Date().toISOString().split('T')[0]
  }

  return params
}

// Получить параметры для движений цветов, смен, продаж сотрудников (отправляем start_date/end_date)
const getMovementsParams = () => {
  const params = {}

  if (selectedPeriod.value === 'month') {
    const [year, month] = selectedMonth.value.split('-')
    params.start_date = `${year}-${month}-01`
    const lastDay = new Date(year, month, 0).getDate()
    params.end_date = `${year}-${month}-${lastDay}`
  }
  else if (selectedPeriod.value === 'day') {
    const today = new Date().toISOString().split('T')[0]
    params.start_date = today
    params.end_date = today
  }
  else if (selectedPeriod.value === 'custom') {
    if (customStartDate.value) params.start_date = customStartDate.value
    if (customEndDate.value) params.end_date = customEndDate.value
  }

  return params
}

// Загрузка выручки
const loadRevenue = async () => {
  try {
    const params = getStatsParams()
    const response = await api.get('/reports/revenue', { params })
    revenue.value = response.data.revenue || 0
  } catch (error) {
    console.error('Ошибка загрузки выручки:', error)
  }
}

// Загрузка статистики клиентов
const loadClientsStat = async () => {
  try {
    const params = getStatsParams()
    const response = await api.get('/reports/clients', { params })
    clientsStat.value = response.data
  } catch (error) {
    console.error('Ошибка загрузки статистики клиентов:', error)
  }
}

// Загрузка статистики заказов
const loadOrdersStat = async () => {
  try {
    const params = getStatsParams()
    const response = await api.get('/reports/orders', { params })
    ordersStat.value = response.data.data || {}
  } catch (error) {
    console.error('Ошибка загрузки статистики заказов:', error)
  }
}

// Загрузка топ товаров
// const loadTopProducts = async () => {
//   try {
//     const response = await api.get('/reports/top-products', {
//       params: { month: selectedMonth.value }
//     })
//     topFlowers.value = response.data.top_flowers || []
//     topBouquets.value = response.data.top_bouquets || []
//     drawTopProductsChart()
//   } catch (error) {
//     console.error('Ошибка загрузки топ товаров:', error)
//   }
// }

const loadTopProducts = async () => {
  try {
    const response = await api.get('/reports/top-products', {
      params: { month: selectedMonth.value }
    })
    // Используем данные напрямую, без itemable
    topFlowers.value = response.data.top_flowers || []
    topBouquets.value = response.data.top_bouquets || []
    drawTopProductsChart()
  } catch (error) {
    console.error('Ошибка загрузки топ товаров:', error)
  }
}

// Загрузка движения цветов
const loadFlowerMovements = async () => {
  try {
    const params = getMovementsParams()
    const response = await api.get('/reports/flower-movements', { params })
    flowerMovements.value = response.data.data || []
    movementsSummary.value = response.data.summary || {}
    drawFlowerMovementsChart()
  } catch (error) {
    console.error('Ошибка загрузки движения цветов:', error)
  }
}

// Загрузка смен сотрудников
const loadEmployeeShifts = async () => {
  try {
    const params = getMovementsParams()
    const response = await api.get('/reports/employee-shifts', { params })
    employeeShifts.value = response.data.data || []
  } catch (error) {
    console.error('Ошибка загрузки смен сотрудников:', error)
  }
}

// Загрузка продаж по сотрудникам
const loadEmployeeSales = async () => {
  try {
    const params = getMovementsParams()
    const response = await api.get('/reports/employee-sales', { params })
    employeeSales.value = response.data.data || []
    drawEmployeeSalesChart()
  } catch (error) {
    console.error('Ошибка загрузки продаж сотрудников:', error)
  }
}

// Загрузка данных для графика выручки
const loadRevenueChart = async () => {
  try {
    const params = getMovementsParams() // используем те же параметры дат
    const response = await api.get('/reports/revenue-chart', { params })
    revenueChartLabels.value = response.data.labels || []
    revenueChartData.value = response.data.data || []
    drawRevenueChart()
  } catch (error) {
    console.error('Ошибка загрузки графика выручки:', error)
  }
}

const drawRevenueChart = () => {
  if (!revenueChartCanvas.value) return
  const ctx = revenueChartCanvas.value.getContext('2d')
  if (revenueChart) revenueChart.destroy()

  // Если нет данных, показываем пустой график
  if (!revenueChartLabels.value.length) {
    revenueChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Нет данных'],
        datasets: [{
          label: 'Выручка (руб)',
          data: [0],
          borderColor: '#888888',
          backgroundColor: 'rgba(136, 136, 136, 0.1)',
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' }
        }
      }
    })
    return
  }

  revenueChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: revenueChartLabels.value,
      datasets: [{
        label: 'Выручка (руб)',
        data: revenueChartData.value,
        borderColor: '#888888',
        backgroundColor: 'rgba(136, 136, 136, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' }
      },
      scales: {
        y: {
          ticks: {
            callback: (value) => value.toLocaleString('ru-RU') + ' руб'
          }
        }
      }
    }
  })
}

const drawTopProductsChart = () => {
  if (!topProductsChartCanvas.value) return
  const ctx = topProductsChartCanvas.value.getContext('2d')
  if (topProductsChart) topProductsChart.destroy()

  // Собираем все товары (цветы и букеты)
  const flowers = topFlowers.value.map(f => ({
    name: f.name || 'Цветок',
    quantity: f.total_quantity || 0
  }))

  const bouquets = topBouquets.value.map(b => ({
    name: b.name || 'Букет',
    quantity: b.total_quantity || 0
  }))

  // Объединяем и сортируем по количеству
  const allItems = [...flowers, ...bouquets]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 8)

  const labels = allItems.map(item => item.name)
  const data = allItems.map(item => item.quantity)

  console.log('Топ товаров для графика:', { labels, data })

  topProductsChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Количество продаж',
        data: data,
        backgroundColor: '#aaaaaa',
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' }
      }
    }
  })
}



const drawOrdersStatusChart = () => {
  if (!ordersStatusChartCanvas.value) return
  const ctx = ordersStatusChartCanvas.value.getContext('2d')
  if (ordersStatusChart) ordersStatusChart.destroy()

  ordersStatusChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Выполненные', 'Отмененные', 'Новые'],
      datasets: [{
        data: [
          ordersStat.value.completed_orders || 0,
          ordersStat.value.cancelled_orders || 0,
          ordersStat.value.pending_orders || 0
        ],
        backgroundColor: ['#aaaaaa', '#cccccc', '#dddddd'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  })
}

const drawFlowerMovementsChart = () => {
  if (!flowerMovementsChartCanvas.value) return
  const ctx = flowerMovementsChartCanvas.value.getContext('2d')
  if (flowerMovementsChart) flowerMovementsChart.destroy()

  flowerMovementsChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Приход', 'Расход', 'Потери'],
      datasets: [{
        label: 'Количество (шт)',
        data: [
          movementsSummary.value.total_incoming || 0,
          movementsSummary.value.total_outgoing || 0,
          movementsSummary.value.total_loss || 0
        ],
        backgroundColor: ['#aaaaaa', '#bbbbbb', '#cccccc'],
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' }
      }
    }
  })
}

const drawEmployeeSalesChart = () => {
  if (!employeeSalesChartCanvas.value) return
  const ctx = employeeSalesChartCanvas.value.getContext('2d')
  if (employeeSalesChart) employeeSalesChart.destroy()

  employeeSalesChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: employeeSales.value.map(s => s.user?.name || s.user_name || 'Сотрудник'),
      datasets: [{
        label: 'Сумма продаж (руб)',
        data: employeeSales.value.map(s => s.total_sales || 0),
        backgroundColor: '#aaaaaa',
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' }
      },
      scales: {
        y: {
          ticks: {
            callback: (value) => value.toLocaleString('ru-RU') + ' руб'
          }
        }
      }
    }
  })
}

// Обновление всех данных
const loadAllData = async () => {
  loading.value = true
  try {
    await Promise.all([
      loadRevenue(),
      loadClientsStat(),
      loadOrdersStat(),
      loadTopProducts(),
      loadFlowerMovements(),
      loadEmployeeShifts(),
      loadEmployeeSales(),
      loadRevenueChart()
    ])
    drawOrdersStatusChart()
    drawRevenueChart()
    drawTopProductsChart()
    drawFlowerMovementsChart()
    drawEmployeeSalesChart()
  } finally {
    loading.value = false
  }
}

// Смена периода
const changePeriod = (period) => {
  selectedPeriod.value = period
  loadAllData()
}

watch(selectedMonth, () => {
  loadAllData()
})

watch(() => dataStore.flowers, () => {
  loadFlowerMovements()
}, { deep: true })

onMounted(() => {
  loadAllData()
})
</script>

<style scoped>
/* Ваши стили остаются без изменений */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 95%;
  max-width: 1400px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  position: relative;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
  background: #f0f0f0;
  border-radius: 16px 16px 0 0;
}

.modal-header h3 {
  margin: 0;
  color: #000000;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999999;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #000000;
}

.modal-body {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
  border-radius: 16px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e0e0e0;
  border-top: 3px solid #aaaaaa;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.reports-container {
  padding: 10px;
}

.period-selector {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 15px;
}

.period-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.period-buttons button {
  padding: 8px 20px;
  background: #e0e0e0;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
  color: #000000;
}

.period-buttons button:hover {
  background: #cccccc;
}

.period-buttons button.active {
  background: #aaaaaa;
  color: #000000;
}

.date-range, .month-selector {
  display: flex;
  gap: 10px;
  align-items: center;
}

.date-range input, .month-selector input {
  padding: 6px 12px;
  border: 1px solid #cccccc;
  border-radius: 6px;
  color: #000000;
  background: white;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: #f0f0f0;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
}

.stat-title {
  font-size: 14px;
  color: #666666;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #000000;
}

.chart-container {
  background: #f0f0f0;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: 400px;
}

.chart-container canvas, .chart-half canvas {
  max-height: 300px;
}

.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.chart-half {
  background: #f0f0f0;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: auto;
  min-height: 400px;
}

.chart-half h3, .chart-container h3, .table-container h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
  color: #000000;
}

.movements-summary {
  display: flex;
  justify-content: space-around;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #e0e0e0;
  font-size: 14px;
  color: #000000;
}

.table-container {
  background: #f0f0f0;
  border-radius: 12px;
  padding: 20px;
  margin-top: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
  color: #000000;
}

.data-table th {
  background: #e0e0e0;
  font-weight: 600;
  color: #000000;
}

@media (max-width: 900px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  .charts-row {
    grid-template-columns: 1fr;
  }
}
</style>
