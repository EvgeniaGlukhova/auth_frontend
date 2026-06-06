<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>Расход товара (списание)</h3>
        <button class="close-btn" @click="$emit('close')">X</button>
      </div>

      <div class="form-group">
        <label>Товар:</label>
        <select v-model="selectedUniqueId" class="form-input" @change="onProductChange">
          <option :value="null">Выберите товар</option>
          <option v-for="product in allProducts" :key="product.uniqueId" :value="product.uniqueId">
            {{ product.name }}
            (остаток: {{ product.quantity || 0 }} шт)
          </option>
        </select>
      </div>

      <div class="form-group">
        <label>Количество (шт):</label>
        <input v-model.number="quantity" type="number" class="form-input">
      </div>

      <div class="form-group">
        <label>Причина списания:</label>
        <select v-model="reason" class="form-input">
          <option value="Продажа">Продажа</option>
          <option value="Брак / испорченный товар">Брак / испорченный товар</option>
          <option value="Инвентаризация">Инвентаризация</option>
          <option value="Перемещение на другой склад">Перемещение на другой склад</option>
          <option value="Списание по истечению срока">Списание по истечению срока</option>
        </select>
      </div>

      <div class="form-group">
        <label>Дата списания:</label>
        <input v-model="writeoff_date" type="date" class="form-input">
      </div>

      <div class="form-group">
        <label>Комментарий:</label>
        <textarea v-model="comment" class="form-input" rows="2" placeholder="Заказ 145 - 10 роз"></textarea>
      </div>

      <div class="info-box" v-if="selectedProduct && quantity > 0">
        <span v-if="newQuantity >= 0">
          После списания остаток товара составит: {{ newQuantity }} шт
        </span>
        <span v-else class="error-text">
          Ошибка: недостаточно товара на складе!
        </span>
      </div>

      <div class="modal-buttons">
        <button @click="$emit('close')" class="cancel-btn">Отмена</button>
        <button @click="handleConfirm" class="confirm-btn" :disabled="newQuantity < 0">Списать</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  initialData: Object,
  allProducts: Array
})

const emit = defineEmits(['close', 'confirm'])

const selectedUniqueId = ref(null)
const quantity = ref(1)
const reason = ref('Продажа')
const writeoff_date = ref(new Date().toISOString().split('T')[0])
const comment = ref('')

watch(() => props.initialData, (newVal) => {
  if (newVal && newVal.product_id && newVal.product_type) {
    selectedUniqueId.value = `${newVal.product_type}_${newVal.product_id}`
  } else {
    selectedUniqueId.value = null
  }
  quantity.value = newVal?.quantity || 1
  reason.value = newVal?.reason || 'Продажа'
  writeoff_date.value = newVal?.writeoff_date || new Date().toISOString().split('T')[0]
  comment.value = newVal?.comment || ''
}, { immediate: true, deep: true })

const selectedProduct = computed(() => {
  if (!selectedUniqueId.value) return null
  return props.allProducts?.find(p => p.uniqueId === selectedUniqueId.value)
})

const newQuantity = computed(() => {
  if (!selectedProduct.value) return 0
  return (selectedProduct.value.quantity || 0) - (quantity.value || 0)
})

const onProductChange = () => {
  console.log('Выбран товар для расхода:', selectedUniqueId.value)
  console.log('selectedProduct:', selectedProduct.value)
}

const handleConfirm = () => {
  if (!selectedUniqueId.value) {
    alert('Выберите товар')
    return
  }
  if (!quantity.value || quantity.value <= 0) {
    alert('Укажите количество')
    return
  }

  const product = selectedProduct.value
  if (!product) {
    alert('Товар не найден')
    return
  }

  if (quantity.value > product.quantity) {
    alert(`Недостаточно товара! Доступно: ${product.quantity} шт`)
    return
  }

  emit('confirm', {
    product_id: product.id,
    product_type: product.type,
    quantity: quantity.value,
    reason: reason.value,
    writeoff_date: writeoff_date.value,
    comment: comment.value
  })
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
  min-width: 600px;
  max-width: 700px;
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

.error-text {
  color: #f44336;
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

.confirm-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
