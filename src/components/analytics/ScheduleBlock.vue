<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content schedule-modal" @click.stop>
      <div class="modal-header">
        <h3>Расписание смен на {{ monthName }} {{ currentYear }}</h3>
        <button class="close-btn" @click="closeModal">X</button>
      </div>

      <div class="modal-body">
        <!-- Навигация по месяцам -->
        <div class="month-navigation">
          <button @click="prevMonth" class="nav-btn">{{ prevMonthName }}</button>
          <span class="current-month">{{ monthName }} {{ currentYear }}</span>
          <button @click="nextMonth" class="nav-btn">{{ nextMonthName }}</button>
        </div>

        <!-- Кнопка редактирования (только для админа) -->
        <div class="edit-mode-control" v-if="isAdmin">
          <button v-if="!isEditMode" @click="enterEditMode" class="edit-mode-btn">
            Редактировать расписание
          </button>
          <div v-else class="edit-mode-actions">
            <span class="edit-mode-text">Режим редактирования</span>
            <button @click="saveAllChanges" class="save-btn">Сохранить все изменения</button>
            <button @click="cancelEdit" class="cancel-edit-btn">Отмена</button>
          </div>
        </div>

        <!-- Сообщение для не-админов -->
        <div v-if="!isAdmin" class="readonly-notice">
          Только просмотр. Редактирование доступно только администратору.
        </div>

        <!-- Таблица расписания -->
        <div class="schedule-table-container">
          <table class="schedule-table">
            <thead>
            <tr>
              <th class="employee-col">Сотрудник</th>
              <th v-for="day in visibleDays" :key="day.date" class="day-col">
                <div class="day-number">{{ day.day }}</div>
                <div class="day-week">{{ day.weekday }}</div>
              </th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="employee in employees" :key="employee.id">
              <td class="employee-cell">
                <div class="employee-name">{{ getFullName(employee) }}</div>
                <div class="employee-role">{{ getRoleName(employee.role_id) }}</div>
              </td>
              <td
                v-for="day in visibleDays"
                :key="day.date"
                class="schedule-cell"
                :class="{
                    'weekend': day.isWeekend,
                    'editable': isEditMode && isAdmin,
                    'changed': hasChanges(employee.id, day.date)
                  }"
                @click.stop="(isEditMode && isAdmin) && openEditCell(employee, day, $event)"
              >
                <div class="cell-text">
                  {{ getDisplayText(employee.id, day.date) }}
                </div>
              </td>
            </tr>
            </tbody>
          </table>
        </div>

        <!-- Легенда (только для админа в режиме редактирования) -->
        <div class="legend" v-if="isEditMode && isAdmin">
          <div class="legend-item">
            <span class="legend-dot"></span>
            <span>Измененные ячейки</span>
          </div>
          <div class="legend-item">
            <span class="legend-icon">Клик</span>
            <span>Клик для редактирования (в режиме редактирования)</span>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="closeModal" class="cancel-btn">Закрыть</button>
      </div>
    </div>

    <!-- Выпадающий список для редактирования (только для админа) -->
    <div
      v-if="editingCell && isAdmin"
      class="edit-popup"
      :style="{ top: popupPosition.top + 'px', left: popupPosition.left + 'px' }"
      @click.stop
    >
      <div class="popup-header">
        <span>{{ editingCell.employeeName }}</span>
        <span class="popup-date">{{ formatDate(editingCell.day.date) }}</span>
      </div>
      <div class="popup-options">
        <div
          v-for="option in timeOptions"
          :key="option.value"
          class="popup-option"
          :class="{ active: getTempScheduleValue(editingCell.employeeId, editingCell.day.date) === option.value }"
          @click="updateTempSchedule(option.value)"
        >
          {{ option.label }}
        </div>
      </div>
      <button class="popup-close" @click.stop="closeEditCell">X</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDataStore } from '../../stores/dataStore'
import { useAuthStore } from '../../stores/authStore'

const emit = defineEmits(['close'])
const dataStore = useDataStore()
const authStore = useAuthStore()

// Состояния
const employees = ref([])
const schedules = ref([])
const currentDate = ref(new Date())
const editingCell = ref(null)
const popupPosition = ref({ top: 0, left: 0 })
const isEditMode = ref(false)

// Временные изменения
const tempChanges = ref({})

// Проверка прав (только администратор может редактировать)
const isAdmin = computed(() => {
  return authStore.user?.role === 'administrator' || authStore.user?.role_id === 1
})

// Опции времени для смен
const timeOptions = [
  { value: null, label: 'Выходной' },
  { value: '09:00-18:00', label: '09:00 - 18:00' },
  { value: '10:00-16:00', label: '10:00 - 16:00' },
  { value: '12:00-20:00', label: '12:00 - 20:00' }
]

// Названия месяцев
const monthNames = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
]

// Текущий месяц и год
const currentYear = computed(() => currentDate.value.getFullYear())
const currentMonth = computed(() => currentDate.value.getMonth())
const monthName = computed(() => monthNames[currentMonth.value])

// Предыдущий и следующий месяц
const prevMonthName = computed(() => {
  let prev = new Date(currentDate.value)
  prev.setMonth(prev.getMonth() - 1)
  return monthNames[prev.getMonth()]
})

const nextMonthName = computed(() => {
  let next = new Date(currentDate.value)
  next.setMonth(next.getMonth() + 1)
  return monthNames[next.getMonth()]
})

// Видимые дни (с 1 по 15 число)
const visibleDays = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value
  const days = []

  for (let i = 1; i <= 15; i++) {
    const date = new Date(year, month, i)
    const weekday = date.toLocaleDateString('ru-RU', { weekday: 'short' })
    days.push({
      date: date.toISOString().split('T')[0],
      day: i,
      weekday: weekday,
      isWeekend: weekday === 'сб' || weekday === 'вс'
    })
  }
  return days
})

// Роли
const roleNames = {
  1: 'Администратор',
  2: 'Флорист',
  3: 'Продавец'
}

// Нормализация даты
const normalizeDate = (dateStr) => {
  if (!dateStr) return null
  return dateStr.split('T')[0]
}

// Закрытие модального окна
const closeModal = () => {
  emit('close')
}

// Загрузка данных
const loadData = async () => {
  await dataStore.get_users()
  employees.value = dataStore.users || []
  await loadSchedules()
}

// Загрузка расписаний
const loadSchedules = async () => {
  await dataStore.get_schedules()
  schedules.value = [...(dataStore.schedules || [])]
  tempChanges.value = {}
}

// Получить полное имя
const getFullName = (employee) => {
  const parts = [employee.surname, employee.name, employee.patronymic].filter(p => p)
  return parts.join(' ') || employee.email || 'Без имени'
}

// Получить название должности
const getRoleName = (roleId) => {
  return roleNames[roleId] || 'Сотрудник'
}

// Получить ключ для временных изменений
const getChangeKey = (employeeId, date) => {
  return `${employeeId}_${date}`
}

// Получить текст для ячейки (оригинал)
const getScheduleText = (employeeId, date) => {
  const schedule = schedules.value.find(s =>
    s.user_id === employeeId && normalizeDate(s.date) === date
  )
  if (!schedule) return 'Выходной'
  if (schedule.weekend) return 'Выходной'
  if (schedule.start_time && schedule.end_time) {
    return `${schedule.start_time.substring(0, 5)}-${schedule.end_time.substring(0, 5)}`
  }
  return 'Выходной'
}

// Получить текст для отображения (с учетом временных изменений)
const getDisplayText = (employeeId, date) => {
  const key = getChangeKey(employeeId, date)
  if (tempChanges.value[key] !== undefined) {
    const value = tempChanges.value[key]
    if (value === null) return 'Выходной'
    return value
  }
  return getScheduleText(employeeId, date)
}

// Получить значение для временного изменения
const getTempScheduleValue = (employeeId, date) => {
  const key = getChangeKey(employeeId, date)
  if (tempChanges.value[key] !== undefined) {
    return tempChanges.value[key]
  }
  const schedule = schedules.value.find(s =>
    s.user_id === employeeId && normalizeDate(s.date) === date
  )
  if (!schedule || schedule.weekend || !schedule.start_time) return null
  return `${schedule.start_time.substring(0, 5)}-${schedule.end_time.substring(0, 5)}`
}

// Проверить, есть ли изменения
const hasChanges = (employeeId, date) => {
  const key = getChangeKey(employeeId, date)
  return tempChanges.value[key] !== undefined
}

// Войти в режим редактирования (только для админа)
const enterEditMode = () => {
  if (!isAdmin.value) return
  isEditMode.value = true
  tempChanges.value = {}
}

// Сохранить все изменения
const saveAllChanges = async () => {
  if (!isAdmin.value) return

  try {
    for (const [key, value] of Object.entries(tempChanges.value)) {
      const [employeeId, date] = key.split('_')
      const existingSchedule = schedules.value.find(s =>
        s.user_id === parseInt(employeeId) && normalizeDate(s.date) === date
      )

      let scheduleData
      if (value === null) {
        scheduleData = {
          user_id: parseInt(employeeId),
          date: date,
          weekend: true,
          start_time: null,
          end_time: null
        }
      } else {
        const [start_time, end_time] = value.split('-')
        scheduleData = {
          user_id: parseInt(employeeId),
          date: date,
          weekend: false,
          start_time: start_time,
          end_time: end_time
        }
      }

      if (existingSchedule) {
        await dataStore.update_schedule(existingSchedule.id, scheduleData)
      } else {
        await dataStore.create_schedule(scheduleData)
      }
    }

    await loadSchedules()
    isEditMode.value = false
    alert('Изменения сохранены!')
  } catch (error) {
    console.error('Ошибка сохранения:', error)
    alert('Ошибка при сохранении изменений')
  }
}

// Отменить редактирование
const cancelEdit = () => {
  isEditMode.value = false
  tempChanges.value = {}
  editingCell.value = null
}

// Обновить временное расписание
const updateTempSchedule = (value) => {
  if (!editingCell.value) return
  const { employeeId, day } = editingCell.value
  const key = getChangeKey(employeeId, day.date)
  tempChanges.value[key] = value
  closeEditCell()
}

// Открыть редактирование ячейки
const openEditCell = (employee, day, event) => {
  if (!isAdmin.value) return
  editingCell.value = {
    employeeId: employee.id,
    employeeName: getFullName(employee),
    day: day
  }

  if (event) {
    popupPosition.value = {
      top: event.clientY + 10,
      left: event.clientX + 10
    }
  }
}

// Закрыть редактирование
const closeEditCell = () => {
  editingCell.value = null
}

// Форматировать дату
const formatDate = (date) => {
  const d = new Date(date)
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
}

// Навигация по месяцам
const prevMonth = () => {
  if (isEditMode.value && !confirm('Переключение месяца отменит все изменения. Продолжить?')) return
  const newDate = new Date(currentDate.value)
  newDate.setMonth(newDate.getMonth() - 1)
  currentDate.value = newDate
  isEditMode.value = false
  tempChanges.value = {}
  loadSchedules()
}

const nextMonth = () => {
  if (isEditMode.value && !confirm('Переключение месяца отменит все изменения. Продолжить?')) return
  const newDate = new Date(currentDate.value)
  newDate.setMonth(newDate.getMonth() + 1)
  currentDate.value = newDate
  isEditMode.value = false
  tempChanges.value = {}
  loadSchedules()
}

// Загрузка при монтировании
onMounted(() => {
  loadData()
})
</script>

<style scoped>
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

.schedule-modal {
  max-width: 1200px;
  width: 95%;
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
  transition: color 0.2s;
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

.month-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 20px;
}

.nav-btn {
  padding: 8px 16px;
  background: #e0e0e0;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
  color: #000000;
}

.nav-btn:hover {
  background: #cccccc;
  transform: scale(1.02);
}

.current-month {
  font-size: 18px;
  font-weight: bold;
  color: #000000;
}

.edit-mode-control {
  text-align: center;
  margin-bottom: 20px;
  padding: 10px;
  background: #f0f0f0;
  border-radius: 8px;
}

.edit-mode-btn {
  padding: 10px 20px;
  background: #e0e0e0;
  color: #000000;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.edit-mode-btn:hover {
  background: #cccccc;
  transform: scale(1.02);
}

.edit-mode-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
}

.edit-mode-text {
  color: #000000;
  font-weight: bold;
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
  transform: scale(1.02);
}

.cancel-edit-btn {
  padding: 8px 20px;
  background: #e0e0e0;
  color: #000000;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.cancel-edit-btn:hover {
  background: #cccccc;
  transform: scale(1.02);
}

.readonly-notice {
  text-align: center;
  padding: 10px;
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 8px;
  margin-bottom: 20px;
  color: #856404;
  font-size: 14px;
}

.schedule-table-container {
  overflow-x: auto;
  margin-bottom: 20px;
}

.schedule-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.schedule-table th,
.schedule-table td {
  border: 1px solid #e0e0e0;
  padding: 10px 8px;
  text-align: center;
  vertical-align: middle;
}

.employee-col {
  min-width: 150px;
  background: #f0f0f0;
}

.day-col {
  min-width: 80px;
  background: #f0f0f0;
}

.day-number {
  font-size: 16px;
  font-weight: bold;
  color: #000000;
}

.day-week {
  font-size: 11px;
  color: #666666;
}

.employee-cell {
  text-align: left;
}

.employee-name {
  font-weight: 500;
  color: #000000;
}

.employee-role {
  font-size: 11px;
  color: #666666;
  margin-top: 4px;
}

.schedule-cell {
  min-width: 80px;
  transition: background 0.2s;
  cursor: default;
}

.schedule-cell.weekend {
  background: #f0f0f0;
}

.schedule-cell.editable {
  cursor: pointer;
}

.schedule-cell.editable:hover {
  background: #e0e0e0;
}

.schedule-cell.changed {
  background: #f0f0f0;
  position: relative;
}

.cell-text {
  font-size: 12px;
  color: #000000;
}

.legend {
  display: flex;
  gap: 20px;
  padding: 15px 20px;
  background: #f0f0f0;
  border-radius: 8px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #000000;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #f0f0f0;
  border: 1px solid #999999;
}

.legend-icon {
  font-size: 12px;
}

.edit-popup {
  position: fixed;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 2000;
  min-width: 180px;
  overflow: hidden;
}

.popup-header {
  padding: 10px 12px;
  background: #e0e0e0;
  color: #000000;
  font-size: 13px;
  display: flex;
  justify-content: space-between;
}

.popup-date {
  font-size: 11px;
  opacity: 0.9;
  color: #666666;
}

.popup-options {
  padding: 5px 0;
}

.popup-option {
  padding: 10px 12px;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 13px;
  color: #000000;
}

.popup-option:hover {
  background: #f0f0f0;
}

.popup-option.active {
  background: #e0e0e0;
  color: #000000;
  font-weight: 500;
}

.popup-close {
  position: absolute;
  top: 5px;
  right: 5px;
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: #999999;
  transition: color 0.2s;
}

.popup-close:hover {
  color: #000000;
}

.cancel-btn {
  padding: 8px 20px;
  background: #e0e0e0;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
  color: #000000;
}

.cancel-btn:hover {
  background: #cccccc;
  transform: scale(1.02);
}
</style>
