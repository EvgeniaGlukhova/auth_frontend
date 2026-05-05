<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content employees-modal" @click.stop>
      <div class="modal-header">
        <h3>Управление сотрудниками</h3>
        <button class="close-btn" @click="$emit('close')">X</button>
      </div>

      <div class="modal-body">
        <!-- Кнопка добавления (только для администраторов) -->
        <div class="add-button-container" v-if="isAdmin">
          <button @click="openAddModal" class="add-btn">Добавить сотрудника</button>
        </div>

        <!-- Сообщение об ошибке доступа -->
        <div v-if="accessError" class="error-message-box">
          {{ accessError }}
        </div>

        <!-- Таблица сотрудников -->
        <div class="table-container">
          <table class="employees-table">
            <thead>
            <tr>
              <th>ID</th>
              <th>ФИО</th>
              <th>Должность</th>
              <th>Телефон</th>
              <th>Email</th>
              <th>Действия</th>
            </tr>
            </thead>
            <tbody>
            <tr v-if="dataStore.loading">
              <td colspan="6" class="text-center">Загрузка...</td>
            </tr>
            <tr v-else-if="employees.length === 0">
              <td colspan="6" class="text-center">Нет сотрудников</td>
            </tr>
            <tr v-else v-for="employee in employees" :key="employee.id">
              <td>{{ employee.id }}</td>
              <td>{{ getFullName(employee) }}</td>
              <td>{{ getRoleName(employee.role_id) }}</td>
              <td>{{ employee.phone || '—' }}</td>
              <td>{{ employee.email }}</td>
              <td class="actions">
                <button
                  @click="editEmployee(employee)"
                  class="edit-btn"
                  :disabled="!isAdmin"
                  :title="!isAdmin ? 'Доступно только администратору' : ''"
                >
                  Редактировать
                </button>
                <button
                  @click="deleteEmployee(employee)"
                  class="delete-btn"
                  :disabled="!isAdmin"
                  :title="!isAdmin ? 'Доступно только администратору' : ''"
                >
                  Удалить
                </button>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="$emit('close')" class="cancel-btn">Закрыть</button>
      </div>
    </div>

    <!-- Модальное окно добавления/редактирования сотрудника -->
    <div v-if="showAddEditModal" class="modal-sub-overlay" @click="closeAddEditModal">
      <div class="modal-sub-content" @click.stop>
        <div class="modal-header">
          <h3>{{ isEditing ? 'Редактирование сотрудника' : 'Добавление сотрудника' }}</h3>
          <button class="close-btn" @click="closeAddEditModal">X</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>Фамилия:</label>
            <input v-model="formData.surname" type="text" class="form-input" placeholder="Введите фамилию">
          </div>

          <div class="form-group">
            <label>Имя:</label>
            <input v-model="formData.name" type="text" class="form-input" placeholder="Введите имя">
          </div>

          <div class="form-group">
            <label>Отчество:</label>
            <input v-model="formData.patronymic" type="text" class="form-input" placeholder="Введите отчество (необязательно)">
          </div>

          <div class="form-group">
            <label>Должность:</label>
            <select v-model="formData.role_id" class="form-input">
              <option :value="null">Выберите должность</option>
              <option :value="1">Администратор</option>
              <option :value="2">Флорист</option>
              <option :value="3">Продавец</option>
            </select>
          </div>

          <div class="form-group">
            <label>Телефон:</label>
            <input v-model="formData.phone" type="text" class="form-input" placeholder="+7 XXX XXX-XX-XX">
          </div>

          <div class="form-group">
            <label>Email:</label>
            <input v-model="formData.email" type="email" class="form-input" placeholder="example@mail.com">
          </div>

          <div class="form-group">
            <label>Логин для входа:</label>
            <input v-model="formData.email" type="text" class="form-input" placeholder="email используется как логин">
          </div>

          <div class="form-group">
            <label>Пароль:</label>
            <input v-model="formData.password" type="password" class="form-input" placeholder="Введите пароль">
            <small v-if="isEditing" class="hint">Оставьте пустым, чтобы не менять пароль</small>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeAddEditModal" class="cancel-btn">Отмена</button>
          <button @click="saveEmployee" class="save-btn">Сохранить</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useDataStore } from '../../stores/dataStore'

import { useAuthStore } from '../../stores/authStore'

const authStore = useAuthStore()

const dataStore = useDataStore()

// Состояния
const showAddEditModal = ref(false)
const isEditing = ref(false)
const employees = ref([])
const accessError = ref('')

// Проверка прав текущего пользователя - используем authStore
const isAdmin = computed(() => {
  return authStore.user?.role === 'administrator' || authStore.user?.role_id === 1
})

// Роли
const roleNames = {
  1: 'Администратор',
  2: 'Флорист',
  3: 'Продавец'
}

// Форма для добавления/редактирования
const formData = ref({
  id: null,
  surname: '',
  name: '',
  patronymic: '',
  role_id: null,
  phone: '',
  email: '',
  password: ''
})


// Загрузка сотрудников из хранилища
const loadEmployees = async () => {

  accessError.value = ''
  await dataStore.get_users()
  employees.value = [...dataStore.users]

  console.log('Загружено сотрудников:', employees.value.length)
}

// Загрузка при монтировании
onMounted(() => {
  loadEmployees()
})


// Получить полное имя
const getFullName = (employee) => {
  const parts = [employee.surname, employee.name, employee.patronymic].filter(p => p)
  return parts.join(' ') || '—'
}

// Получить название должности
const getRoleName = (roleId) => {
  return roleNames[roleId] || 'Не указана'
}

// Открыть модалку добавления
const openAddModal = () => {
  if (!isAdmin.value) {
    alert('У вас нет прав для добавления сотрудников')
    return
  }
  isEditing.value = false
  formData.value = {
    id: null,
    surname: '',
    name: '',
    patronymic: '',
    role_id: null,
    phone: '',
    email: '',
    password: ''
  }
  showAddEditModal.value = true
}

// Редактировать сотрудника
const editEmployee = (employee) => {
  if (!isAdmin.value) {
    alert('У вас нет прав для редактирования сотрудников')
    return
  }
  isEditing.value = true
  formData.value = {
    id: employee.id,
    surname: employee.surname || '',
    name: employee.name || '',
    patronymic: employee.patronymic || '',
    role_id: employee.role_id,
    phone: employee.phone || '',
    email: employee.email || '',
    password: ''
  }
  showAddEditModal.value = true
}

// Закрыть модалку добавления/редактирования
const closeAddEditModal = () => {
  showAddEditModal.value = false
  formData.value = {
    id: null,
    surname: '',
    name: '',
    patronymic: '',
    role_id: null,
    phone: '',
    email: '',
    password: ''
  }
}

// Сохранить сотрудника
const saveEmployee = async () => {
  // Валидация
  if (!formData.value.surname || !formData.value.name) {
    alert('Заполните фамилию и имя')
    return
  }
  if (!formData.value.email) {
    alert('Введите email')
    return
  }
  if (!isEditing.value && !formData.value.password) {
    alert('Введите пароль')
    return
  }

  const data = {
    surname: formData.value.surname,
    name: formData.value.name,
    patronymic: formData.value.patronymic || null,
    role_id: formData.value.role_id,
    phone: formData.value.phone || null,
    email: formData.value.email
  }

  if (!isEditing.value || formData.value.password) {
    data.password = formData.value.password
  }

  try {
    if (isEditing.value) {
      await dataStore.update_user(formData.value.id, data)
      alert('Сотрудник обновлен')
    } else {
      await dataStore.create_user(data)
      alert('Сотрудник добавлен')
    }
    closeAddEditModal()
    await loadEmployees()
  } catch (error) {
    console.error('Ошибка сохранения:', error)
    // Показываем сообщение об ошибке от сервера
    if (error.response?.data?.message) {
      alert(error.response.data.message)
    } else if (dataStore.errorMessage) {
      alert(dataStore.errorMessage)
    } else {
      alert('Ошибка при сохранении')
    }
  }
}

// Удалить сотрудника
const deleteEmployee = async (employee) => {
  if (!isAdmin.value) {
    alert('У вас нет прав для удаления сотрудников')
    return
  }

  if (confirm(`Удалить сотрудника "${getFullName(employee)}"?`)) {
    try {
      await dataStore.delete_user(employee.id)
      alert('Сотрудник удален')
      await loadEmployees()
    } catch (error) {
      console.error('Ошибка удаления:', error)
      if (error.response?.data?.message) {
        alert(error.response.data.message)
      } else if (dataStore.errorMessage) {
        alert(dataStore.errorMessage)
      } else {
        alert('Ошибка при удалении')
      }
    }
  }
}

// Загрузка при монтировании
onMounted(() => {
  loadEmployees()
})
</script>

<style scoped>
/* Добавляем стили для сообщения об ошибке доступа */
.error-message-box {
  background-color: #ffebee;
  border: 1px solid #f44336;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 20px;
  color: #c62828;
  text-align: center;
}

/* Стили для disabled кнопок */
.edit-btn:disabled, .delete-btn:disabled, .add-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.edit-btn:disabled:hover, .delete-btn:disabled:hover, .add-btn:disabled:hover {
  background: #e0e0e0;
  transform: none;
}

/* Остальные стили остаются без изменений */
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

.employees-modal {
  max-width: 1000px;
  width: 90%;
  max-height: 85vh;
  overflow-y: auto;
}

.modal-content {
  background: white;
  border-radius: 16px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
  background: #f0f0f0;
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
}

.close-btn:hover {
  color: #000000;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 16px 20px;
  border-top: 1px solid #e0e0e0;
  background: #f0f0f0;
}

.add-button-container {
  margin-bottom: 20px;
  text-align: right;
}

.add-btn {
  padding: 10px 20px;
  background: #e0e0e0;
  color: #000000;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.add-btn:hover {
  background: #cccccc;
  transform: scale(1.02);
}

.table-container {
  overflow-x: auto;
}

.employees-table {
  width: 100%;
  border-collapse: collapse;
}

.employees-table th,
.employees-table td {
  padding: 12px 10px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
  color: #000000;
}

.employees-table th {
  background: #f0f0f0;
  font-weight: 600;
  color: #000000;
}

.employees-table tr:hover {
  background: #f5f5f5;
}

.actions {
  display: flex;
  gap: 8px;
}

.edit-btn, .delete-btn {
  padding: 6px 12px;
  border: none;
  cursor: pointer;
  background: #e0e0e0;
  color: #000000;
  border-radius: 4px;
  font-size: 12px;
  transition: all 0.2s;
}

.edit-btn:hover, .delete-btn:hover {
  background: #cccccc;
}

.text-center {
  text-align: center;
}

/* Стили для вложенного модального окна */
.modal-sub-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
}

.modal-sub-content {
  background: white;
  border-radius: 16px;
  max-width: 500px;
  width: 90%;
  max-height: 85vh;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #000000;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #cccccc;
  border-radius: 8px;
  font-size: 14px;
  color: #000000;
}

.form-input:focus {
  outline: none;
  border-color: #999999;
}

.hint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #666666;
}

.save-btn {
  padding: 8px 20px;
  background: #e0e0e0;
  color: #000000;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.save-btn:hover {
  background: #cccccc;
}

.cancel-btn {
  padding: 8px 20px;
  background: #e0e0e0;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  margin-right: 10px;
  color: #000000;
}

.cancel-btn:hover {
  background: #cccccc;
}
</style>
