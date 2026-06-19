<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content schedule-modal" @click.stop>
      <div class="modal-header">
        <h3>Расписание смен на {{ monthName }} {{ currentYear }}</h3>
        <button class="close-btn" @click="closeModal">✕</button>
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

        <div class="modal-buttons">
          <button @click="exportScheduleToExcel" class="export-btn">Экспорт в Excel</button>
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
import { exportSchedule } from '../../utils/excelExport'

const emit = defineEmits(['close'])
const dataStore = useDataStore()
const authStore = useAuthStore()


const monthNames = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
]

const roleNames = {
  1: 'Администратор',
  2: 'Флорист',
  3: 'Продавец',
  4: 'Продавец-флорист',
  5: 'Курьер'
}

const timeOptions = [
  { value: null, label: 'Выходной' },
  { value: '09:00-18:00', label: '09:00 - 18:00' },
  { value: '10:00-16:00', label: '10:00 - 16:00' },
  { value: '12:00-20:00', label: '12:00 - 20:00' }
]

// ==================== СОСТОЯНИЕ ====================
const employees = ref([])
const schedules = ref([])
const currentDate = ref(new Date())
const editingCell = ref(null)
const popupPosition = ref({ top: 0, left: 0 })
const isEditMode = ref(false)
const tempChanges = ref({})


const isAdmin = computed(() => {
  return authStore.user?.role === 'administrator' || authStore.user?.role_id === 1
})

const currentYear = computed(() => currentDate.value.getFullYear())
const currentMonth = computed(() => currentDate.value.getMonth())
const monthName = computed(() => monthNames[currentMonth.value])

const prevMonthName = computed(() => {
  const prev = new Date(currentDate.value)
  prev.setMonth(prev.getMonth() - 1)
  return monthNames[prev.getMonth()]
})

const nextMonthName = computed(() => {
  const next = new Date(currentDate.value)
  next.setMonth(next.getMonth() + 1)
  return monthNames[next.getMonth()]
})

const visibleDays = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value
  const days = []

  const daysInMonth = new Date(year, month + 1, 0).getDate()

  for (let i = 1; i <= daysInMonth; i++) {
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

// доп функции
const normalizeDate = (dateStr) => {
  if (!dateStr) return null
  return dateStr.split('T')[0]
}

const getFullName = (employee) => {
  const parts = [employee.surname, employee.name, employee.patronymic].filter(p => p)
  return parts.join(' ') || employee.email || 'Без имени'
}

const getRoleName = (roleId) => {
  return roleNames[roleId] || 'Сотрудник'
}

const formatDate = (date) => {
  const d = new Date(date)
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
}

const getChangeKey = (employeeId, date) => `${employeeId}_${date}`

// работа с данными
const loadSchedules = async () => {
  await dataStore.get_schedules()
  schedules.value = [...(dataStore.schedules || [])]
  tempChanges.value = {}
}

const loadData = async () => {
  await dataStore.get_users()
  employees.value = dataStore.users || []
  await loadSchedules()
}

const getSchedule = (employeeId, date) => {
  return schedules.value.find(s =>
    s.user_id === employeeId && normalizeDate(s.date) === date
  )
}

const getScheduleText = (employeeId, date) => {
  const schedule = getSchedule(employeeId, date)
  if (!schedule || schedule.weekend) return 'Выходной'
  if (schedule.start_time && schedule.end_time) {
    return `${schedule.start_time.substring(0, 5)}-${schedule.end_time.substring(0, 5)}`
  }
  return 'Выходной'
}

const getDisplayText = (employeeId, date) => {
  const key = getChangeKey(employeeId, date)
  if (tempChanges.value[key] !== undefined) {
    return tempChanges.value[key] === null ? 'Выходной' : tempChanges.value[key]
  }
  return getScheduleText(employeeId, date)
}

const getTempScheduleValue = (employeeId, date) => {
  const key = getChangeKey(employeeId, date)
  if (tempChanges.value[key] !== undefined) {
    return tempChanges.value[key]
  }
  const schedule = getSchedule(employeeId, date)
  if (!schedule || schedule.weekend || !schedule.start_time) return null
  return `${schedule.start_time.substring(0, 5)}-${schedule.end_time.substring(0, 5)}`
}

const hasChanges = (employeeId, date) => {
  return tempChanges.value[getChangeKey(employeeId, date)] !== undefined
}

// редактирование
const enterEditMode = () => {
  if (!isAdmin.value) return
  isEditMode.value = true
  tempChanges.value = {}
}

const cancelEdit = () => {
  isEditMode.value = false
  tempChanges.value = {}
  editingCell.value = null
}

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

const closeEditCell = () => {
  editingCell.value = null
}

const updateTempSchedule = (value) => {
  if (!editingCell.value) return
  const { employeeId, day } = editingCell.value
  const key = getChangeKey(employeeId, day.date)
  tempChanges.value[key] = value
  closeEditCell()
}

// Сохранить все изменения
const saveAllChanges = async () => {
  if (!isAdmin.value) return

  try {
    for (const [key, value] of Object.entries(tempChanges.value)) {
      const [employeeId, date] = key.split('_')
      const existingSchedule = getSchedule(parseInt(employeeId), date)

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

// навигация
const resetAndLoad = async () => {
  isEditMode.value = false
  tempChanges.value = {}
  await loadSchedules()
}

const prevMonth = async () => {
  if (isEditMode.value && !confirm('Переключение месяца отменит все изменения. Продолжить?')) return
  const newDate = new Date(currentDate.value)
  newDate.setMonth(newDate.getMonth() - 1)
  currentDate.value = newDate
  await resetAndLoad()
}

const nextMonth = async () => {
  if (isEditMode.value && !confirm('Переключение месяца отменит все изменения. Продолжить?')) return
  const newDate = new Date(currentDate.value)
  newDate.setMonth(newDate.getMonth() + 1)
  currentDate.value = newDate
  await resetAndLoad()
}

// экспорт
const exportScheduleToExcel = () => {
  exportSchedule(employees.value, schedules.value, monthName.value)
}


const closeModal = () => {
  emit('close')
}


onMounted(() => {
  loadData()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700&display=swap');

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

.schedule-modal {
  max-width: 1200px;
  width: 95%;
  max-height: 85vh;
  overflow-y: auto;
  background: #ffffff;
  border-radius: 28px;
  box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.2);
  font-family: 'Inter', sans-serif;
}

/* Скроллбар */
.schedule-modal::-webkit-scrollbar {
  width: 6px;
}

.schedule-modal::-webkit-scrollbar-track {
  background: #f0f0f0;
  border-radius: 10px;
}

.schedule-modal::-webkit-scrollbar-thumb {
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
  padding: 1rem 1.5rem;
  border-top: 1px solid #f5f5f7;
  background: #ffffff;
}

/* Навигация по месяцам */
.month-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 0;
}

.nav-btn {
  padding: 0.5rem 1.2rem;
  background: #ffffff;
  border: 2px solid #d9eb61;
  border-radius: 40px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  color: #000000;
  transition: all 0.3s ease;
}

.nav-btn:hover {
  background: #d9eb61;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(217, 235, 97, 0.3);
}

.current-month {
  font-size: 1.2rem;
  font-weight: 700;
  color: #e07bc4;
}

/* Режим редактирования */
.edit-mode-control {
  text-align: center;
  margin-bottom: 1.5rem;
  padding: 0.8rem;
  background: #f9cffd30;
  border-radius: 20px;
}

.edit-mode-btn {
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

.edit-mode-btn:hover {
  background: #d9eb61;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(217, 235, 97, 0.3);
}

.edit-mode-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
}

.edit-mode-text {
  color: #8b3a8b;
  font-weight: 700;
  font-size: 0.85rem;
}

.save-btn {
  padding: 0.5rem 1.2rem;
  background: #d9eb61;
  color: #000000;
  border: none;
  border-radius: 40px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.8rem;
  font-family: 'Inter', sans-serif;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(217, 235, 97, 0.3);
}

.save-btn:hover {
  background: #c4db3a;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(217, 235, 97, 0.4);
}

.cancel-edit-btn {
  padding: 0.5rem 1.2rem;
  background: #f5f5f7;
  color: #000000;
  border: none;
  border-radius: 40px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.8rem;
  font-family: 'Inter', sans-serif;
  transition: all 0.3s ease;
}

.cancel-edit-btn:hover {
  background: #e8e8ec;
  transform: translateY(-1px);
}

/* Режим только для чтения */
.readonly-notice {
  text-align: center;
  padding: 0.6rem;
  background: #fef2f0;

  border-radius: 16px;
  margin-bottom: 1.5rem;
  color: #e85d4a;
  font-size: 0.8rem;
  font-weight: 500;
}

/* Таблица расписания */
.schedule-table-container {
  overflow-x: auto;
  margin-bottom: 1.5rem;
  border-radius: 20px;
  border: 1px solid #f5f5f7;
}

.schedule-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
  font-family: 'Inter', sans-serif;
}

.schedule-table th,
.schedule-table td {
  border: 1px solid #f0f0f0;
  padding: 0.7rem 0.5rem;
  text-align: center;
  vertical-align: middle;
}

.employee-col {
  min-width: 160px;
  background: #f9f9fb;
}

.day-col {
  min-width: 75px;
  background: #f9f9fb;
}

.day-number {
  font-size: 0.9rem;
  font-weight: 700;
  color: #e07bc4;
}

.day-week {
  font-size: 0.65rem;
  color: #999999;
  margin-top: 0.2rem;
}

.employee-cell {
  text-align: left;
}

.employee-name {
  font-weight: 600;
  color: #000000;
  font-size: 0.85rem;
}

.employee-role {
  font-size: 0.65rem;
  color: #999999;
  margin-top: 0.2rem;
}

.schedule-cell {
  min-width: 75px;
  transition: all 0.2s ease;
  cursor: default;
}

.schedule-cell.weekend {
  background: #f9f9fb;
}

.schedule-cell.editable {
  cursor: pointer;
}

.schedule-cell.editable:hover {
  background: #f9cffd40;
}

.schedule-cell.changed {
  background: #fffded;
  position: relative;
}

.cell-text {
  font-size: 0.75rem;
  color: #000000;
  font-weight: 500;
}

/* Легенда */
.legend {
  display: flex;
  gap: 1.5rem;
  padding: 0.8rem 1rem;
  background: #f9f9fb;
  border-radius: 20px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #000000;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #fffded;
  border: 1px solid #d9eb61;
}

.legend-icon {
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  background: #f9cffd40;
  border-radius: 20px;
}

/* Выпадающий список для редактирования */
.edit-popup {
  position: fixed;
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  z-index: 2000;
  min-width: 180px;
  overflow: hidden;
  border: 1px solid #f5f5f7;
}

.popup-header {
  padding: 0.6rem 0.8rem;
  background: #f9cffd;
  color: #000000;
  font-size: 0.8rem;
  font-weight: 600;
  display: flex;
  justify-content: space-between;
}

.popup-date {
  font-size: 0.7rem;
  opacity: 0.8;
  color: #8b3a8b;
}

.popup-options {
  padding: 0.3rem 0;
}

.popup-option {
  padding: 0.6rem 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.8rem;
  color: #000000;
}

.popup-option:hover {
  background: #f9cffd40;
}

.popup-option.active {
  background: #d9eb61;
  color: #000000;
  font-weight: 600;
}

.popup-close {
  position: absolute;
  top: 0.3rem;
  right: 0.3rem;
  background: none;
  border: none;
  font-size: 0.9rem;
  cursor: pointer;
  color: #999999;
  transition: color 0.2s ease;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.popup-close:hover {
  color: #000000;
  background: #ffffff50;
}

/* Кнопка закрытия */
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
