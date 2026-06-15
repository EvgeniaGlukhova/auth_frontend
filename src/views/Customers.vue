<template>
  <div class="customers-page">
    <Header />

    <h2 class="section-title">Клиенты</h2>

    <div class="action-buttons">
      <button @click="openAddModal" class="btn-action">Добавить клиента</button>
    </div>

    <div class="filters-bar">
      <input
        type="text"
        v-model="searchQuery"
        placeholder="Поиск по имени или телефону..."
        class="search-input"
        @keyup.enter="applySearch"
      >
      <button @click="applySearch" class="apply-btn">Применить</button>
    </div>

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

    <AddClientModal
      :show="showClientModal"
      :is-editing="isEditing"
      :client-data="formData"
      @close="closeModal"
      @save="saveClient"
    />

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
import Header from '../components/Header.vue'
import AddClientModal from '../components/customers/AddClientModal.vue'

const dataStore = useDataStore()
const authStore = useAuthStore()

//  Состояние
const searchQuery = ref('')
const showClientModal = ref(false)
const isEditing = ref(false)
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


const clientsList = computed(() => {
  return dataStore.clients || []
})

//  Методы
const getFullName = (client) => {
  return `${client.surname || ''} ${client.name || ''} ${client.patronymic || ''}`.trim()
}

const loadData = async () => {
  await dataStore.get_clients(searchQuery.value)
}

const applySearch = async () => {
  await loadData()
}

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

const closeModal = () => {
  showClientModal.value = false
}

const saveClient = async (data) => {
  try {
    if (isEditing.value) {
      await dataStore.update_client(data.id, data)
    } else {
      await dataStore.create_client(data)
    }
    closeModal()
    await loadData()
    alert(isEditing.value ? 'Клиент обновлён' : 'Клиент добавлен')
  } catch (error) {
    console.error('Ошибка сохранения:', error)
    alert('Ошибка при сохранении')
  }
}

const deleteClient = async (client) => {
  if (!confirm(`Удалить клиента "${getFullName(client)}"?`)) return

  try {
    await dataStore.delete_client(client.id)
    await loadData()
  } catch (error) {
    console.error('Ошибка удаления:', error)
    alert('Ошибка при удалении')
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
