<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content employees-modal" @click.stop>
      <div class="modal-header">
        <h3>Управление сотрудниками</h3>
        <button class="close-btn" @click="$emit('close')">✕</button>
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
<!--              <th>ID</th>-->
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
<!--              <td>{{ employee.id }}</td>-->
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

      <div class="modal-buttons">
        <button @click="exportEmployeesToExcel" class="export-btn">Экспорт в Excel</button>
      </div>

    </div>

    <!-- Модальное окно добавления/редактирования сотрудника -->
    <div v-if="showAddEditModal" class="modal-sub-overlay" @click="closeAddEditModal">
      <div class="modal-sub-content" @click.stop>
        <div class="modal-header">
          <h3>{{ isEditing ? 'Редактирование сотрудника' : 'Добавление сотрудника' }}</h3>
          <button class="close-btn" @click="closeAddEditModal">✕</button>
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
              <option :value="4">Продавец-флорист</option>
              <option :value="5">Курьер</option>

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
import { exportEmployees } from '../../utils/excelExport'

const authStore = useAuthStore()
const dataStore = useDataStore()

// константы
const getRoleNames = () => ({
  1: 'Администратор',
  2: 'Флорист',
  3: 'Продавец',
  4: 'Продавец-флорист',
  5: 'Курьер'
})

// состояние
const showAddEditModal = ref(false)
const isEditing = ref(false)
const employees = ref([])
const accessError = ref('')


const isAdmin = computed(() => {
  return authStore.user?.role === 'administrator' || authStore.user?.role_id === 1
})

// начальные данные
const getEmptyForm = () => ({
  id: null,
  surname: '',
  name: '',
  patronymic: '',
  role_id: null,
  phone: '',
  email: '',
  password: ''
})

const formData = ref(getEmptyForm())

// методы
const getFullName = (employee) => {
  const parts = [employee.surname, employee.name, employee.patronymic].filter(p => p)
  return parts.join(' ') || '—'
}

const getRoleName = (roleId) => {
  return getRoleNames()[roleId] || 'Не указана'
}

// Загрузка сотрудников
const loadEmployees = async () => {
  accessError.value = ''
  await dataStore.get_users()
  employees.value = [...dataStore.users]
  console.log('Загружено сотрудников:', employees.value.length)
}

// Сброс формы
const resetForm = () => {
  formData.value = getEmptyForm()
}

// Открыть модалку добавления
const openAddModal = () => {
  if (!isAdmin.value) {
    alert('У вас нет прав для добавления сотрудников')
    return
  }
  isEditing.value = false
  resetForm()
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

// Закрыть модалку
const closeAddEditModal = () => {
  showAddEditModal.value = false
  resetForm()
}

// Валидация формы
const isValid = () => {
  if (!formData.value.surname || !formData.value.name) {
    alert('Заполните фамилию и имя')
    return false
  }
  if (!formData.value.email) {
    alert('Введите email')
    return false
  }
  if (!isEditing.value && !formData.value.password) {
    alert('Введите пароль')
    return false
  }
  return true
}

// Подготовка данных для отправки
const prepareEmployeeData = () => {
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

  return data
}

// Сохранить сотрудника
const saveEmployee = async () => {
  if (!isValid()) return

  const data = prepareEmployeeData()

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

  if (!confirm(`Удалить сотрудника "${getFullName(employee)}"?`)) return

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

// Экспорт в Excel
const exportEmployeesToExcel = () => {
  exportEmployees(employees.value)
}


onMounted(() => {
  loadEmployees()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700&display=swap');

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

.employees-modal {
  max-width: 1000px;
  width: 90%;
  max-height: 85vh;
  overflow-y: auto;
  background: #ffffff;
  border-radius: 28px;
  box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.2);
  font-family: 'Inter', sans-serif;
}

/* Скроллбар */
.employees-modal::-webkit-scrollbar {
  width: 6px;
}

.employees-modal::-webkit-scrollbar-track {
  background: #f0f0f0;
  border-radius: 10px;
}

.employees-modal::-webkit-scrollbar-thumb {
  background: #cccccc;
  border-radius: 10px;
}

.modal-content {
  background: #ffffff;
  border-radius: 28px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 2px solid #f9cffd;
  background: #ffffff;
  position: sticky;
  top: 0;
  z-index: 10;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 700;
  color: #f9cffd;
  letter-spacing: -0.3px;
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
  transform: scale(1.05);
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.8rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #f5f5f7;
  background: #ffffff;
}

/* Кнопка добавления */
.add-button-container {
  margin-bottom: 1.5rem;
  text-align: right;
}

.add-btn {
  padding: 0.6rem 1.5rem;
  background: #ffffff;
  color: #000000;
  border: 2px solid #d9eb61;
  border-radius: 40px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  transition: all 0.3s ease;
}

.add-btn:hover {
  background: #d9eb61;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(217, 235, 97, 0.3);
}

.add-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Ошибка доступа */
.error-message-box {
  background: #fef2f0;
  border-left: 3px solid #e85d4a;
  border-radius: 16px;
  padding: 0.8rem 1rem;
  margin-bottom: 1.5rem;
  color: #e85d4a;
  text-align: center;
  font-size: 0.85rem;
  font-weight: 500;
}

/* Таблица */
.table-container {
  overflow-x: auto;
  border-radius: 20px;
  background: #ffffff;
}

.employees-table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'Inter', sans-serif;
}

.employees-table th,
.employees-table td {
  padding: 0.8rem 0.8rem;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
  color: #000000;
  font-size: 0.85rem;
}

.employees-table th {
  background: #f9f9fb;
  font-weight: 600;
  color: #4a5b4e;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.employees-table tr:hover {
  background: #f9f9fb;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.edit-btn, .delete-btn {
  padding: 0.3rem 0.8rem;
  border: none;
  cursor: pointer;
  background: #f5f5f7;
  color: #000000;
  border-radius: 30px;
  font-size: 0.7rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.edit-btn:hover {
  background: #d9eb61;
  transform: scale(1.02);
}

.delete-btn:hover {
  background: #f9cffd;
  transform: scale(1.02);
}

.edit-btn:disabled, .delete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.text-center {
  text-align: center;
}

/* Вложенное модальное окно (добавление/редактирование) */
.modal-sub-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(2px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
}

.modal-sub-content {
  background: #ffffff;
  border-radius: 28px;
  max-width: 500px;
  width: 90%;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.2);
  font-family: 'Inter', sans-serif;
}

/* Скроллбар для вложенного окна */
.modal-sub-content::-webkit-scrollbar {
  width: 6px;
}

.modal-sub-content::-webkit-scrollbar-track {
  background: #f0f0f0;
  border-radius: 10px;
}

.modal-sub-content::-webkit-scrollbar-thumb {
  background: #cccccc;
  border-radius: 10px;
}

/* Форма */
.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.4rem;
  font-weight: 600;
  font-size: 0.8rem;
  color: #000000;
}

.form-input {
  width: 100%;
  padding: 0.7rem 1rem;
  border: 2px solid #f5f5f7;
  border-radius: 40px;
  font-size: 0.85rem;
  font-family: 'Inter', sans-serif;
  transition: all 0.3s ease;
  color: #000000;
  background: #ffffff;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #d9eb61;
  box-shadow: 0 0 0 3px #d9eb6140;
}

select.form-input {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%234a5b4e' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1rem;
}

.hint {
  display: block;
  margin-top: 0.3rem;
  font-size: 0.7rem;
  color: #999999;
}

/* Кнопки формы */
.save-btn {
  padding: 0.6rem 1.5rem;
  background: #d9eb61;
  color: #000000;
  border: none;
  border-radius: 40px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
  font-family: 'Inter', sans-serif;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(217, 235, 97, 0.3);
}

.save-btn:hover {
  background: #c4db3a;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(217, 235, 97, 0.4);
}

.cancel-btn {
  padding: 0.6rem 1.5rem;
  background: #f5f5f7;
  border: none;
  border-radius: 40px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
  font-family: 'Inter', sans-serif;
  color: #000000;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background: #e8e8ec;
  transform: translateY(-1px);
}

.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 0.8rem;
  margin-top: 1.5rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #f5f5f7;
  background: #ffffff;
  position: sticky;
  bottom: 0;
}

.export-btn {
  padding: 0.6rem 1.5rem;
  background: #ffffff;
  color: #2c3e2f;
  border: 2px solid #d9eb61;
  border-radius: 40px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(217, 235, 97, 0.2);
}

.export-btn:hover {
  background: #d9eb61;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(217, 235, 97, 0.4);
}
</style>
