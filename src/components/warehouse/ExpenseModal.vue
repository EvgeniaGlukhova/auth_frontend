<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>Расход товара (списание)</h3>
        <button class="close-btn" @click="$emit('close')">✕</button>
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
        <label>Сотрудник (кто списывает):</label>
        <select v-model="user_id" class="form-input">
          <option :value="null">Выберите сотрудника</option>
          <option v-for="user in users" :key="user.id" :value="user.id">
            {{ getUserFullName(user) }}
          </option>
        </select>
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
  initialData: {
    type: Object,
    default: () => ({})
  },
  allProducts: {
    type: Array,
    default: () => []
  },
  users: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'confirm'])  // ← ИСПРАВЛЕНО

// ==================== ФАБРИКИ НАЧАЛЬНЫХ ДАННЫХ ====================
const getTodayDate = () => new Date().toISOString().split('T')[0]

const resetForm = () => {
  selectedUniqueId.value = null
  quantity.value = 1
  reason.value = 'Продажа'
  writeoff_date.value = getTodayDate()
  comment.value = ''
  user_id.value = null
}

// состояния
const selectedUniqueId = ref(null)
const quantity = ref(1)
const reason = ref('Продажа')
const writeoff_date = ref(getTodayDate())
const comment = ref('')
const user_id = ref(null)

// методы
const getUserFullName = (user) => {
  const name = `${user.surname || ''} ${user.name || ''} ${user.patronymic || ''}`.trim()
  return name || user.email?.split('@')[0] || 'Сотрудник'
}

// Обновление формы из пропсов
watch(() => props.initialData, (newVal) => {
  if (!newVal || Object.keys(newVal).length === 0) {
    resetForm()
    return
  }

  if (newVal.product_id && newVal.product_type) {
    selectedUniqueId.value = `${newVal.product_type}_${newVal.product_id}`
  } else {
    selectedUniqueId.value = null
  }

  quantity.value = newVal.quantity || 1
  reason.value = newVal.reason || 'Продажа'
  writeoff_date.value = newVal.writeoff_date || getTodayDate()
  comment.value = newVal.comment || ''
  user_id.value = newVal.user_id || null
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

const isValid = () => {
  if (!selectedUniqueId.value) {
    alert('Выберите товар')
    return false
  }
  if (!quantity.value || quantity.value <= 0) {
    alert('Укажите количество')
    return false
  }

  const product = selectedProduct.value
  if (!product) {
    alert('Товар не найден')
    return false
  }

  if (quantity.value > product.quantity) {
    alert(`Недостаточно товара! Доступно: ${product.quantity} шт`)
    return false
  }

  return true
}

const handleConfirm = () => {
  if (!isValid()) return

  const product = selectedProduct.value

  emit('confirm', {
    product_id: product.id,
    product_type: product.type,
    quantity: quantity.value,
    reason: reason.value,
    writeoff_date: writeoff_date.value,
    comment: comment.value,
    user_id: user_id.value
  })
}
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

.modal-content {
  background: #ffffff;
  border-radius: 28px;
  padding: 1.8rem;
  min-width: 500px;
  max-width: 600px;
  width: 90%;
  box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.2);
  font-family: 'Inter', sans-serif;
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

.form-group {
  margin-bottom: 1.2rem;
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
  font-family: 'Inter', sans-serif;
  border-radius: 20px;
}

select.form-input {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%234a5b4e' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1rem;
}

.info-box {
  background: #f9cffd30;
  padding: 0.8rem 1rem;
  border-radius: 20px;
  margin: 1rem 0;
  color: #2c3e2f;
  font-size: 0.85rem;
  font-weight: 500;
  text-align: center;

}

.error-text {
  color: #e85d4a;
  font-weight: 700;
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

.confirm-btn:disabled {
  background: #cccccc;
  cursor: not-allowed;
  opacity: 0.6;
  transform: none;
  box-shadow: none;
}
</style>
