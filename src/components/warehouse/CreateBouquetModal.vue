<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>Сборка готового букета</h3>
        <button class="close-btn" @click="$emit('close')">X</button>
      </div>

      <div class="form-group">
        <label>Название букета:</label>
        <input v-model="localData.name" type="text" class="form-input" placeholder="Букет Нежность">
      </div>

      <div class="form-group">
        <label>Цена букета (руб):</label>
        <input v-model.number="localData.price" type="number" class="form-input" placeholder="1500">
      </div>

      <div class="form-group">
        <label>Состав букета:</label>
        <div class="composition-table">
          <table>
            <thead>
            <tr>
              <th>Номер</th>
              <th>Товар</th>
              <th>Количество</th>
              <th>Доступно на складе</th>
              <th>Действие</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="(item, index) in localData.composition" :key="index">
              <td>{{ index + 1 }}</td>
              <td>
                <select v-model="item.flower_id" class="form-input-small">
                  <option :value="null">Выберите цветок</option>
                  <option v-for="flower in flowers" :key="flower.id" :value="flower.id">
                    {{ flower.name }}
                  </option>
                </select>
              </td>
              <td>
                <input v-model.number="item.quantity" type="number" class="form-input-small" placeholder="шт">
              </td>
              <td>
                {{ getFlowerQuantity(item.flower_id) }} шт
              </td>
              <td>
                <button @click="removeItem(index)" class="delete-btn">Удалить</button>
              </td>
            </tr>
            </tbody>
          </table>
          <button @click="addItem" class="add-btn">Добавить компонент</button>
        </div>
      </div>

      <div class="form-group">
        <label>Количество букетов (шт):</label>
        <input v-model.number="localData.quantity" type="number" class="form-input">
      </div>

      <div class="form-group">
        <label>Описание:</label>
        <textarea v-model="localData.description" class="form-input" rows="2" placeholder="Нежный букет из красных роз..."></textarea>
      </div>

      <div class="modal-buttons">
        <button @click="$emit('close')" class="cancel-btn">Отмена</button>
        <button @click="handleConfirm" class="confirm-btn">Собрать</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({
      name: '',
      price: 0,
      composition: [{ flower_id: null, quantity: 0 }],
      quantity: 1,
      description: ''
    })
  },
  flowers: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'confirm'])

const localData = reactive({
  name: '',
  price: 0,
  composition: [{ flower_id: null, quantity: 0 }],
  quantity: 1,
  description: ''
})

watch(() => props.initialData, (newVal) => {
  localData.name = newVal.name
  localData.price = newVal.price
  localData.composition = newVal.composition ? [...newVal.composition] : [{ flower_id: null, quantity: 0 }]
  localData.quantity = newVal.quantity
  localData.description = newVal.description
}, { immediate: true, deep: true })

const getFlowerQuantity = (flowerId) => {
  const flower = props.flowers.find(f => f.id === flowerId)
  return flower?.quantity || 0
}

const addItem = () => {
  localData.composition.push({ flower_id: null, quantity: 0 })
}

const removeItem = (index) => {
  localData.composition.splice(index, 1)
}

const handleConfirm = () => {
  emit('confirm', { ...localData })
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
  min-width: 700px;
  max-width: 800px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
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

.form-input-small {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #cccccc;
  border-radius: 4px;
  font-size: 13px;
  color: #000000;
}

.form-input-small:focus {
  outline: none;
  border-color: #999999;
}

textarea.form-input {
  resize: vertical;
  font-family: inherit;
}

.composition-table {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  overflow: hidden;
}

.composition-table table {
  width: 100%;
  border-collapse: collapse;
}

.composition-table th,
.composition-table td {
  padding: 8px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
  color: #000000;
}

.composition-table th {
  background-color: #f0f0f0;
  color: #000000;
}

.add-btn {
  width: 100%;
  padding: 8px;
  background-color: #e0e0e0;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: #000000;
}

.add-btn:hover {
  background-color: #cccccc;
}

.delete-btn {
  padding: 6px 12px;
  margin: 0 2px;
  border: none;
  cursor: pointer;
  background-color: #e0e0e0;
  color: #000000;
  border-radius: 4px;
  font-size: 12px;
}

.delete-btn:hover {
  background-color: #cccccc;
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
