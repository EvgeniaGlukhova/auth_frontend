<template>
  <div v-if="show" class="modal-overlay" @click="close">
    <div class="modal-content large" @click.stop>
      <div class="modal-header">
        <h3>Продажа сейчас</h3>
        <button class="close-btn" @click="close">✕</button>
      </div>


      <div class="modal-body">
        <div class="form-group">
          <label> Сотрудник:</label>
          <select v-model="localSale.user_id" class="form-input">
            <option :value="null">Выберите сотрудника</option>
            <option v-for="user in users" :key="user.id" :value="user.id">
              {{ getUserFullName(user) }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>Клиент из CRM:</label>
          <select v-model="localSale.client_id" class="form-input">
            <option :value="null">Выберите клиента</option>
            <option v-for="client in clients" :key="client.id" :value="client.id">
              {{ getClientName(client) }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Имя клиента (если не из CRM):</label>
          <input v-model="localSale.client_name" type="text" class="form-input" placeholder="Введите имя">
        </div>

        <div class="form-group">
          <label>Телефон клиента (если не из CRM):</label>
          <input v-model="localSale.client_phone" type="text" class="form-input" placeholder="+7 XXX XXX-XX-XX">
        </div>

        <div class="form-group">
          <label>Способ оплаты:</label>
          <select v-model="localSale.payment_method" class="form-input">
            <option :value="null">Не выбрано</option>
            <option value="cash">Наличные</option>
            <option value="card">Карта</option>
            <option value="qr">QR-код</option>
          </select>
        </div>

        <div class="form-group">
          <label>Комментарий:</label>
          <textarea v-model="localSale.comment" class="form-input" rows="3"></textarea>
        </div>

        <div class="form-group">
          <label>Товары:</label>
          <div class="items-list">
            <div v-for="(item, index) in localSale.items" :key="index" class="item-row">
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
        <button @click="save" class="confirm-btn">Оформить продажу</button>
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
  materials: Array,
  users: Array
})

const emit = defineEmits(['close', 'save'])

const localSale = ref({
  client_id: null,
  client_name: '',
  client_phone: '',
  payment_method: null,
  user_id: null,
  comment: '',
  items: [{ type: 'flower', id: null, quantity: 1 }]
})

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
    localSale.value = {
      client_id: null,
      client_name: '',
      client_phone: '',
      payment_method: null,
      comment: '',
      items: [{ type: 'flower', id: null, quantity: 1 }]
    }
  }
})

const addItem = () => {
  localSale.value.items.push({ type: 'flower', id: null, quantity: 1 })
}

const removeItem = (index) => {
  localSale.value.items.splice(index, 1)
}

const save = () => {
  // Валидация: должно быть указано либо client_id, либо client_name
  if (!localSale.value.client_id && !localSale.value.client_name) {
    alert('Укажите клиента (выберите из списка или введите имя)')
    return
  }

  if (localSale.value.items.length === 0) {
    alert('Добавьте хотя бы один товар')
    return
  }

  // Проверяем каждый товар
  for (let i = 0; i < localSale.value.items.length; i++) {
    const item = localSale.value.items[i]
    if (!item.id) {
      alert(`Выберите товар в позиции ${i + 1}`)
      return
    }
    if (!item.quantity || item.quantity < 1) {
      alert(`Укажите количество товара в позиции ${i + 1}`)
      return
    }
  }

  // Подготавливаем данные для отправки в формате, который ожидает API
  const saleData = {
    type: 'sale',
    items: localSale.value.items.map(item => ({
      type: item.type,
      id: parseInt(item.id),
      quantity: parseInt(item.quantity)
    }))
  }

  // Добавляем только заполненные поля
  if (localSale.value.client_id) {
    saleData.client_id = parseInt(localSale.value.client_id)
  }
  if (localSale.value.client_name) {
    saleData.client_name = localSale.value.client_name
  }
  if (localSale.value.client_phone) {
    saleData.client_phone = localSale.value.client_phone
  }
  if (localSale.value.payment_method) {
    saleData.payment_method = localSale.value.payment_method
  }
  if (localSale.value.comment) {
    saleData.comment = localSale.value.comment
  }

  emit('save', saleData)
}

const getUserFullName = (user) => {
  // Используем аксессор full_name, который уже есть в модели
  if (user.full_name) {
    const fullName = user.full_name.trim()
    if (fullName && user.role) {
      return `${fullName} (${user.role.name})`
    }
    return fullName
  }

  // Если full_name нет, собираем вручную
  const name = `${user.surname || ''} ${user.name || ''} ${user.patronymic || ''}`.trim()
  const roleName = user.role?.name || ''

  if (name && roleName) {
    return `${name} (${roleName})`
  }

  return name || user.email?.split('@')[0] || 'Сотрудник'
}

const close = () => {
  emit('close')
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
  color: #000000;
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
  color: #000000;
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
  color: #000000;
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
  color: #000000;
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
  color: #000000;
}

.item-quantity:focus {
  outline: none;
  border-color: #d9eb61;
}

.remove-item-btn {
  padding: 0.4rem 0.8rem;
  background: #f5f5f7;
  color: #000000;
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
  color: #000000;
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
  color: #000000;
}

.cancel-btn:hover {
  background: #e8e8ec;
  transform: translateY(-1px);
}

.confirm-btn {
  background: #d9eb61;
  color: #000000;
  box-shadow: 0 2px 6px rgba(217, 235, 97, 0.3);
}

.confirm-btn:hover {
  background: #c4db3a;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(217, 235, 97, 0.4);
}
</style>
