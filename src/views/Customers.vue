<template>
  <div class="customers-page">
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
      <button @click="$router.push('/warehouse')">Склад</button>
      <button class="active">Клиенты</button>
      <button @click="$router.push('/orders')">Заказы</button>
      <button @click="$router.push('/analytics')">Аналитика</button>
    </div>

    <!-- Заголовок раздела -->
    <h2 class="section-title">Клиенты</h2>

    <!-- Кнопки действий -->
    <div class="action-buttons">
      <button @click="openAddModal" class="btn-primary">Добавить клиента</button>
      <button @click="openCallModal" class="btn-primary">Позвонить</button>
      <button @click="openSmsModal" class="btn-primary">SMS</button>
    </div>

    <!-- Поиск и фильтр -->
<!--    <div class="filters-bar">-->
<!--      <input-->
<!--        type="text"-->
<!--        v-model="searchQuery"-->
<!--        placeholder="Поиск по имени, телефону или email..."-->
<!--        class="search-input"-->
<!--        @keyup.enter="loadData"-->
<!--      >-->
<!--      <select v-model="filterType" class="filter-select">-->
<!--        <option value="all">Все клиенты</option>-->
<!--        <option value="has_orders">С заказами</option>-->
<!--        <option value="no_orders">Без заказов</option>-->
<!--      </select>-->
<!--      <button @click="loadData" class="apply-btn">Применить</button>-->
<!--    </div>-->

    <!-- Таблица клиентов -->
    <div class="table-container">
      <table class="customers-table">
        <thead>
        <tr>
          <th>ФИО</th>
          <th>Контакты</th>
          <th>Действия</th>
        </tr>
        </thead>
        <tbody>
        <tr v-if="dataStore.loading">
          <td colspan="3" class="text-center">Загрузка...</td>
        </tr>
        <tr v-else-if="clientsList.length === 0">
          <td colspan="3" class="text-center">Нет клиентов</td>
        </tr>
        <tr v-else v-for="client in clientsList" :key="client.id">
          <td class="full-name">
            <strong>{{ getFullName(client) }}</strong>
          </td>
          <td class="contacts">
            <div class="phone">Тел: {{ client.phone || '—' }}</div>
            <div class="email">Email: {{ client.email || '—' }}</div>
            <div class="address" v-if="client.address">Адрес: {{ client.address }}</div>
          </td>
          <td class="actions">
            <button @click="editClient(client)" class="edit-btn">Редактировать</button>
            <button @click="deleteClient(client)" class="delete-btn">Удалить</button>
          </td>
        </tr>
        </tbody>
      </table>
    </div>

<!--    &lt;!&ndash; Информация о количестве &ndash;&gt;-->
<!--    <div class="info-footer">-->
<!--      <span>Всего клиентов: {{ dataStore.clients_total }}</span>-->
<!--    </div>-->

    <!-- Модальное окно добавления/редактирования клиента -->
    <div v-if="showClientModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ isEditing ? 'Редактирование клиента' : 'Добавление нового клиента' }}</h3>
          <button class="close-btn" @click="closeModal">X</button>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Фамилия:</label>
            <input v-model="formData.surname" type="text" class="form-input" placeholder="Иванова">
          </div>

          <div class="form-group">
            <label>Имя:</label>
            <input v-model="formData.name" type="text" class="form-input" placeholder="Анна">
          </div>

          <div class="form-group">
            <label>Отчество:</label>
            <input v-model="formData.patronymic" type="text" class="form-input" placeholder="Петровна">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Телефон:</label>
            <input v-model="formData.phone" type="text" class="form-input" placeholder="+7 999 123-45-67">
          </div>

          <div class="form-group">
            <label>Email:</label>
            <input v-model="formData.email" type="email" class="form-input" placeholder="anna@mail.ru">
          </div>
        </div>

        <div class="form-group">
          <label>Адрес:</label>
          <input v-model="formData.address" type="text" class="form-input" placeholder="г. Сургут, ул. Ленина, д. 1, кв. 10">
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Дата рождения:</label>
            <input v-model="formData.birth_date" type="date" class="form-input">
          </div>
        </div>

        <div class="form-group">
          <label>Комментарий:</label>
          <textarea v-model="formData.comments" class="form-input" rows="3" placeholder="Предпочитает розы, аллергия на лилии"></textarea>
        </div>

        <div class="modal-buttons">
          <button @click="closeModal" class="cancel-btn">Отмена</button>
          <button @click="saveClient" class="confirm-btn">Сохранить</button>
        </div>
      </div>
    </div>

<!--    &lt;!&ndash; Модальное окно звонка (заглушка) &ndash;&gt;-->
<!--    <div v-if="showCallModal" class="modal-overlay" @click="showCallModal = false">-->
<!--      <div class="modal-content small-modal" @click.stop>-->
<!--        <div class="modal-header">-->
<!--          <h3>Позвонить клиенту</h3>-->
<!--          <button class="close-btn" @click="showCallModal = false">X</button>-->
<!--        </div>-->
<!--        <div class="call-content">-->
<!--          <p>Функция звонка в разработке</p>-->
<!--          <p class="call-note">Вы сможете звонить клиентам через IP-телефонию</p>-->
<!--        </div>-->
<!--        <div class="modal-buttons">-->
<!--          <button @click="showCallModal = false" class="confirm-btn">Закрыть</button>-->
<!--        </div>-->
<!--      </div>-->
<!--    </div>-->

<!--    &lt;!&ndash; Модальное окно SMS (заглушка) &ndash;&gt;-->
<!--    <div v-if="showSmsModal" class="modal-overlay" @click="showSmsModal = false">-->
<!--      <div class="modal-content small-modal" @click.stop>-->
<!--        <div class="modal-header">-->
<!--          <h3>Отправить SMS</h3>-->
<!--          <button class="close-btn" @click="showSmsModal = false">X</button>-->
<!--        </div>-->
<!--        <div class="sms-content">-->
<!--          <p>Функция SMS-рассылки в разработке</p>-->
<!--          <p class="sms-note">Вы сможете отправлять SMS клиентам</p>-->
<!--        </div>-->
<!--        <div class="modal-buttons">-->
<!--          <button @click="showSmsModal = false" class="confirm-btn">Закрыть</button>-->
<!--        </div>-->
<!--      </div>-->
<!--    </div>-->

    <!-- Сообщение об ошибке -->
    <div v-if="dataStore.errorMessage" class="error-message">
      {{ dataStore.errorMessage }}
      <button @click="dataStore.errorMessage = ''">X</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDataStore } from '../stores/dataStore'
import { useAuthStore } from '@/stores/authStore.js'

const dataStore = useDataStore()

// Состояние
const searchQuery = ref('')
const filterType = ref('all')
const showClientModal = ref(false)
const showCallModal = ref(false)
const showSmsModal = ref(false)
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

// Форма
const formData = ref({
  id: null,
  name: '',
  patronymic: '',
  surname: '',
  email: '',
  phone: '',
  address: '',
  birth_date: '',
  comments: ''
})

// Список клиентов
const clientsList = computed(() => {
  let clients = dataStore.clients || []

  if (filterType.value === 'has_orders') {
    clients = clients.filter(c => c.orders_count > 0)
  } else if (filterType.value === 'no_orders') {
    clients = clients.filter(c => !c.orders_count || c.orders_count === 0)
  }

  return clients
})

// Полное имя
const getFullName = (client) => {
  return `${client.surname || ''} ${client.name || ''} ${client.patronymic || ''}`.trim()
}

// Загрузка данных
const loadData = async () => {
  await dataStore.get_clients(searchQuery.value)
}

// Открыть модалку добавления
const openAddModal = () => {
  isEditing.value = false
  formData.value = {
    id: null,
    name: '',
    patronymic: '',
    surname: '',
    email: '',
    phone: '',
    address: '',
    birth_date: '',
    comments: ''
  }
  showClientModal.value = true
}

// Открыть модалку звонка
const openCallModal = () => {
  showCallModal.value = true
}

// Открыть модалку SMS
const openSmsModal = () => {
  showSmsModal.value = true
}

// Редактировать клиента
const editClient = (client) => {
  isEditing.value = true
  formData.value = {
    id: client.id,
    name: client.name || '',
    patronymic: client.patronymic || '',
    surname: client.surname || '',
    email: client.email || '',
    phone: client.phone || '',
    address: client.address || '',
    birth_date: client.birth_date || '',
    comments: client.comments || ''
  }
  showClientModal.value = true
}

// Сохранить клиента
const saveClient = async () => {
  if (!formData.value.surname || !formData.value.name) {
    alert('Заполните обязательные поля (Фамилия и Имя)')
    return
  }

  const data = {
    surname: formData.value.surname,
    name: formData.value.name,
    patronymic: formData.value.patronymic,
    email: formData.value.email,
    phone: formData.value.phone,
    address: formData.value.address,
    birth_date: formData.value.birth_date,
    comments: formData.value.comments
  }

  try {
    if (isEditing.value) {
      await dataStore.update_client(formData.value.id, data)
    } else {
      await dataStore.create_client(data)
    }
    closeModal()
    await loadData()
  } catch (error) {
    console.error('Ошибка сохранения:', error)
  }
}

// Удалить клиента
const deleteClient = async (client) => {
  if (confirm(`Удалить клиента "${getFullName(client)}"?`)) {
    try {
      await dataStore.delete_client(client.id)
      await loadData()
    } catch (error) {
      console.error('Ошибка удаления:', error)
    }
  }
}

// Закрыть модалку
const closeModal = () => {
  showClientModal.value = false
  formData.value = {
    id: null,
    name: '',
    patronymic: '',
    surname: '',
    email: '',
    phone: '',
    address: '',
    birth_date: '',
    comments: ''
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.customers-page {
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

.filters-bar {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: center;
}

.search-input {
  flex: 1;
  min-width: 250px;
  padding: 10px;
  border: 1px solid #cccccc;
  border-radius: 6px;
  font-size: 14px;
  color: #000000;
}

.search-input::placeholder {
  color: #999999;
}

.filter-select {
  padding: 10px;
  border: 1px solid #cccccc;
  border-radius: 6px;
  background: #e0e0e0;
  color: #000000;
  min-width: 150px;
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

.table-container {
  overflow-x: auto;
}

.customers-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.customers-table th,
.customers-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
  color: #000000;
}

.customers-table th {
  background-color: #f0f0f0;
  font-weight: 600;
  color: #000000;
}

.customers-table tr:hover {
  background-color: #f5f5f5;
}

.full-name {
  width: 250px;
}

.contacts {
  line-height: 1.6;
}

.phone, .email, .address {
  font-size: 14px;
  color: #000000;
}

.actions {
  width: 160px;
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
}

.info-footer {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
  text-align: right;
  color: #000000;
}

/* Модальное окно */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 25px;
  min-width: 600px;
  max-width: 800px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.small-modal {
  min-width: 400px;
  max-width: 450px;
  text-align: center;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
  color: #000000;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #999999;
}

.close-btn:hover {
  color: #000000;
}

.form-row {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}

.form-row .form-group {
  flex: 1;
  margin-bottom: 0;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #000000;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #cccccc;
  border-radius: 6px;
  font-size: 14px;
  color: #000000;
}

textarea.form-input {
  resize: vertical;
  font-family: inherit;
}

.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.cancel-btn, .confirm-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  background-color: #e0e0e0;
  color: #000000;
}

.cancel-btn:hover, .confirm-btn:hover {
  background-color: #cccccc;
}

.call-content, .sms-content {
  text-align: center;
  padding: 20px;
  color: #000000;
}

.call-note, .sms-note {
  color: #666666;
  font-size: 12px;
  margin-top: 10px;
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
