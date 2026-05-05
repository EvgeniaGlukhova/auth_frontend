<template>
  <div v-if="show" class="modal-overlay" @click="close">
    <div class="modal-content large" @click.stop>
      <div class="modal-header">
        <h3>Новый заказ</h3>
        <button class="close-btn" @click="close">X</button>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label>Клиент из CRM:</label>
          <select v-model="localOrder.client_id" class="form-input">
            <option :value="null">Выберите клиента</option>
            <option v-for="client in clients" :key="client.id" :value="client.id">
              {{ getClientName(client) }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Имя клиента (если не из CRM):</label>
          <input v-model="localOrder.client_name" type="text" class="form-input" placeholder="Введите имя">
        </div>

        <div class="form-group">
          <label>Телефон клиента (если не из CRM):</label>
          <input v-model="localOrder.client_phone" type="text" class="form-input" placeholder="+7 XXX XXX-XX-XX">
        </div>

        <div class="form-group">
          <label>Дата доставки:</label>
          <input v-model="localOrder.delivery_date" type="date" class="form-input">
        </div>

        <div class="form-group">
          <label>Время доставки:</label>
          <input v-model="localOrder.delivery_time" type="time" class="form-input">
        </div>

        <div class="form-group">
          <label>Способ оплаты:</label>
          <select v-model="localOrder.payment_method" class="form-input">
            <option :value="null">Не выбрано</option>
            <option value="cash">Наличные</option>
            <option value="card">Карта</option>
            <option value="qr">QR-код</option>
          </select>
        </div>

        <div class="form-group">
          <label>Комментарий:</label>
          <textarea v-model="localOrder.comment" class="form-input" rows="3"></textarea>
        </div>

        <div class="form-group">
          <label>Товары:</label>
          <div class="items-list">
            <div v-for="(item, index) in localOrder.items" :key="index" class="item-row">
              <select v-model="item.type" class="item-type">
                <option value="flower">Цветок</option>
                <option value="bouquet">Букет</option>
              </select>
              <select v-model="item.id" class="item-select">
                <option :value="null">Выберите товар</option>
                <template v-if="item.type === 'flower'">
                  <option v-for="flower in flowers" :key="flower.id" :value="flower.id">
                    {{ flower.name }} - {{ flower.price }} руб.
                  </option>
                </template>
                <template v-else>
                  <option v-for="bouquet in bouquets" :key="bouquet.id" :value="bouquet.id">
                    {{ bouquet.name }} - {{ bouquet.price }} руб.
                  </option>
                </template>
              </select>
              <input v-model.number="item.quantity" type="number" min="1" class="item-quantity" placeholder="Кол-во">
              <button @click="removeItem(index)" class="remove-item-btn">Удалить</button>
            </div>
            <button @click="addItem" class="add-item-btn">Добавить товар</button>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="close" class="cancel-btn">Отмена</button>
        <button @click="save" class="confirm-btn">Создать заказ</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  show: Boolean,
  clients: Array,
  flowers: Array,
  bouquets: Array,
  selectedDate: String
})

const emit = defineEmits(['close', 'save'])

const localOrder = ref({
  client_id: null,
  client_name: '',
  client_phone: '',
  delivery_date: '',
  delivery_time: '',
  payment_method: null,
  comment: '',
  items: [{ type: 'flower', id: null, quantity: 1 }]
})

// Получить имя клиента
const getClientName = (client) => {
  const name = `${client.name || ''} ${client.surname || ''}`.trim()
  const phone = client.phone || ''
  if (name && phone) {
    return `${name} - ${phone}`
  }
  return name || phone || 'Клиент'
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    localOrder.value = {
      client_id: null,
      client_name: '',
      client_phone: '',
      delivery_date: props.selectedDate || '',
      delivery_time: '',
      payment_method: null,
      comment: '',
      items: [{ type: 'flower', id: null, quantity: 1 }]
    }
  }
})

const addItem = () => {
  localOrder.value.items.push({ type: 'flower', id: null, quantity: 1 })
}

const removeItem = (index) => {
  localOrder.value.items.splice(index, 1)
}

const save = () => {
  // Валидация: должно быть указано либо client_id, либо client_name
  if (!localOrder.value.client_id && !localOrder.value.client_name) {
    alert('Укажите клиента (выберите из списка или введите имя)')
    return
  }

  if (localOrder.value.items.length === 0) {
    alert('Добавьте хотя бы один товар')
    return
  }

  // Проверяем каждый товар
  for (let i = 0; i < localOrder.value.items.length; i++) {
    const item = localOrder.value.items[i]
    if (!item.id) {
      alert(`Выберите товар в позиции ${i + 1}`)
      return
    }
    if (!item.quantity || item.quantity < 1) {
      alert(`Укажите количество товара в позиции ${i + 1}`)
      return
    }
  }

  // Подготавливаем данные в правильном формате
  const orderData = {
    type: 'order',
    items: localOrder.value.items.map(item => ({
      type: item.type,
      id: parseInt(item.id),
      quantity: parseInt(item.quantity)
    }))
  }

  // Добавляем только заполненные поля
  if (localOrder.value.client_id) {
    orderData.client_id = parseInt(localOrder.value.client_id)
  }
  if (localOrder.value.client_name) {
    orderData.client_name = localOrder.value.client_name
  }
  if (localOrder.value.client_phone) {
    orderData.client_phone = localOrder.value.client_phone
  }
  if (localOrder.value.delivery_date) {
    orderData.delivery_date = localOrder.value.delivery_date
  }
  if (localOrder.value.delivery_time) {
    orderData.delivery_time = localOrder.value.delivery_time
  }
  if (localOrder.value.payment_method) {
    orderData.payment_method = localOrder.value.payment_method
  }
  if (localOrder.value.comment) {
    orderData.comment = localOrder.value.comment
  }

  emit('save', orderData)
}

const close = () => {
  emit('close')
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
  max-width: 700px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
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
  padding: 15px 20px;
  border-top: 1px solid #e0e0e0;
  background: #f0f0f0;
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

.form-input, select.form-input, textarea.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #cccccc;
  border-radius: 4px;
  font-size: 14px;
  color: #000000;
  background: white;
}

.form-input:focus, select.form-input:focus, textarea.form-input:focus {
  outline: none;
  border-color: #999999;
}

.items-list {
  border: 1px solid #cccccc;
  border-radius: 4px;
  padding: 10px;
}

.item-row {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  align-items: center;
}

.item-type {
  width: 100px;
  padding: 5px;
  border: 1px solid #cccccc;
  border-radius: 4px;
  background: white;
  color: #000000;
}

.item-select {
  flex: 2;
  padding: 5px;
  border: 1px solid #cccccc;
  border-radius: 4px;
  background: white;
  color: #000000;
}

.item-quantity {
  width: 80px;
  padding: 5px;
  border: 1px solid #cccccc;
  border-radius: 4px;
  color: #000000;
}

.remove-item-btn {
  padding: 5px 10px;
  background: #e0e0e0;
  color: #000000;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.remove-item-btn:hover {
  background: #cccccc;
}

.add-item-btn {
  width: 100%;
  padding: 8px;
  background: #e0e0e0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
  color: #000000;
}

.add-item-btn:hover {
  background: #cccccc;
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
