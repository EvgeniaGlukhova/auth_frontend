<template>
  <div class="shift-control">
    <button @click="openShiftModal" class="shift-btn">
      {{ activeShift ? 'ЗАКРЫТЬ СМЕНУ' : 'ОТКРЫТЬ СМЕНУ' }}
    </button>

    <!-- Модальное окно -->
    <div v-if="showModal" class="modal-overlay" @click="showModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ activeShift ? 'Закрытие смены' : 'Открытие смены' }}</h3>
          <button class="close-btn" @click="showModal = false">X</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>{{ activeShift ? 'Время окончания:' : 'Время начала:' }}</label>
            <input
              type="time"
              v-model="timeValue"
              class="form-input"
              :required="!activeShift"
            >
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
import { ref } from 'vue'
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
const timeValue = ref('')

const openShiftModal = () => {
  if (props.activeShift) {
    timeValue.value = ''
  } else {
    timeValue.value = '09:00'
  }
  showModal.value = true
}

const confirmAction = async () => {
  if (!timeValue.value) {
    alert(props.activeShift ? 'Укажите время окончания смены' : 'Укажите время начала смены')
    return
  }

  try {
    if (props.activeShift) {
      // Закрытие смены
      await dataStore.update_workshift(props.activeShift.id, {
        end_time: timeValue.value,
        closed_at: new Date().toISOString()
      })
      emit('shift-closed')
    } else {
      // Открытие смены
      const shiftData = {
        user_id: authStore.user?.id,
        date: new Date().toISOString().split('T')[0],
        start_time: timeValue.value
      }
      await dataStore.create_workshift(shiftData)
      emit('shift-opened')
    }
    showModal.value = false
  } catch (error) {
    console.error('Ошибка:', error)
    alert('Ошибка при выполнении операции')
  }
}
</script>

<style scoped>
.shift-control {
  text-align: center;
  margin: 20px 0;
}

.shift-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  background-color: #e0e0e0;
  color: #000000;
}

.shift-btn:hover {
  background-color: #cccccc;
  transform: scale(1.02);
}

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

.modal-content {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 350px;
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
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid #e0e0e0;
  background: #f0f0f0;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
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

.cancel-btn {
  padding: 8px 16px;
  background: #e0e0e0;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: #000000;
}

.cancel-btn:hover {
  background: #cccccc;
}

.confirm-btn {
  padding: 8px 16px;
  background: #e0e0e0;
  color: #000000;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.confirm-btn:hover {
  background: #cccccc;
  opacity: 0.9;
}
</style>
