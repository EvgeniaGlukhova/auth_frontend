<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>Приход товара на склад</h3>
        <button class="close-btn" @click="$emit('close')">X</button>
      </div>

      <div class="form-group">
        <label>Товар:</label>
        <select v-model="localData.product_id" class="form-input">
          <option :value="null">Выберите товар</option>
          <option v-for="product in allProducts" :key="product.id" :value="product.id">
            {{ product.name }}
            <span v-if="product.type === 'flower' && product.supplier_name">(поставщик: {{ product.supplier_name }})</span>
            (остаток: {{ product.quantity || 0 }} шт)
          </option>
        </select>
      </div>

      <div class="form-group">
        <label>Количество (шт):</label>
        <input v-model.number="localData.quantity" type="number" class="form-input">
      </div>

      <div class="form-group">
        <label>Дата поступления:</label>
        <input v-model="localData.received_date" type="date" class="form-input">
      </div>

      <div class="form-group">
        <label>Причина прихода:</label>
        <select v-model="localData.reason" class="form-input">
          <option value="Поставка">Поставка от поставщика</option>
          <option value="Возврат">Собран (возврат из сборки)</option>
        </select>
      </div>

      <div class="form-group">
        <label>Комментарий:</label>
        <textarea v-model="localData.comment" class="form-input" rows="2"></textarea>
      </div>

      <div class="info-box" v-if="selectedProduct">
        После прихода остаток товара составит: {{ newQuantity }} шт
      </div>

      <div class="modal-buttons">
        <button @click="$emit('close')" class="cancel-btn">Отмена</button>
        <button @click="handleConfirm" class="confirm-btn">Подтвердить</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, watch } from 'vue'

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({
      product_id: null,
      quantity: 0,
      received_date: new Date().toISOString().split('T')[0],
      reason: 'Поставка',
      comment: ''
    })
  },
  allProducts: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'confirm'])

const localData = reactive({ ...props.initialData })

watch(() => props.initialData, (newVal) => {
  localData.product_id = newVal.product_id
  localData.quantity = newVal.quantity
  localData.received_date = newVal.received_date
  localData.reason = newVal.reason
  localData.comment = newVal.comment
}, { deep: true })

const selectedProduct = computed(() => {
  return props.allProducts.find(p => p.id === localData.product_id)
})

const newQuantity = computed(() => {
  if (!selectedProduct.value) return 0
  return (selectedProduct.value.quantity || 0) + (localData.quantity || 0)
})

const handleConfirm = () => {
  if (!localData.product_id) {
    alert('Выберите товар')
    return
  }
  if (!localData.quantity || localData.quantity <= 0) {
    alert('Укажите количество')
    return
  }
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
  background: white;
}

.form-input:focus {
  outline: none;
  border-color: #999999;
}

textarea.form-input {
  resize: vertical;
  font-family: inherit;
}

.info-box {
  background-color: #f0f0f0;
  padding: 10px;
  border-radius: 6px;
  margin: 15px 0;
  color: #000000;
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
  transition: all 0.3s;
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
