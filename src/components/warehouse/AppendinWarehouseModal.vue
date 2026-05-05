<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>{{ isEditing ? 'Редактировать товар' : 'Добавить товар' }}</h3>
        <button class="close-btn" @click="$emit('close')">X</button>
      </div>

      <div class="form-group">
        <label>Название:</label>
        <input v-model="localForm.name" type="text" class="form-input" required>
      </div>

      <div class="form-group">
        <label>Цена (руб):</label>
        <input v-model.number="localForm.price" type="number" class="form-input" required>
      </div>

      <div class="form-group" v-if="type === 'components'">
        <label>Поставщик:</label>
        <select v-model="localForm.supplier_id" class="form-input">
          <option :value="null">Выберите поставщика</option>
          <option v-for="supplier in suppliers" :key="supplier.id" :value="supplier.id">
            {{ supplier.company_name }}
          </option>
        </select>
      </div>

      <div class="modal-buttons">
        <button @click="$emit('close')" class="cancel-btn">Отмена</button>
        <button @click="handleSave" class="confirm-btn">Сохранить</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  isEditing: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    default: 'components'
  },
  formData: {
    type: Object,
    default: () => ({ id: null, name: '', price: '', quantity: 0, supplier_id: null })
  },
  suppliers: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'save'])

const localForm = reactive({
  id: null,
  name: '',
  price: '',
  quantity: 0,
  supplier_id: null
})

watch(() => props.formData, (newVal) => {
  localForm.id = newVal.id
  localForm.name = newVal.name
  localForm.price = newVal.price
  localForm.quantity = newVal.quantity || 0
  localForm.supplier_id = newVal.supplier_id || null
}, { immediate: true, deep: true })

const handleSave = () => {
  emit('save', { ...localForm })
}
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

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 25px;
  min-width: 500px;
  max-width: 600px;
  width: 90%;
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

.form-input:focus {
  outline: none;
  border-color: #999999;
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
  font-size: 14px;
}

.cancel-btn {
  background-color: #e0e0e0;
  color: #000000;
}

.cancel-btn:hover {
  background-color: #cccccc;
}

.confirm-btn {
  background-color: #e0e0e0;
  color: #000000;
}

.confirm-btn:hover {
  background-color: #cccccc;
}
</style>
