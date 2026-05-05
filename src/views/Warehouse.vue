<template>
  <div class="warehouse-page">
    <!-- Верхняя панель -->
    <div class="top-bar">
      <h1>Цветочный магазин</h1>
      <div class="search-profile">
        <div class="user-details">
          <span class="user-name">{{ authStore.user?.email?.split('@')[0] || 'Сотрудник' }}</span>
          <span class="user-role">{{ getRoleName() }}</span>
        </div>
        <router-link to="/dashboard" class="logout-btn">Выход</router-link>
      </div>
    </div>

    <!-- Навигация -->
    <div class="nav-tabs">
      <button class="active">Склад</button>
      <button @click="$router.push('/customers')">Клиенты</button>
      <button @click="$router.push('/orders')">Заказы</button>
      <button @click="$router.push('/analytics')">Аналитика</button>
    </div>

    <!-- Заголовок раздела -->
    <h2 class="section-title">Складской учет</h2>

    <!-- Кнопки действий -->
    <div class="action-buttons">
      <button @click="openAddModal" class="btn-primary">Добавить</button>
      <button @click="openComingModal" class="btn-secondary">Приход</button>
      <button @click="openExpenseModal" class="btn-secondary">Расход</button>
      <button @click="openCreateBouquetModal" class="btn-secondary">Собрать букет</button>
    </div>

    <!-- Вкладки типов товаров -->
    <div class="type-tabs">
      <button
        v-for="tab in typeTabs"
        :key="tab.id"
        :class="{ active: activeTypeTab === tab.id }"
        @click="changeTypeTab(tab.id)"
      >
        {{ tab.name }}
      </button>
    </div>

    <!-- Фильтры -->
    <div class="filters-bar">
      <input
        type="text"
        v-model="searchQuery"
        placeholder="Поиск по названию..."
        class="search-input"
        @keyup.enter="loadData"
      >
      <button @click="loadData" class="apply-btn">Применить</button>
    </div>

    <!-- Таблица товаров -->
    <div class="products-table-container">
      <table class="products-table">
        <thead>
        <tr>
          <th>ID</th>
          <th>Название</th>
          <th>Тип</th>
          <th>Цена (руб)</th>
          <th>Количество</th>
          <th>Действия</th>
        </tr>
        </thead>
        <tbody>
        <tr v-if="dataStore.loading">
          <td colspan="6" class="text-center">Загрузка...</td>
        </tr>
        <tr v-else-if="currentProducts.length === 0">
          <td colspan="6" class="text-center">Нет товаров</td>
        </tr>
        <tr v-else v-for="product in currentProducts" :key="product.id">
          <td>{{ product.id }}</td>
          <td><strong>{{ product.name }}</strong></td>
          <td>
              <span :class="['type-badge', activeTypeTab]">
                {{ activeTypeTab === 'components' ? 'Цветок' : 'Букет' }}
              </span>
          </td>
          <td>{{ product.price }} руб.</td>
          <td>
              <span :class="['quantity-badge', getQuantityClass(product.quantity)]">
                {{ product.quantity || 0 }} шт
              </span>
          </td>
          <td>
            <button @click="editProduct(product)" class="edit-btn">Редактировать</button>
            <button @click="deleteProduct(product)" class="delete-btn">Удалить</button>
          </td>
        </tr>
        </tbody>
      </table>
    </div>

    <!-- Модальные окна -->
    <AppendinWarehouseModal
      v-if="showAddModal"
      :is-editing="isEditing"
      :type="activeTypeTab"
      :form-data="formData"
      :suppliers="dataStore.suppliers"
      @close="closeAddModal"
      @save="saveProduct"
    />

    <ComingModal
      v-if="showComingModal"
      :initial-data="comingData"
      :all-products="allProducts"
      @close="showComingModal = false"
      @confirm="confirmComing"
    />

    <ExpenseModal
      v-if="showExpenseModal"
      :initial-data="expenseData"
      :all-products="allProducts"
      @close="showExpenseModal = false"
      @confirm="confirmExpense"
    />

    <CreateBouquetModal
      v-if="showCreateBouquetModal"
      :initial-data="bouquetData"
      :flowers="dataStore.flowers"
      @close="closeCreateBouquetModal"
      @confirm="confirmCreateBouquet"
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
import { useDataStore } from '../stores/dataStore'
import AppendinWarehouseModal from '../components/warehouse/AppendinWarehouseModal.vue'
import ComingModal from '../components/warehouse/ComingModal.vue'
import ExpenseModal from '../components/warehouse/ExpenseModal.vue'
import CreateBouquetModal from '../components/warehouse/CreateBouquetModal.vue'
import { useAuthStore } from '@/stores/authStore.js'


const dataStore = useDataStore()

// Состояние

const activeTypeTab = ref('components')
const searchQuery = ref('')

// Модальные окна
const showAddModal = ref(false)
const showComingModal = ref(false)
const showExpenseModal = ref(false)
const showCreateBouquetModal = ref(false)
const isEditing = ref(false)

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

// Форма добавления/редактирования
const formData = ref({
  id: null,
  name: '',
  price: '',
  quantity: 0,
  supplier_id: null
})

// Данные для прихода
const comingData = ref({
  product_id: null,
  quantity: 0,
  received_date: new Date().toISOString().split('T')[0],
  supplier: '',
  comment: ''
})

// Данные для расхода
const expenseData = ref({
  product_id: null,
  quantity: 0,
  reason: 'Продажа',
  writeoff_date: new Date().toISOString().split('T')[0],
  comment: ''
})

// Данные для сборки букета
const bouquetData = ref({
  name: '',
  price: 0,
  composition: [{ flower_id: null, quantity: 0 }],
  quantity: 1,
  description: ''
})

// Вкладки
const typeTabs = [
  { id: 'components', name: 'Компоненты (цветы)' },
  { id: 'bouquets', name: 'Готовые букеты' }
]

// Все товары для выпадающих списков
const allProducts = computed(() => {
  const flowers = (dataStore.flowers || []).map(f => ({
    ...f,
    type: 'flower',
    supplier_name: f.supplier?.company_name || 'не указан'
  }))
  const bouquets = (dataStore.bouquets || []).map(b => ({
    ...b,
    type: 'bouquet',
    supplier_name: null
  }))
  return [...flowers, ...bouquets]
})

// Текущие товары в зависимости от вкладки
const currentProducts = computed(() => {
  if (activeTypeTab.value === 'components') {
    return dataStore.flowers || []
  } else {
    return dataStore.bouquets || []
  }
})



// Загрузка данных
const loadData = async () => {
  await Promise.all([
    dataStore.get_flowers(searchQuery.value),
    dataStore.get_bouquets(searchQuery.value),
    dataStore.get_suppliers()
  ])
}

// Переключение вкладки
const changeTypeTab = async (tabId) => {
  activeTypeTab.value = tabId
  searchQuery.value = ''
  await loadData()
}

// Открыть модалку добавления
const openAddModal = () => {
  isEditing.value = false
  formData.value = { id: null, name: '', price: '', quantity: 0, supplier_id: null }
  showAddModal.value = true
}

// Открыть модалку прихода
const openComingModal = () => {
  comingData.value = {
    product_id: null,
    quantity: 0,
    received_date: new Date().toISOString().split('T')[0],
    supplier: '',
    comment: ''
  }
  showComingModal.value = true
}

// Открыть модалку расхода
const openExpenseModal = () => {
  expenseData.value = {
    product_id: null,
    quantity: 0,
    reason: 'Продажа',
    writeoff_date: new Date().toISOString().split('T')[0],
    comment: ''
  }
  showExpenseModal.value = true
}

// Открыть модалку сборки букета
const openCreateBouquetModal = () => {
  bouquetData.value = {
    name: '',
    price: 0,
    composition: [{ flower_id: null, quantity: 0 }],
    quantity: 1,
    description: ''
  }
  showCreateBouquetModal.value = true
}

// Закрыть модалку добавления
const closeAddModal = () => {
  showAddModal.value = false
  formData.value = { id: null, name: '', price: '', quantity: 0, supplier_id: null }
}

// Закрыть модалку сборки букета
const closeCreateBouquetModal = () => {
  showCreateBouquetModal.value = false
  bouquetData.value = {
    name: '',
    price: 0,
    composition: [{ flower_id: null, quantity: 0 }],
    quantity: 1,
    description: ''
  }
}

// Редактировать товар
const editProduct = (product) => {
  isEditing.value = true
  formData.value = {
    id: product.id,
    name: product.name,
    price: product.price,
    supplier_id: product.supplier_id || null
  }
  showAddModal.value = true
}

// Сохранить товар (добавить/редактировать)
const saveProduct = async (data) => {
  if (!data.name || !data.price) {
    alert('Заполните обязательные поля (название и цена)')
    return
  }

  const sendData = {
    name: data.name,
    price: data.price
  }

  // Добавляем quantity ТОЛЬКО при создании нового товара
  if (!isEditing.value && activeTypeTab.value === 'components') {
    sendData.quantity = data.quantity || 0
  }

  if (activeTypeTab.value === 'components' && data.supplier_id) {
    sendData.supplier_id = data.supplier_id
  }

  try {
    if (isEditing.value) {
      if (activeTypeTab.value === 'components') {
        await dataStore.update_flower(data.id, sendData)
      } else {
        await dataStore.update_bouquet(data.id, sendData)
      }
    } else {
      if (activeTypeTab.value === 'components') {
        await dataStore.create_flower(sendData)
      } else {
        await dataStore.create_bouquet(sendData)
      }
    }

    closeAddModal()
    await loadData()
    alert(isEditing.value ? 'Товар обновлен' : 'Товар добавлен')
  } catch (error) {
    console.error('Ошибка сохранения:', error)
    alert('Ошибка при сохранении')
  }
}

// Подтвердить приход
// Подтвердить приход
const confirmComing = async (data) => {
  if (!data.product_id || !data.quantity) {
    alert('Выберите товар и укажите количество')
    return
  }

  const product = allProducts.value.find(p => p.id === data.product_id)
  if (!product) {
    alert('Товар не найден')
    return
  }

  try {
    if (product.type === 'flower') {
      // Используем специальный метод для поставки цветов
      await dataStore.incoming_flower(product.id, {
        quantity: data.quantity,
        reason: data.reason || 'Поставка от поставщика'
      })
    } else {
      // Для букетов пока оставляем старый метод
      const newQty = (product.quantity || 0) + data.quantity
      await dataStore.update_bouquet(product.id, {
        quantity: newQty,
        reason: data.reason || 'Поставка'
      })
    }

    showComingModal.value = false
    await loadData()
    alert('Приход оформлен успешно!')
  } catch (error) {
    console.error('Ошибка прихода:', error)
    alert(error.response?.data?.message || 'Ошибка при оформлении прихода')
  }
}

// Подтвердить расход
const confirmExpense = async (data) => {
  if (!data.product_id || !data.quantity) {
    alert('Выберите товар и укажите количество')
    return
  }

  const product = allProducts.value.find(p => p.id === data.product_id)
  if (product) {
    const newQty = (product.quantity || 0) - data.quantity
    if (newQty < 0) {
      alert('Недостаточно товара на складе!')
      return
    }
    const updateData = { quantity: newQty }

    if (product.type === 'flower') {
      await dataStore.update_flower(product.id, updateData)
    } else {
      await dataStore.update_bouquet(product.id, updateData)
    }
  }

  showExpenseModal.value = false
  await loadData()
  alert('Расход оформлен успешно!')
}

// Подтвердить сборку букета
const confirmCreateBouquet = async (data) => {
  if (!data.name || !data.price) {
    alert('Заполните название и цену букета')
    return
  }

  // Проверяем наличие всех компонентов
  for (const item of data.composition) {
    if (!item.flower_id || !item.quantity) {
      alert('Заполните все компоненты букета')
      return
    }

    const flower = dataStore.flowers.find(f => f.id === item.flower_id)
    const requiredQty = item.quantity * data.quantity

    if (!flower || (flower.quantity || 0) < requiredQty) {
      alert(`Недостаточно цветов "${flower?.name}" на складе!`)
      return
    }
  }

  // Списываем цветы со склада
  for (const item of data.composition) {
    const flower = dataStore.flowers.find(f => f.id === item.flower_id)
    const newQty = (flower.quantity || 0) - (item.quantity * data.quantity)
    await dataStore.update_flower(flower.id, { quantity: newQty })
  }

  // Создаем букет
  await dataStore.create_bouquet({
    name: data.name,
    price: data.price,
    quantity: data.quantity,
    description: data.description,
    production_date: new Date().toISOString().split('T')[0]
  })

  closeCreateBouquetModal()
  await loadData()
  alert('Букет успешно собран!')
}

// Удалить товар
const deleteProduct = async (product) => {
  if (confirm(`Удалить товар "${product.name}"?`)) {
    try {
      if (activeTypeTab.value === 'components') {
        await dataStore.delete_flower(product.id)
      } else {
        await dataStore.delete_bouquet(product.id)
      }
      await loadData()
    } catch (error) {
      console.error('Ошибка удаления:', error)
    }
  }
}

// Получить класс для количества
const getQuantityClass = (quantity) => {
  if (!quantity || quantity <= 0) return 'out-of-stock'
  if (quantity < 10) return 'low-stock'
  return 'in-stock'
}

// Загрузка при монтировании
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.warehouse-page {
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

.search-profile {
  display: flex;
  gap: 20px;
  align-items: center;
}

.global-search {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 200px;
}

.profile {
  font-weight: bold;
  color: #000000;
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
  margin-bottom: 20px;
  color: #000000;
}

.action-buttons {
  display: flex;
  gap: 15px;
  margin-bottom: 25px;
  flex-wrap: wrap;
}

.btn-primary, .btn-secondary {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
  background-color: #e0e0e0;
  color: #000000;
}

.btn-primary:hover, .btn-secondary:hover {
  background-color: #cccccc;
}

.type-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.type-tabs button {
  padding: 8px 16px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  border-radius: 20px;
  color: #000000;
}

.type-tabs button.active {
  background-color: #e0e0e0;
  color: #000000;
}

.filters-bar {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: center;
}

.search-input {
  flex: 1;
  min-width: 200px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.apply-btn {
  padding: 10px 20px;
  background-color: #e0e0e0;
  color: #000000;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.apply-btn:hover {
  background-color: #cccccc;
}

.products-table-container {
  overflow-x: auto;
}

.products-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.products-table th,
.products-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
  color: #000000;
}

.products-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #000000;
}

.products-table tr:hover {
  background-color: #f5f5f5;
}

.type-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.type-badge.components {
  background-color: #f5f5f5;
  color: #000000;
}

.type-badge.bouquets {
  background-color: #f5f5f5;
  color: #000000;
}

.quantity-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.quantity-badge.in-stock {
  color: #000000;
}

.quantity-badge.low-stock {
  color: #000000;
}

.quantity-badge.out-of-stock {
  color: #000000;
}

.edit-btn, .delete-btn {
  padding: 6px 12px;
  margin: 0 5px;
  border: none;
  cursor: pointer;
  background-color: #e0e0e0;
  color: #000000;
  border-radius: 4px;
  font-size: 12px;
}

.edit-btn:hover, .delete-btn:hover {
  background-color: #cccccc;
  transform: scale(1.05);
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

.text-center {
  text-align: center;
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
