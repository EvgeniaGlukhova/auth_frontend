<template>
  <div v-if="show" class="modal-overlay" @click="close">
    <div class="modal-content large" @click.stop>
    <div class="modal-header">
      <h3>Продажа сейчас</h3>
      <button class="close-btn" @click="close">✕</button>
    </div>

    <div class="modal-body">
      <!-- Поиск клиента по телефону -->
      <div class="form-group">
        <label>Поиск клиента по телефону:</label>
        <div class="search-client-row">
          <input
            v-model="searchPhone"
            type="text"
            class="form-input"
            placeholder="+7 999 123-45-67"
            @input="searchClientByPhone"
          >
          <button @click="searchClientByPhone" class="search-btn">Поиск</button>
        </div>
      </div>

      <!-- Найденный клиент -->
      <div v-if="foundClient" class="found-client">
        <div class="client-info">
          <span class="client-name">{{ foundClient.surname }} {{ foundClient.name }}</span>
          <span class="client-phone">{{ foundClient.phone }}</span>
        </div>
        <button @click="selectFoundClient" class="select-client-btn">Выбрать</button>
      </div>

      <!-- Если клиент уже выбран - показываем его данные -->
      <div v-if="localSale.client_id" class="selected-client">
        <div class="client-info">
          <span class="client-name">{{ getSelectedClientName() }}</span>
          <span class="client-phone">{{ getSelectedClientPhone() }}</span>
        </div>
        <button @click="clearSelectedClient" class="clear-client-btn">✕</button>
      </div>

      <!-- Форма создания нового клиента -->
      <div v-if="showNewClientForm && !localSale.client_id" class="new-client-fields">
        <div class="form-row">
          <div class="form-group">
            <label>Фамилия:</label>
            <input v-model="localSale.new_client.surname" type="text" class="form-input" placeholder="Иванов">
          </div>
          <div class="form-group">
            <label>Имя:</label>
            <input v-model="localSale.new_client.name" type="text" class="form-input" placeholder="Иван">
          </div>
        </div>
        <div class="form-group">
          <label>Телефон:</label>
          <input v-model="localSale.new_client.phone" type="text" class="form-input" placeholder="+7 999 123-45-67">
        </div>
        <div class="form-group">
          <label>Email (необязательно):</label>
          <input v-model="localSale.new_client.email" type="email" class="form-input" placeholder="client@mail.ru">
        </div>
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
          <button @click="addItem" class="add-item-btn">+ Добавить товар</button>
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
import { ref, watch, computed } from 'vue'
import { useDataStore } from '../../stores/dataStore'

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
  users: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'save'])

const dataStore = useDataStore()

// Поиск клиента
const searchPhone = ref('')
const foundClient = ref(null)
const showNewClientForm = ref(false)

// начальные данные
const getEmptySale = () => ({
  client_id: null,
  client_name: '',
  client_phone: '',
  payment_method: null,
  user_id: null,
  comment: '',
  create_new_client: false,
  new_client: {
    surname: '',
    name: '',
    patronymic: '-',
    phone: '',
    email: ''
  },
  items: [{ type: 'flower', id: null, quantity: 1 }]
})

const localSale = ref(getEmptySale())

// методы
// const getClientName = (client) => {
//   const name = `${client.name || ''} ${client.surname || ''}`.trim()
//   const phone = client.phone || ''
//   if (name && phone) return `${name} - ${phone}`
//   return name || phone || 'Клиент'
// }
//
// const getUserFullName = (user) => {
//   if (user.full_name?.trim()) {
//     const fullName = user.full_name.trim()
//     if (fullName && user.role) return `${fullName} (${user.role.name})`
//     return fullName
//   }
//   const name = `${user.surname || ''} ${user.name || ''} ${user.patronymic || ''}`.trim()
//   const roleName = user.role?.name || ''
//   if (name && roleName) return `${name} (${roleName})`
//   return name || user.email?.split('@')[0] || 'Сотрудник'
// }

// Получить имя выбранного клиента
const getSelectedClientName = () => {
  const client = props.clients.find(c => c.id === localSale.value.client_id)
  if (client) return `${client.surname} ${client.name}`
  return localSale.value.client_name || 'Клиент'
}

// Получить телефон выбранного клиента
const getSelectedClientPhone = () => {
  const client = props.clients.find(c => c.id === localSale.value.client_id)
  if (client) return client.phone
  return localSale.value.client_phone || ''
}

// Поиск клиента по телефону
const searchClientByPhone = async () => {
  if (!searchPhone.value || searchPhone.value.length < 10) {
    foundClient.value = null
    return
  }

  const cleanSearch = searchPhone.value.replace(/\s/g, '')
  const client = props.clients.find(c =>
    c.phone && c.phone.replace(/\s/g, '').includes(cleanSearch)
  )

  if (client) {
    foundClient.value = client
    localSale.value.client_name = `${client.surname} ${client.name}`
    localSale.value.client_phone = client.phone
  } else {
    foundClient.value = null
    showNewClientForm.value = true
    localSale.value.new_client.phone = searchPhone.value
  }
}

// Выбрать найденного клиента
const selectFoundClient = () => {
  if (foundClient.value) {
    localSale.value.client_id = foundClient.value.id
    localSale.value.client_name = `${foundClient.value.surname} ${foundClient.value.name}`
    localSale.value.client_phone = foundClient.value.phone
    foundClient.value = null
    searchPhone.value = ''
    showNewClientForm.value = false
  }
}

// Сбросить выбранного клиента
const clearSelectedClient = () => {
  localSale.value.client_id = null
  localSale.value.client_name = ''
  localSale.value.client_phone = ''
  searchPhone.value = ''
  foundClient.value = null
  showNewClientForm.value = false
}

// Сброс формы
const resetForm = () => {
  localSale.value = getEmptySale()
  searchPhone.value = ''
  foundClient.value = null
  showNewClientForm.value = false
}

// Валидация формы
const isValid = () => {
  if (!localSale.value.client_id && !showNewClientForm.value) {
    alert('Укажите клиента (найдите по телефону или создайте нового)')
    return false
  }

  if (showNewClientForm.value) {
    if (!localSale.value.new_client.surname || !localSale.value.new_client.name) {
      alert('Заполните фамилию и имя нового клиента')
      return false
    }
  }

  if (localSale.value.items.length === 0) {
    alert('Добавьте хотя бы один товар')
    return false
  }

  for (let i = 0; i < localSale.value.items.length; i++) {
    const item = localSale.value.items[i]
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
const prepareSaleData = async () => {
  let finalClientId = localSale.value.client_id
  let finalClientName = localSale.value.client_name
  let finalClientPhone = localSale.value.client_phone

  // Если создаем нового клиента
  if (!finalClientId && showNewClientForm.value) {
    const surname = localSale.value.new_client.surname || 'Не указана'
    const name = localSale.value.new_client.name || 'Не указано'
    const patronymic = localSale.value.new_client.patronymic || '-'
    const email = localSale.value.new_client.email || `client_${Date.now()}@temp.com`

    const newClientData = {
      surname: surname,
      name: name,
      patronymic: patronymic,
      email: email,
      phone: localSale.value.new_client.phone || null,
      address: null,
      birth_date: null,
      comments: 'Создан автоматически при продаже'
    }

    try {
      const result = await dataStore.create_client(newClientData)
      finalClientId = result.data?.id || result.id
    } catch (error) {
      console.error('Ошибка создания клиента:', error)
      alert('Не удалось создать клиента. Проверьте данные.')
      return null
    }
  }

  const saleData = {
    type: 'sale',
    items: localSale.value.items.map(item => ({
      type: item.type,
      id: parseInt(item.id),
      quantity: parseInt(item.quantity)
    }))
  }

  // Добавляем client_id, если есть
  if (finalClientId) {
    saleData.client_id = parseInt(finalClientId)
  }

  // Остальные поля
  const fieldsMap = {
    client_name: (val) => val,
    client_phone: (val) => val,
    payment_method: (val) => val,
    comment: (val) => val,
    user_id: (val) => parseInt(val)
  }

  for (const [field, transform] of Object.entries(fieldsMap)) {
    const value = localSale.value[field]
    if (value) {
      saleData[field] = transform(value)
    }
  }

  return saleData
}

const addItem = () => {
  localSale.value.items.push({ type: 'flower', id: null, quantity: 1 })
}

const removeItem = (index) => {
  localSale.value.items.splice(index, 1)
}

const save = async () => {
  if (!isValid()) return

  try {
    const saleData = await prepareSaleData()
    if (!saleData) return

    emit('save', saleData)
  } catch (error) {
    console.error('Ошибка подготовки данных:', error)
    alert('Ошибка при оформлении продажи')
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
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700&display=swap');
/* Добавьте новые стили */
.search-client-row {
  display: flex;
  gap: 0.5rem;
}

.search-btn {
  padding: 0.7rem 1.2rem;
  background: #d9eb61;
  border: none;
  border-radius: 40px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.search-btn:hover {
  background: #c4db3a;
  transform: scale(1.02);
}

.found-client {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem 1rem;
  background: #f9cffd30;
  border-radius: 20px;
  margin: 0.5rem 0 1rem 0;

}

.selected-client {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem 1rem;
  background: #d9eb6130;
  border-radius: 20px;
  margin: 0.5rem 0 1rem 0;

}

.client-info {
  display: flex;
  flex-direction: column;
}

.client-name {
  font-weight: 600;
  color: #2c3e2f;
}

.client-phone {
  font-size: 0.8rem;
  color: #666;
}

.select-client-btn {
  padding: 0.4rem 1rem;
  background: #d9eb61;
  border: none;
  border-radius: 30px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.select-client-btn:hover {
  background: #c4db3a;
  transform: scale(1.05);
}

.clear-client-btn {
  padding: 0.2rem 0.6rem;
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #999;
  transition: all 0.3s ease;
}

.clear-client-btn:hover {
  color: #e85d4a;
  transform: scale(1.1);
}

.new-client-fields {
  margin-top: 0.8rem;
  padding: 1rem;
  background: #f9f9fb;
  border-radius: 20px;
  border: 1px solid #f5f5f7;
}

.form-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.8rem;
}

.form-row .form-group {
  flex: 1;
  margin-bottom: 0;
}


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
