<template>
  <div class="shift-control">
    <button @click="openShiftModal" class="shift-btn">
      {{ activeShift ? 'ЗАКРЫТЬ СМЕНУ' : 'ОТКРЫТЬ СМЕНУ' }}
    </button>

    <!-- Модальное окно подтверждения -->
    <div v-if="showModal" class="modal-overlay" @click="showModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ activeShift ? 'Закрытие смены' : 'Открытие смены' }}</h3>
          <button class="close-btn" @click="showModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="confirm-info">
            <p v-if="!activeShift">
              Вы действительно хотите <strong>открыть смену</strong>?
            </p>
            <p v-else>
              Вы действительно хотите <strong>закрыть смену</strong>?
            </p>
            <div class="time-info">
              <span class="time-label">Время:</span>
              <span class="time-value">{{ currentTime }}</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showModal = false" class="cancel-btn">Отмена</button>
          <button @click="confirmAction" class="confirm-btn">
            {{ activeShift ? 'Закрыть' : 'Открыть' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/authStore'
import { useDataStore } from '../stores/dataStore'

const props = defineProps({
  activeShift: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['shift-opened', 'shift-closed'])

const authStore = useAuthStore()
const dataStore = useDataStore()

const showModal = ref(false)

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
const getCurrentTime = () => {
  const now = new Date()
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

const getCurrentDate = () => {
  return new Date().toISOString().split('T')[0]
}

const getCurrentDateTime = () => {
  return new Date().toISOString()
}

// ==================== COMPUTED ====================
const currentTime = computed(getCurrentTime)

// ==================== МЕТОДЫ ====================
const openShiftModal = () => {
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const handleError = (error) => {
  console.error('Ошибка:', error)
  alert('Ошибка при выполнении операции')
}

const openShift = async () => {
  const shiftData = {
    user_id: authStore.user?.id,
    date: getCurrentDate(),
    start_time: currentTime.value
  }
  await dataStore.create_workshift(shiftData)
  emit('shift-opened')
}

const closeShift = async () => {
  await dataStore.update_workshift(props.activeShift.id, {
    end_time: currentTime.value,
    closed_at: getCurrentDateTime()
  })
  emit('shift-closed')
}

const confirmAction = async () => {
  try {
    if (props.activeShift) {
      await closeShift()
    } else {
      await openShift()
    }
    closeModal()
  } catch (error) {
    handleError(error)
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700&display=swap');

.shift-control {
  text-align: center;
  margin: 20px 0;
  font-family: 'Inter', sans-serif;
}

/* Кнопка открыть/закрыть смену */
.shift-btn {
  padding: 12px 28px;
  border: none;
  border-radius: 40px;
  font-size: 16px;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #d9eb61;
  color: #2c3e2f;
  box-shadow: 0 2px 8px rgba(217, 235, 97, 0.3);
}

.shift-btn:hover {
  background: #c4db3a;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(217, 235, 97, 0.4);
}

/* Затемнение */
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

/* Модальное окно */
.modal-content {
  background: #ffffff;
  border-radius: 28px;
  width: 90%;
  max-width: 380px;
  overflow: hidden;
  box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.2);
  font-family: 'Inter', sans-serif;
}

/* Шапка модального окна */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 2px solid #f9cffd;
  background: #ffffff;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
  color: #f9cffd;
  letter-spacing: -0.3px;
}

/* Кнопка закрытия (крестик) */
.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #999999;
  transition: all 0.2s ease;
  line-height: 1;
  padding: 0;
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

/* Тело модального окна */
.modal-body {
  padding: 24px;
}

.confirm-info {
  text-align: center;
}

.confirm-info p {
  margin: 0 0 16px 0;
  font-size: 1rem;
  color: #2c3e2f;
  line-height: 1.4;
}

.confirm-info strong {
  color: #e07bc4;
}

.time-info {
  background: #f5f5f7;
  border-radius: 40px;
  padding: 12px 20px;
  display: inline-flex;
  gap: 12px;
  align-items: baseline;
}

.time-label {
  font-weight: 600;
  color: #2c3e2f;
}

.time-value {
  font-size: 1.2rem;
  font-weight: 700;
  color: #2c3e2f;
}

/* Нижняя часть с кнопками */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px 24px 24px;
  border-top: 1px solid #f5f5f7;
  background: #ffffff;
}

/* Кнопка Отмена */
.cancel-btn {
  padding: 10px 24px;
  background: #f5f5f7;
  border: none;
  border-radius: 40px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  font-family: 'Inter', sans-serif;
  color: #2c3e2f;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background: #e8e8ec;
  transform: translateY(-1px);
}

/* Кнопка Открыть/Закрыть (зеленая) */
.confirm-btn {
  padding: 10px 28px;
  background: #d9eb61;
  border: none;
  border-radius: 40px;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.9rem;
  font-family: 'Inter', sans-serif;
  color: #2c3e2f;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(217, 235, 97, 0.3);
}

.confirm-btn:hover {
  background: #c4db3a;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(217, 235, 97, 0.4);
}
</style>
