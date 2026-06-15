<template>
  <div v-if="show" class="modal-overlay" @click="close">
    <div class="modal-content large" @click.stop>
      <div class="modal-header">
        <h3>Новый заказ</h3>
        <button class="close-btn" @click="close">✕</button>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label>Тип доставки:</label>
          <select v-model="localOrder.delivery_type" class="form-input">
            <option value="pickup">Самовывоз</option>
            <option value="delivery">Доставка</option>
          </select>
        </div>

        <div class="form-group" v-if="localOrder.delivery_type === 'delivery'">
          <label>Адрес доставки:</label>
          <textarea v-model="localOrder.delivery_address" class="form-input" rows="2" placeholder="г. Москва, ул. Цветочная, д. 1"></textarea>
        </div>

        <div class="form-group" v-if="localOrder.delivery_type === 'delivery'">
          <label>Курьер:</label>
          <select v-model="localOrder.courier_id" class="form-input">
            <option :value="null">Выберите курьера</option>
            <option v-for="user in couriers" :key="user.id" :value="user.id">
              {{ getUserFullName(user) }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Сотрудник:</label>
          <select v-model="localOrder.user_id" class="form-input">
            <option :value="null">Выберите сотрудника</option>
            <option v-for="user in users" :key="user.id" :value="user.id">
              {{ getUserFullName(user) }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>Клиент:</label>
          <select v-model="localOrder.client_id" class="form-input">
            <option :value="null">Выберите клиента</option>
            <option v-for="client in clients" :key="client.id" :value="client.id">
              {{ getClientName(client) }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Имя (новый клиент):</label>
          <input v-model="localOrder.client_name" type="text" class="form-input" placeholder="Введите имя">
        </div>

        <div class="form-group">
          <label>Телефон (новый клиент):</label>
          <input v-model="localOrder.client_phone" type="text" class="form-input" placeholder="+7 XXX XXX-XX-XX">
        </div>

        <div class="form-group">
          <label>Дата:</label>
          <input v-model="localOrder.delivery_date" type="date" class="form-input">
        </div>

        <div class="form-group">
          <label>Время:</label>
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
                <option value="material">Материал</option>
              </select>
              <select v-model="item.id" class="item-select">
                <option :value="null">Выберите товар</option>
                <template v-if="item.type === 'flower'">
                  <option v-for="flower in flowers" :key="flower.id" :value="flower.id">
                    {{ flower.name }} - {{ flower.price }} руб.
                  </option>
                </template>
                <template v-else-if="item.type === 'bouquet'">
                  <option v-for="bouquet in bouquets" :key="bouquet.id" :value="bouquet.id">
                    {{ bouquet.name }} - {{ bouquet.price }} руб.
                  </option>
                </template>
                <template v-else-if="item.type === 'material'">
                  <option v-for="material in materials" :key="material.id" :value="material.id">
                    {{ material.name }} - {{ material.price }} руб.
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
import { ref, watch, computed } from 'vue'

const props = defineProps({
  show: Boolean,
  clients: {
    type: Array,
    default: () => []
  },
  flowers: {
    type: Array,
    default: () => []
  },
  bouquets: {
    type: Array,
    default: () => []
  },
  materials: {
    type: Array,
    default: () => []
  },
  selectedDate: String,
  users: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'save'])

// начальные данные
const getEmptyOrder = (selectedDate) => ({
  client_id: null,
  client_name: '',
  client_phone: '',
  delivery_date: selectedDate || '',
  delivery_time: '',
  user_id: null,
  payment_method: null,
  comment: '',
  delivery_type: 'pickup',
  delivery_address: '',
  courier_id: null,
  assembly_date: '',
  items: [{ type: 'flower', id: null, quantity: 1 }]
})


const couriers = computed(() => {
  if (!props.users) return []
  return props.users.filter(user =>
    user.role_id === 5 || user.role?.name === 'courier' || user.role === 'courier'
  )
})

// состояние
const localOrder = ref(getEmptyOrder(props.selectedDate))

// методы
const getClientName = (client) => {
  const name = `${client.name || ''} ${client.surname || ''}`.trim()
  const phone = client.phone || ''
  if (name && phone) return `${name} - ${phone}`
  return name || phone || 'Клиент'
}

const getUserFullName = (user) => {
  if (user.full_name?.trim()) {
    const fullName = user.full_name.trim()
    if (fullName && user.role) return `${fullName} (${user.role.name})`
    return fullName
  }
  const name = `${user.surname || ''} ${user.name || ''} ${user.patronymic || ''}`.trim()
  const roleName = user.role?.name || ''
  if (name && roleName) return `${name} (${roleName})`
  return name || user.email?.split('@')[0] || 'Сотрудник'
}

// Сброс формы
const resetForm = () => {
  localOrder.value = getEmptyOrder(props.selectedDate)
}

// Валидация формы
const isValid = () => {
  if (!localOrder.value.client_id && !localOrder.value.client_name) {
    alert('Укажите клиента (выберите из списка или введите имя)')
    return false
  }

  if (localOrder.value.items.length === 0) {
    alert('Добавьте хотя бы один товар')
    return false
  }

  for (let i = 0; i < localOrder.value.items.length; i++) {
    const item = localOrder.value.items[i]
    if (!item.id) {
      alert(`Выберите товар в позиции ${i + 1}`)
      return false
    }
    if (!item.quantity || item.quantity < 1) {
      alert(`Укажите количество товара в позиции ${i + 1}`)
      return false
    }
  }

  return true
}

// Подготовка данных для отправки
const prepareOrderData = () => {
  const orderData = {
    type: 'order',
    items: localOrder.value.items.map(item => ({
      type: item.type,
      id: parseInt(item.id),
      quantity: parseInt(item.quantity)
    }))
  }

  //
  const fieldsMap = {
    client_id: (val) => parseInt(val),
    courier_id: (val) => parseInt(val),
    client_name: (val) => val,
    client_phone: (val) => val,
    delivery_date: (val) => val,
    delivery_time: (val) => val,
    payment_method: (val) => val,
    comment: (val) => val,
    delivery_type: (val) => val,
    delivery_address: (val) => val,
    assembly_date: (val) => val
  }

  for (const [field, transform] of Object.entries(fieldsMap)) {
    const value = localOrder.value[field]
    if (value) {
      orderData[field] = transform(value)
    }
  }

  return orderData
}

const addItem = () => {
  localOrder.value.items.push({ type: 'flower', id: null, quantity: 1 })
}

const removeItem = (index) => {
  localOrder.value.items.splice(index, 1)
}

const save = () => {
  if (!isValid()) return

  try {
    const orderData = prepareOrderData()
    console.log('=== ОТЛАДКА delivery_type ===')
    console.log('localOrder.value.delivery_type:', localOrder.value.delivery_type)
    console.log('Тип значения:', typeof localOrder.value.delivery_type)

    emit('save', orderData)
  } catch (error) {
    console.error('Ошибка подготовки данных:', error)
    alert('Ошибка при формировании заказа')
  }
}

const close = () => {
  emit('close')
}


watch(() => props.show, (newVal) => {
  if (newVal) {
    resetForm()
  }
})

watch(() => props.selectedDate, (newDate) => {
  if (newDate && !localOrder.value.delivery_date) {
    localOrder.value.delivery_date = newDate
  }
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

.modal-content {
  background: #ffffff;
  border-radius: 28px;
  max-width: 700px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.2);
  font-family: 'Inter', sans-serif;
}

/* Скроллбар */
.modal-content::-webkit-scrollbar {
  width: 6px;
}

.modal-content::-webkit-scrollbar-track {
  background: #f0f0f0;
  border-radius: 10px;
}

.modal-content::-webkit-scrollbar-thumb {
  background: #cccccc;
  border-radius: 10px;
}

.modal-content::-webkit-scrollbar-thumb:hover {
  background: #aaaaaa;
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
  gap: 0.8rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #f5f5f7;
  background: #ffffff;
  position: sticky;
  bottom: 0;
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

.form-input,
select.form-input,
textarea.form-input {
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

.form-input:focus,
select.form-input:focus,
textarea.form-input:focus {
  outline: none;
  border-color: #d9eb61;
  box-shadow: 0 0 0 3px #d9eb6140;
}

textarea.form-input {
  resize: vertical;
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

/* Список товаров */
.items-list {
  border: 2px solid #f5f5f7;
  border-radius: 20px;
  padding: 1rem;
  background: #ffffff;
}

.item-row {
  display: flex;
  gap: 0.8rem;
  margin-bottom: 0.8rem;
  align-items: center;
  flex-wrap: wrap;
}

.item-type {
  width: 110px;
  padding: 0.5rem 0.8rem;
  border: 2px solid #f5f5f7;
  border-radius: 30px;
  font-size: 0.8rem;
  font-family: 'Inter', sans-serif;
  background: #ffffff;
  color: #2c3e2f;
  cursor: pointer;
}

.item-type:focus {
  outline: none;
  border-color: #d9eb61;
}

.item-select {
  flex: 2;
  min-width: 150px;
  padding: 0.5rem 0.8rem;
  border: 2px solid #f5f5f7;
  border-radius: 30px;
  font-size: 0.8rem;
  font-family: 'Inter', sans-serif;
  background: #ffffff;
  color: #2c3e2f;
  cursor: pointer;
}

.item-select:focus {
  outline: none;
  border-color: #d9eb61;
}

.item-quantity {
  width: 80px;
  padding: 0.5rem 0.8rem;
  border: 2px solid #f5f5f7;
  border-radius: 30px;
  font-size: 0.8rem;
  font-family: 'Inter', sans-serif;
  text-align: center;
  color: #2c3e2f;
}

.item-quantity:focus {
  outline: none;
  border-color: #d9eb61;
}

.remove-item-btn {
  padding: 0.4rem 0.8rem;
  background: #f5f5f7;
  color: #4a5b4e;
  border: none;
  border-radius: 30px;
  cursor: pointer;
  font-size: 0.7rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.remove-item-btn:hover {
  background: #f9cffd;
  transform: scale(1.02);
}

.add-item-btn {
  width: 100%;
  padding: 0.6rem;
  background: #ffffff;
  border: 2px solid #d9eb61;
  border-radius: 40px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  color: #2c3e2f;
  transition: all 0.3s ease;
  margin-top: 0.5rem;
}

.add-item-btn:hover {
  background: #d9eb61;
  transform: translateY(-1px);
}

/* Кнопки футера */
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
</style>
