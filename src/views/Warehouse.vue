<template>
  <div class="warehouse-page">
    <Header />

    <!-- Заголовок раздела -->
    <h2 class="section-title">Складской учет</h2>

    <!-- Кнопки действий -->
    <div class="action-buttons">
      <button @click="openAddModal" class="btn-action">Добавить</button>
      <button @click="openComingModal" class="btn-action">Приход</button>
      <button @click="openExpenseModal" class="btn-action">Расход</button>
      <button @click="openCreateBouquetModal" class="btn-action">Собрать букет</button>
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
          <th>Название</th>
          <th>Тип</th>
          <th>Цена (руб)</th>
          <th>Количество</th>
          <th>Действия</th>
        </tr>
        </thead>
        <tbody>
        <tr v-if="dataStore.loading">
          <td colspan="5" class="text-center">Загрузка...</td>
        </tr>
        <tr v-else-if="currentProducts.length === 0">
          <td colspan="5" class="text-center">Нет товаров</td>
        </tr>
        <tr v-else v-for="product in currentProducts" :key="product.id">
          <td><strong>{{ product.name }}</strong></td>
          <td>
            <span :class="['type-badge', activeTypeTab]">
                {{ getTypeName() }}
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

    <!-- Модальные окна (остаются без изменений) -->
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
      :users="dataStore.users"
      @close="showComingModal = false"
      @confirm="confirmComing"
    />

    <ExpenseModal
      v-if="showExpenseModal"
      :initial-data="expenseData"
      :all-products="allProducts"
      :users="dataStore.users"
      @close="showExpenseModal = false"
      @confirm="confirmExpense"
    />

    <CreateBouquetModal
      v-if="showCreateBouquetModal"
      :initial-data="bouquetData"
      :flowers="dataStore.flowers"
      :materials="dataStore.materials"
      :users="dataStore.users"
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
import Header from '../components/Header.vue'

const dataStore = useDataStore()
const authStore = useAuthStore()

// состояния
const activeTypeTab = ref('components')
const searchQuery = ref('')

const showAddModal = ref(false)
const showComingModal = ref(false)
const showExpenseModal = ref(false)
const showCreateBouquetModal = ref(false)
const isEditing = ref(false)

//
const getEmptyFormData = () => ({
  id: null,
  name: '',
  price: '',
  quantity: 0,
  supplier_id: null
})

const getEmptyComingData = () => ({
  product_id: null,
  quantity: 0,
  received_date: new Date().toISOString().split('T')[0],
  supplier: '',
  comment: ''
})

const getEmptyExpenseData = () => ({
  product_id: null,
  quantity: 0,
  reason: 'Продажа',
  writeoff_date: new Date().toISOString().split('T')[0],
  comment: ''
})

const getEmptyBouquetData = () => ({
  name: '',
  price: 0,
  composition: [{ flower_id: null, quantity: 0 }],
  quantity: 1,
  description: '',
  user_id: null
})

const formData = ref(getEmptyFormData())
const comingData = ref(getEmptyComingData())
const expenseData = ref(getEmptyExpenseData())
const bouquetData = ref(getEmptyBouquetData())

// константы
const typeTabs = [
  { id: 'components', name: 'Цветы' },
  { id: 'bouquets', name: 'Готовые букеты' },
  { id: 'materials', name: 'Материалы' }
]





const allProducts = computed(() => {
  const flowers = (dataStore.flowers || []).map(f => ({
    ...f,
    uniqueId: `flower_${f.id}`,
    type: 'flower',
    supplier_name: f.supplier?.company_name || 'не указан'
  }))

  const bouquets = (dataStore.bouquets || []).map(b => ({
    ...b,
    uniqueId: `bouquet_${b.id}`,
    type: 'bouquet',
    supplier_name: null
  }))

  const materials = (dataStore.materials || []).map(m => ({
    ...m,
    uniqueId: `material_${m.id}`,
    type: 'material',
    supplier_name: m.supplier?.company_name || 'не указан'
  }))

  return [...flowers, ...bouquets, ...materials]
})

const currentProducts = computed(() => {
  const lists = {
    components: dataStore.flowers,
    bouquets: dataStore.bouquets,
    materials: dataStore.materials
  }
  return lists[activeTypeTab.value] || []
})


const getProductActions = (type = activeTypeTab.value) => ({
  create: {
    components: (data) => dataStore.create_flower(data),
    bouquets: (data) => dataStore.create_bouquet(data),
    materials: (data) => dataStore.create_material(data)
  }[type],
  update: {
    components: (id, data) => dataStore.update_flower(id, data),
    bouquets: (id, data) => dataStore.update_bouquet(id, data),
    materials: (id, data) => dataStore.update_material(id, data)
  }[type],
  delete: {
    components: (id) => dataStore.delete_flower(id),
    bouquets: (id) => dataStore.delete_bouquet(id),
    materials: (id) => dataStore.delete_material(id)
  }[type]
})

// основные методы
const loadData = async () => {
  await Promise.all([
    dataStore.get_flowers(searchQuery.value),
    dataStore.get_bouquets(searchQuery.value),
    dataStore.get_suppliers(),
    dataStore.get_materials(searchQuery.value),
    dataStore.get_users()
  ])
}

const changeTypeTab = async (tabId) => {
  activeTypeTab.value = tabId
  searchQuery.value = ''
  await loadData()
}

// работа с товарами
const saveProduct = async (data) => {
  if (!data.name || !data.price) {
    alert('Заполните обязательные поля (название и цена)')
    return
  }

  const actions = getProductActions()
  if (!actions) return

  const sendData = { name: data.name, price: data.price }

  // Для материалов и новых цветов нужно quantity
  if (!isEditing.value && activeTypeTab.value !== 'bouquets') {
    sendData.quantity = data.quantity || 0
  }

  // Для цветов и материалов можно указать поставщика
  if (activeTypeTab.value !== 'bouquets' && data.supplier_id) {
    sendData.supplier_id = data.supplier_id
  }

  try {
    if (isEditing.value) {
      await actions.update(data.id, sendData)
    } else {
      await actions.create(sendData)
    }
    closeAddModal()
    await loadData()
    alert(isEditing.value ? 'Товар обновлен' : 'Товар добавлен')
  } catch (error) {
    console.error('Ошибка сохранения:', error)
    alert('Ошибка при сохранении')
  }
}

const deleteProduct = async (product) => {
  if (!confirm(`Удалить товар "${product.name}"?`)) return

  const actions = getProductActions()
  if (!actions) return

  try {
    await actions.delete(product.id)
    await loadData()
  } catch (error) {
    console.error('Ошибка удаления:', error)
    alert('Ошибка при удалении')
  }
}

// приход расход
const findProduct = (productId, productType) => {
  return allProducts.value.find(p => p.id === productId && p.type === productType)
}

const handleStockMovement = async (data, isIncome) => {
  if (!data.product_id || !data.quantity) {
    alert('Выберите товар и укажите количество')
    return
  }

  const product = findProduct(data.product_id, data.product_type)
  if (!product) {
    alert('Товар не найден')
    return
  }

  const operation = isIncome ? 'incoming' : 'outgoing'
  const actionMap = {
    flower: {
      incoming: (id, d) => dataStore.incoming_flower(id, d),
      outgoing: (id, d) => dataStore.outgoing_flower(id, d)
    },
    material: {
      incoming: (id, d) => dataStore.incoming_material(id, d),
      outgoing: (id, d) => dataStore.outgoing_material(id, d)
    },
    bouquet: {
      incoming: async (id, d) => {
        const bouquet = dataStore.bouquets.find(b => b.id === id)
        await dataStore.update_bouquet(id, { quantity: (bouquet?.quantity || 0) + d.quantity })
      },
      outgoing: async (id, d) => {
        const bouquet = dataStore.bouquets.find(b => b.id === id)
        await dataStore.update_bouquet(id, { quantity: (bouquet?.quantity || 0) - d.quantity })
      }
    }
  }

  const action = actionMap[product.type]?.[operation]
  if (!action) {
    alert('Операция не поддерживается')
    return
  }

  try {
    await action(product.id, {
      quantity: data.quantity,
      reason: data.reason || (isIncome ? 'Поставка' : 'Расход'),
      user_id: data.user_id
    })

    if (isIncome) {
      showComingModal.value = false
    } else {
      showExpenseModal.value = false
    }
    await loadData()
    alert(`${isIncome ? 'Приход' : 'Расход'} оформлен успешно!`)
  } catch (error) {
    console.error('Ошибка:', error)
    alert(error.response?.data?.message || `Ошибка при оформлении ${isIncome ? 'прихода' : 'расхода'}`)
  }
}

const confirmComing = (data) => handleStockMovement(data, true)
const confirmExpense = (data) => handleStockMovement(data, false)

// сборка букета
const checkComponentsAvailability = (data) => {
  for (const item of data.composition) {
    if (!item.itemable_id || !item.quantity) {
      alert('Заполните все компоненты букета')
      return false
    }

    const requiredQty = item.quantity * data.quantity

    if (item.itemable_type === 'flower') {
      const flower = dataStore.flowers.find(f => f.id === item.itemable_id)
      if (!flower || (flower.quantity || 0) < requiredQty) {
        alert(`Недостаточно цветов "${flower?.name}" на складе!`)
        return false
      }
    } else if (item.itemable_type === 'material') {
      const material = dataStore.materials.find(m => m.id === item.itemable_id)
      if (!material || (material.quantity || 0) < requiredQty) {
        alert(`Недостаточно материала "${material?.name}" на складе!`)
        return false
      }
    }
  }
  return true
}

const confirmCreateBouquet = async (data) => {
  if (!data.name || !data.price) {
    alert('Заполните название и цену букета')
    return
  }
  if (!data.user_id) {
    alert('Выберите сотрудника, который собирает букет')
    return
  }

  if (!checkComponentsAvailability(data)) return

  try {
    const bouquetResult = await dataStore.create_bouquet({
      name: data.name,
      price: data.price,
      quantity: data.quantity,
      description: data.description,
      production_date: new Date().toISOString().split('T')[0]
    })

    const bouquetId = bouquetResult.data?.id || bouquetResult.id

    for (const item of data.composition) {
      await dataStore.create_bouquet_item({
        bouquet_id: bouquetId,
        itemable_id: item.itemable_id,
        itemable_type: item.itemable_type,
        flower_id: item.itemable_id,
        quantity: item.quantity * data.quantity,
        user_id: data.user_id
      })
    }

    // Списываем компоненты
    for (const item of data.composition) {
      if (item.itemable_type === 'flower') {
        const flower = dataStore.flowers.find(f => f.id === item.itemable_id)
        await dataStore.update_flower(flower.id, { quantity: (flower.quantity || 0) - (item.quantity * data.quantity) })
      } else if (item.itemable_type === 'material') {
        const material = dataStore.materials.find(m => m.id === item.itemable_id)
        await dataStore.update_material(material.id, { quantity: (material.quantity || 0) - (item.quantity * data.quantity) })
      }
    }

    closeCreateBouquetModal()
    await loadData()
    alert('Букет успешно собран!')
  } catch (error) {
    console.error('Ошибка сборки букета:', error)
    alert(error.response?.data?.errors ? JSON.stringify(error.response.data.errors) : 'Ошибка при сборке букета')
  }
}

// методы модальных окон
const openAddModal = () => {
  isEditing.value = false
  formData.value = getEmptyFormData()
  showAddModal.value = true
}

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

const closeAddModal = () => {
  showAddModal.value = false
  formData.value = getEmptyFormData()
}

const openComingModal = () => {
  comingData.value = getEmptyComingData()
  showComingModal.value = true
}

const openExpenseModal = () => {
  expenseData.value = getEmptyExpenseData()
  showExpenseModal.value = true
}

const openCreateBouquetModal = () => {
  bouquetData.value = getEmptyBouquetData()
  showCreateBouquetModal.value = true
}

const closeCreateBouquetModal = () => {
  showCreateBouquetModal.value = false
  bouquetData.value = getEmptyBouquetData()
}

// доп функции
const getQuantityClass = (quantity) => {
  if (!quantity || quantity <= 0) return 'out-of-stock'
  if (quantity < 10) return 'low-stock'
  return 'in-stock'
}

const getTypeName = () => {
  const names = {
    components: 'Цветок',
    bouquets: 'Букет',
    materials: 'Материал'
  }
  return names[activeTypeTab.value] || ''
}


onMounted(() => {
  loadData()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700&display=swap');

.warehouse-page {
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
  margin: 1.5rem 0 2rem 0;
  letter-spacing: -0.5px;
}

/* Кнопки действий */
.action-buttons {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  justify-content: center;
}

.btn-action {
  padding: 0.7rem 1.8rem;
  background: #ffffff;
  border: 2px solid #d9eb61;
  border-radius: 40px;
  cursor: pointer;
  font-size: 0.9rem;
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

/* Вкладки типов товаров */
.type-tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  justify-content: center;
}

.type-tabs button {
  padding: 0.6rem 1.8rem;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  border-radius: 40px;
  color: #4a5b4e;
  transition: all 0.3s ease;
}

.type-tabs button.active {
  background: #d9eb61;
  color: #2c3e2f;
}

.type-tabs button:hover:not(.active) {
  background: #f9cffd;
  color: #2c3e2f;
}

/* Фильтры */
.filters-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
}

.search-input {
  flex: 1;
  min-width: 250px;
  max-width: 400px;
  padding: 0.8rem 1.2rem;
  border: 2px solid #f5f5f7;
  border-radius: 40px;
  font-size: 0.9rem;
  font-family: 'Inter', sans-serif;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #d9eb61;
  box-shadow: 0 0 0 3px #d9eb6140;
}

.apply-btn {
  padding: 0.7rem 1.8rem;
  background: #d9eb61;
  border: none;
  border-radius: 40px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  font-family: 'Inter', sans-serif;
  color: #2c3e2f;
  transition: all 0.3s ease;
}

.apply-btn:hover {
  background: #c4db3a;
  transform: translateY(-2px);
}

/* Таблица */
.products-table-container {
  overflow-x: auto;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.products-table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'Inter', sans-serif;
}

.products-table th,
.products-table td {
  padding: 1rem 1.2rem;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.products-table th {
  background-color: #f9f9fb;
  font-weight: 700;
  font-size: 0.85rem;
  color: #4a5b4e;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.products-table tr:hover {
  background-color: #f9f9fb;
}

/* Бейджи типов (цветные) */
.type-badge {
  padding: 0.3rem 0.8rem;
  border-radius: 40px;
  font-size: 0.8rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}

.type-badge.components {
  background: #f9cffd;
  color: #8b3a8b;
}

.type-badge.bouquets {
  background: #d9eb61;
  color: #2c5e2c;
}

.type-badge.materials {
  background: #77b7d3;
  color: #1a3a4a;
}

/* Бейджи количества */
.quantity-badge {
  padding: 0.3rem 0.8rem;
  border-radius: 40px;
  font-size: 0.8rem;
  font-weight: 600;
}

.quantity-badge.in-stock {
  background: #d9eb6140;
  color: #2c5e2c;
}

.quantity-badge.low-stock {
  background: #f9cffd;
  color: #c44e3a;
}

.quantity-badge.out-of-stock {
  background: #f0f0f0;
  color: #999999;
}

/* Кнопки действий в таблице */
.edit-btn, .delete-btn {
  padding: 0.4rem 0.7rem;
  margin: 0 0.2rem;
  border: none;
  cursor: pointer;
  background: #f5f5f7;
  border-radius: 30px;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.edit-btn:hover {
  background: #d9eb61;
  transform: scale(1.05);
}

.delete-btn:hover {
  background: #f9cffd;
  transform: scale(1.05);
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

}

.error-message button {
  background: none;
  border: none;
  color: #e85d4a;
  cursor: pointer;
  font-size: 1rem;
}

.text-center {
  text-align: center;
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

  .section-title {
    font-size: 1.5rem;
  }

  .action-buttons {
    justify-content: center;
  }
}
</style>
