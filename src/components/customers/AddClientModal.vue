<template>
  <div v-if="show" class="modal-overlay" @click="close">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>{{ isEditing ? 'Редактирование клиента' : 'Добавление нового клиента' }}</h3>
        <button class="close-btn" @click="close">✕</button>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Фамилия:</label>
          <input v-model="localForm.surname" type="text" class="form-input" placeholder="Иванова">
        </div>

        <div class="form-group">
          <label>Имя:</label>
          <input v-model="localForm.name" type="text" class="form-input" placeholder="Анна">
        </div>

        <div class="form-group">
          <label>Отчество:</label>
          <input v-model="localForm.patronymic" type="text" class="form-input" placeholder="Петровна">
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Телефон:</label>
          <input v-model="localForm.phone" type="text" class="form-input" placeholder="+7 999 123-45-67">
        </div>

        <div class="form-group">
          <label>Email:</label>
          <input v-model="localForm.email" type="email" class="form-input" placeholder="anna@mail.ru">
        </div>
      </div>

      <div class="form-group">
        <label>Адрес:</label>
        <input v-model="localForm.address" type="text" class="form-input" placeholder="г. Сургут, ул. Ленина, д. 1, кв. 10">
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Дата рождения:</label>
          <input v-model="localForm.birth_date" type="date" class="form-input">
        </div>
      </div>

      <div class="form-group">
        <label>Комментарий:</label>
        <textarea v-model="localForm.comments" class="form-input" rows="3" placeholder="Предпочитает розы, аллергия на лилии"></textarea>
      </div>

      <div class="modal-buttons">
        <button @click="close" class="cancel-btn">Отмена</button>
        <button @click="save" class="confirm-btn">Сохранить</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  isEditing: {
    type: Boolean,
    default: false
  },
  clientData: {
    type: Object,
    default: () => ({
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
  }
})

const emit = defineEmits(['close', 'save'])


const getEmptyForm = () => ({
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

const localForm = ref(getEmptyForm())

// методы
const resetForm = () => {
  localForm.value = getEmptyForm()
}

const isValid = () => {
  if (!localForm.value.surname || !localForm.value.name) {
    alert('Заполните обязательные поля (Фамилия и Имя)')
    return false
  }
  return true
}

const save = () => {
  if (!isValid()) return

  emit('save', { ...localForm.value })
}

const close = () => {
  emit('close')
}


watch(() => props.show, (newVal) => {
  if (newVal) {
    if (props.isEditing && props.clientData) {
      localForm.value = { ...props.clientData }
    } else {
      resetForm()
    }
  }
})

watch(() => props.clientData, (newVal) => {
  if (props.isEditing && newVal && props.show) {
    localForm.value = { ...newVal }
  }
}, { deep: true })
</script>

<style scoped>

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

@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    gap: 0;
  }

  .modal-content {
    min-width: auto;
  }
}
</style>
