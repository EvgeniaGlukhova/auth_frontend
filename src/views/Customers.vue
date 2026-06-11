<template>
  <div class="customers-page">
    <!-- Верхняя панель с навигацией -->
    <div class="top-bar">
      <h1>Sunshine</h1>
      <div class="nav-tabs">
        <router-link to="/dashboard" class="nav-link">Главная</router-link>
        <router-link to="/warehouse" class="nav-link">Склад</router-link>
        <router-link to="/customers" class="nav-link active">Клиенты</router-link>
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
    <h2 class="section-title">Клиенты</h2>

    <!-- Кнопки действий -->
    <div class="action-buttons">
      <button @click="openAddModal" class="btn-action">Добавить клиента</button>
<!--      <button @click="openCallModal" class="btn-action">Позвонить</button>-->
<!--      <button @click="openSmsModal" class="btn-action">SMS</button>-->
    </div>

    <div class="filters-bar">
      <input
        type="text"
        v-model="searchQuery"
        placeholder="Поиск по названию..."
        class="search-input"
        @keyup.enter="applySearch"
      >
      <button @click="applySearch" class="apply-btn">Применить</button>
    </div>

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

    <!-- Модальное окно добавления/редактирования клиента -->
    <div v-if="showClientModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ isEditing ? 'Редактирование клиента' : 'Добавление нового клиента' }}</h3>
          <button class="close-btn" @click="closeModal">✕</button>
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
<!--          <button class="close-btn" @click="showCallModal = false">✕</button>-->
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
<!--          <button class="close-btn" @click="showSmsModal = false">✕</button>-->
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
      <button @click="dataStore.errorMessage = ''">✕</button>
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
  console.log('loadData, searchQuery:', searchQuery.value)
  await dataStore.get_clients(searchQuery.value)
}

// Применить поиск
const applySearch = async () => {
  console.log('applySearch, searchQuery:', searchQuery.value)
  console.log('Поиск:', searchQuery.value)
  await loadData()
  console.log('После загрузки, клиентов:', dataStore.clients?.length)
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

// // Открыть модалку звонка
// const openCallModal = () => {
//   showCallModal.value = true
// }
//
// // Открыть модалку SMS
// const openSmsModal = () => {
//   showSmsModal.value = true
// }

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
@import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700&display=swap');

.customers-page {
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

/* Профиль */
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

/* Таблица */
.table-container {
  overflow-x: auto;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.customers-table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'Inter', sans-serif;
}

.customers-table th,
.customers-table td {
  padding: 1rem 1.2rem;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.customers-table th {
  background-color: #f9f9fb;
  font-weight: 700;
  font-size: 0.85rem;
  color: #4a5b4e;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.customers-table tr:hover {
  background-color: #f9f9fb;
}

.full-name {
  font-weight: 600;
  color: #2c3e2f;
}

.contacts {
  line-height: 1.6;
}

.phone, .email, .address {
  font-size: 0.85rem;
  color: #000000;;
  margin: 0.2rem 0;
}

/* Кнопки действий в таблице */
.actions {
  white-space: nowrap;
}

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

/* Модальное окно */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: #ffffff;
  border-radius: 28px;
  padding: 1.5rem;
  min-width: 500px;
  max-width: 700px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.2);
}

.small-modal {
  min-width: 350px;
  max-width: 400px;
  text-align: center;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 0.8rem;
  border-bottom: 2px solid #f9cffd;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 700;
  color: #f9cffd;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999999;
  transition: all 0.2s ease;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.close-btn:hover {
  color: #f9cffd;
  background: #f9cffd20;
}

/* Форма */
.form-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-row .form-group {
  flex: 1;
  margin-bottom: 0;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  font-size: 0.85rem;
  color: #2c3e2f;
}

.form-input {
  width: 100%;
  padding: 0.7rem 1rem;
  border: 2px solid #f5f5f7;
  border-radius: 40px;
  font-size: 0.9rem;
  font-family: 'Inter', sans-serif;
  transition: all 0.3s ease;
  color: #2c3e2f;
  background: #ffffff;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #d9eb61;
  box-shadow: 0 0 0 3px #d9eb6140;
}

textarea.form-input {
  resize: vertical;
  border-radius: 20px;
}

/* Кнопки модального окна */
.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 0.8rem;
  margin-top: 1.5rem;
}

.cancel-btn, .confirm-btn {
  padding: 0.6rem 1.5rem;
  border: none;
  border-radius: 40px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
  font-family: 'Inter', sans-serif;
  transition: all 0.3s ease;
}

.cancel-btn {
  background: #f5f5f7;
  color: #4a5b4e;
}

.cancel-btn:hover {
  background: #e8e8ec;
  transform: translateY(-1px);
}

.confirm-btn {
  background: #d9eb61;
  color: #2c3e2f;
  box-shadow: 0 2px 6px rgba(217, 235, 97, 0.3);
}

.confirm-btn:hover {
  background: #c4db3a;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(217, 235, 97, 0.4);
}

.call-content, .sms-content {
  text-align: center;
  padding: 1.5rem;
  color: #2c3e2f;
}

.call-note, .sms-note {
  color: #999999;
  font-size: 0.75rem;
  margin-top: 0.5rem;
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

  .action-buttons {
    flex-direction: column;
    align-items: center;
  }

  .form-row {
    flex-direction: column;
    gap: 0;
  }

  .modal-content {
    min-width: auto;
  }
}
</style>
