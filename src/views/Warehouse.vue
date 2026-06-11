<template>
  <div class="warehouse-page">
    <!-- Верхняя панель с навигацией -->
    <div class="top-bar">
      <h1>Sunshine</h1>
      <div class="nav-tabs">
        <router-link to="/dashboard" class="nav-link">Главная</router-link>
        <router-link to="/warehouse" class="nav-link active">Склад</router-link>
        <router-link to="/customers" class="nav-link">Клиенты</router-link>
        <router-link to="/orders" class="nav-link">Заказы</router-link>
        <router-link to="/analytics" class="nav-link">Аналитика</router-link>
      </div>
      <div class="search-profile">
        <div class="user-details">
          <span class="user-name">{{ authStore.user?.email?.split('@')[0] || 'Сотрудник' }}</span>
          <span class="user-role">{{ getRoleName() }}</span>
        </div>
<!--        <router-link to="/dashboard" class="logout-btn">Выйти</router-link>-->
      </div>
    </div>

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
              <template v-if="activeTypeTab === 'components'">Цветок</template>
              <template v-else-if="activeTypeTab === 'bouquets'">Букет</template>
              <template v-else-if="activeTypeTab === 'materials'">Материал</template>
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
  description: '',
  user_id: null
})

// Вкладки
const typeTabs = [
  { id: 'components', name: 'Цветы' },
  { id: 'bouquets', name: 'Готовые букеты' },
  { id: 'materials', name: 'Материалы' }
]

// Все товары для выпадающих списков
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

// Текущие товары в зависимости от вкладки
const currentProducts = computed(() => {
  if (activeTypeTab.value === 'components') {
    return dataStore.flowers || []
  } else if (activeTypeTab.value === 'bouquets') {
    return dataStore.bouquets || []
  } else if (activeTypeTab.value === 'materials') {
    return dataStore.materials || []
  }
  return []
})



// Загрузка данных
const loadData = async () => {
  await Promise.all([
    dataStore.get_flowers(searchQuery.value),
    dataStore.get_bouquets(searchQuery.value),
    dataStore.get_suppliers(),
    dataStore.get_materials(searchQuery.value),
    dataStore.get_users()
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

  // Для материалов нужно передавать type
  if (activeTypeTab.value === 'materials') {
    sendData.quantity = data.quantity || 0
  }

  if (!isEditing.value && activeTypeTab.value === 'components') {
    sendData.quantity = data.quantity || 0
  }

  if ((activeTypeTab.value === 'components' || activeTypeTab.value === 'materials') && data.supplier_id) {
    sendData.supplier_id = data.supplier_id
  }

  try {
    if (isEditing.value) {
      if (activeTypeTab.value === 'components') {
        await dataStore.update_flower(data.id, sendData)
      } else if (activeTypeTab.value === 'bouquets') {
        await dataStore.update_bouquet(data.id, sendData)
      } else if (activeTypeTab.value === 'materials') {
        await dataStore.update_material(data.id, sendData)
      }
    } else {
      if (activeTypeTab.value === 'components') {
        await dataStore.create_flower(sendData)
      } else if (activeTypeTab.value === 'bouquets') {
        await dataStore.create_bouquet(sendData)
      } else if (activeTypeTab.value === 'materials') {
        await dataStore.create_material(sendData)
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

  // Ищем товар по id И по типу
  const product = allProducts.value.find(p => p.id === data.product_id && p.type === data.product_type)
  if (!product) {
    alert('Товар не найден')
    return
  }

  try {
    if (product.type === 'flower') {
      await dataStore.incoming_flower(product.id, {
        quantity: data.quantity,
        reason: data.reason || 'Поставка от поставщика',
        user_id: data.user_id
      })
    } else if (product.type === 'material') {
      await dataStore.incoming_material(product.id, {
        quantity: data.quantity,
        reason: data.reason || 'Поставка материала',
        user_id: data.user_id
      })
    } else {
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

  const product = allProducts.value.find(p => p.id === data.product_id && p.type === data.product_type)
  if (!product) {
    alert('Товар не найден')
    return
  }

  try {
    if (product.type === 'flower') {
      await dataStore.outgoing_flower(product.id, {
        quantity: data.quantity,
        reason: data.reason || 'Расход',
        user_id: data.user_id
      })
    } else if (product.type === 'material') {
      await dataStore.outgoing_material(product.id, {
        quantity: data.quantity,
        reason: data.reason || 'Расход материала',
        user_id: data.user_id
      })
    } else {
      const newQty = (product.quantity || 0) - data.quantity
      await dataStore.update_bouquet(product.id, { quantity: newQty })
    }

    showExpenseModal.value = false
    await loadData()
    alert('Расход оформлен успешно!')
  } catch (error) {
    console.error('Ошибка расхода:', error)
    alert(error.response?.data?.message || 'Ошибка при списании')
  }
}

// Подтвердить сборку букета
// const confirmCreateBouquet = async (data) => {
//   if (!data.name || !data.price) {
//     alert('Заполните название и цену букета')
//     return
//   }
//   if (!data.user_id) {
//     alert('Выберите сотрудника, который собирает букет')
//     return
//   }
//
//   // Проверяем наличие всех компонентов
//   for (const item of data.composition) {
//     if (!item.itemable_id || !item.quantity) {
//       alert('Заполните все компоненты букета')
//       return
//     }
//
//     if (item.itemable_type === 'flower') {
//       const flower = dataStore.flowers.find(f => f.id === item.itemable_id)
//       const requiredQty = item.quantity * data.quantity
//       if (!flower || (flower.quantity || 0) < requiredQty) {
//         alert(`Недостаточно цветов "${flower?.name}" на складе!`)
//         return
//       }
//     } else if (item.itemable_type === 'material') {
//       const material = dataStore.materials.find(m => m.id === item.itemable_id)
//       const requiredQty = item.quantity * data.quantity
//       if (!material || (material.quantity || 0) < requiredQty) {
//         alert(`Недостаточно материала "${material?.name}" на складе!`)
//         return
//       }
//     }
//   }
//
//   try {
//     // 1. Создаем букет
//     const bouquetResult = await dataStore.create_bouquet({
//       name: data.name,
//       price: data.price,
//       quantity: data.quantity,
//       description: data.description,
//       production_date: new Date().toISOString().split('T')[0]
//     })
//
//     const bouquetId = bouquetResult.data?.id || bouquetResult.id
//
//     // 2. Добавляем компоненты в букет (bouquet_items)
//     for (const item of data.composition) {
//       await dataStore.create_bouquet_item({
//         bouquet_id: bouquetId,
//         itemable_id: item.itemable_id,
//         itemable_type: item.itemable_type,  // 'flower' или 'material'
//         quantity: item.quantity * data.quantity,
//         user_id: data.user_id
//       })
//     }
//
//     // 3. Списываем компоненты со склада
//     for (const item of data.composition) {
//       if (item.itemable_type === 'flower') {
//         const flower = dataStore.flowers.find(f => f.id === item.itemable_id)
//         const newQty = (flower.quantity || 0) - (item.quantity * data.quantity)
//         await dataStore.update_flower(flower.id, { quantity: newQty })
//       } else if (item.itemable_type === 'material') {
//         const material = dataStore.materials.find(m => m.id === item.itemable_id)
//         const newQty = (material.quantity || 0) - (item.quantity * data.quantity)
//         await dataStore.update_material(material.id, { quantity: newQty })
//       }
//     }
//
//     closeCreateBouquetModal()
//     await loadData()
//     alert('Букет успешно собран!')
//   } catch (error) {
//     console.error('Ошибка сборки букета:', error)
//     alert('Ошибка при сборке букета')
//   }
// }

// Подтвердить сборку букета
const confirmCreateBouquet = async (data) => {
  if (!data.name || !data.price) {
    alert('Заполните название и цену букета')
    return
  }
  if (!data.user_id) {
    alert('Выберите сотрудника, который собирает букет')
    return
  }

  // Проверяем наличие всех компонентов
  for (const item of data.composition) {
    if (!item.itemable_id || !item.quantity) {
      alert('Заполните все компоненты букета')
      return
    }

    if (item.itemable_type === 'flower') {
      const flower = dataStore.flowers.find(f => f.id === item.itemable_id)
      const requiredQty = item.quantity * data.quantity
      if (!flower || (flower.quantity || 0) < requiredQty) {
        alert(`Недостаточно цветов "${flower?.name}" на складе!`)
        return
      }
    } else if (item.itemable_type === 'material') {
      const material = dataStore.materials.find(m => m.id === item.itemable_id)
      const requiredQty = item.quantity * data.quantity
      if (!material || (material.quantity || 0) < requiredQty) {
        alert(`Недостаточно материала "${material?.name}" на складе!`)
        return
      }
    }
  }

  try {
    // 1. Создаем букет
    const bouquetResult = await dataStore.create_bouquet({
      name: data.name,
      price: data.price,
      quantity: data.quantity,
      description: data.description,
      production_date: new Date().toISOString().split('T')[0]
    })

    const bouquetId = bouquetResult.data?.id || bouquetResult.id

    // 2. Добавляем компоненты в букет (bouquet_items)
    for (const item of data.composition) {
      const payload = {
        bouquet_id: bouquetId,
        itemable_id: item.itemable_id,
        itemable_type: item.itemable_type,
        flower_id: item.itemable_id,
        quantity: item.quantity * data.quantity,
        user_id: data.user_id
      }

      console.log('=== ОТПРАВКА В create_bouquet_item ===')
      console.log('Payload:', JSON.stringify(payload, null, 2))

      await dataStore.create_bouquet_item(payload)
    }

    // 3. Списываем компоненты со склада
    for (const item of data.composition) {
      if (item.itemable_type === 'flower') {
        const flower = dataStore.flowers.find(f => f.id === item.itemable_id)
        const newQty = (flower.quantity || 0) - (item.quantity * data.quantity)
        await dataStore.update_flower(flower.id, { quantity: newQty })
      } else if (item.itemable_type === 'material') {
        const material = dataStore.materials.find(m => m.id === item.itemable_id)
        const newQty = (material.quantity || 0) - (item.quantity * data.quantity)
        await dataStore.update_material(material.id, { quantity: newQty })
      }
    }

    closeCreateBouquetModal()
    await loadData()
    alert('Букет успешно собран!')
  } catch (error) {
    console.error('Ошибка сборки букета:', error)
    if (error.response?.data?.errors) {
      console.error('Ошибки валидации:', error.response.data.errors)
      alert('Ошибка: ' + JSON.stringify(error.response.data.errors))
    } else {
      alert('Ошибка при сборке букета')
    }
  }
}

// Удалить товар
const deleteProduct = async (product) => {
  if (confirm(`Удалить товар "${product.name}"?`)) {
    try {
      if (activeTypeTab.value === 'components') {
        await dataStore.delete_flower(product.id)
      } else if (activeTypeTab.value === 'bouquets') {
        await dataStore.delete_bouquet(product.id)
      } else if (activeTypeTab.value === 'materials') {
        await dataStore.delete_material(product.id)
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
@import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700&display=swap');

.warehouse-page {
  padding: 2rem;
  max-width: 1400px;
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

/* Правая панель */
.search-profile {
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
