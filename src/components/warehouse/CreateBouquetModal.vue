<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>Сборка готового букета</h3>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="form-group">
        <label>Название букета:</label>
        <input v-model="localData.name" type="text" class="form-input">
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
              <th>Тип</th>
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
                <select v-model="item.itemable_type" class="form-input-small">
                  <option value="flower">Цветок</option>
                  <option value="material">Материал</option>
                </select>
              </td>
              <td>
                <select v-model="item.itemable_id" class="form-input-small">
                  <option :value="null">Выберите товар</option>
                  <template v-if="item.itemable_type === 'flower'">
                    <option v-for="flower in flowers" :key="flower.id" :value="flower.id">
                      {{ flower.name }}
                    </option>
                  </template>
                  <template v-else>
                    <option v-for="material in materials" :key="material.id" :value="material.id">
                      {{ material.name }}
                    </option>
                  </template>
                </select>
              </td>
              <td>
                <input v-model.number="item.quantity" type="number" class="form-input-small" placeholder="шт">
              </td>
              <td>
                {{ getItemQuantity(item) }} шт
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

      <!-- Выбор сотрудника -->
      <div class="form-group">
        <label>Сотрудник:</label>
        <select v-model="localData.user_id" class="form-input">
          <option :value="null">Выберите сотрудника</option>
          <option v-for="user in users" :key="user.id" :value="user.id">
            {{ getFullName(user) }} ({{ getRoleName(user) }})
          </option>
        </select>
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
      description: '',
      user_id: null
    })
  },
  flowers: {
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

const emit = defineEmits(['close', 'confirm'])

const localData = reactive({
  name: '',
  price: 0,
  composition: [{ itemable_type: 'flower', itemable_id: null, quantity: 0 }],
  quantity: 1,
  description: '',
  user_id: null
})

watch(() => props.initialData, (newVal) => {
  localData.name = newVal.name
  localData.price = newVal.price
  localData.composition = newVal.composition ? [...newVal.composition] : [{ itemable_type: 'flower', itemable_id: null, quantity: 0 }]
  localData.quantity = newVal.quantity
  localData.description = newVal.description
  localData.user_id = newVal.user_id
}, { immediate: true, deep: true })


const getItemQuantity = (item) => {
  if (item.itemable_type === 'flower') {
    const flower = props.flowers.find(f => f.id === item.itemable_id)
    return flower?.quantity || 0
  } else {
    const material = props.materials.find(m => m.id === item.itemable_id)
    return material?.quantity || 0
  }
}

const getFullName = (user) => {
  const name = `${user.surname || ''} ${user.name || ''} ${user.patronymic || ''}`.trim()
  return name || user.email?.split('@')[0] || 'Сотрудник'
}

const getRoleName = (user) => {
  const roles = {
    1: 'Администратор',
    2: 'Флорист',
    3: 'Продавец',
    4: 'Продавец-флорист',
    5: 'Курьер'
  }
  return roles[user.role_id] || 'Сотрудник'
}

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
  if (!localData.name) {
    alert('Введите название букета')
    return
  }
  if (!localData.price || localData.price <= 0) {
    alert('Введите цену букета')
    return
  }
  if (!localData.user_id) {
    alert('Выберите сотрудника, который собирает букет')
    return
  }

  const validComposition = localData.composition.filter(item => item.itemable_id && item.quantity > 0)
  if (validComposition.length === 0) {
    alert('Добавьте хотя бы один компонент в состав букета')
    return
  }

  emit('confirm', { ...localData })
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
  min-width: 700px;
  max-width: 850px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.2);
  font-family: 'Inter', sans-serif;
}

/* Скроллбар для модального окна */
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

.form-input-small {
  width: 100%;
  padding: 0.5rem 0.8rem;
  border: 2px solid #f5f5f7;
  border-radius: 30px;
  font-size: 0.8rem;
  font-family: 'Inter', sans-serif;
  transition: all 0.3s ease;
  color: #2c3e2f;
  background: #ffffff;
  box-sizing: border-box;
}

.form-input-small:focus {
  outline: none;
  border-color: #d9eb61;
  box-shadow: 0 0 0 2px #d9eb6140;
}

textarea.form-input {
  resize: vertical;
  font-family: 'Inter', sans-serif;
  border-radius: 20px;
}

select.form-input,
select.form-input-small {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%234a5b4e' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1rem;
}

/* Таблица состава букета */
.composition-table {
  border: 1px solid #f5f5f7;
  border-radius: 20px;
  overflow: hidden;
  margin-top: 0.5rem;
}

.composition-table table {
  width: 100%;
  border-collapse: collapse;
}

.composition-table th,
.composition-table td {
  padding: 0.7rem;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
  color: #2c3e2f;
  font-size: 0.85rem;
}

.composition-table th {
  background-color: #f9f9fb;
  font-weight: 600;
  color: #4a5b4e;
  font-size: 0.8rem;
}

/* Кнопки в таблице */
.add-btn {
  width: 100%;
  padding: 0.7rem;
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

.add-btn:hover {
  background: #d9eb61;
  transform: translateY(-1px);
}

.delete-btn {
  padding: 0.3rem 0.8rem;
  border: none;
  cursor: pointer;
  background: #f5f5f7;
  color: #4a5b4e;
  border-radius: 30px;
  font-size: 0.75rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.delete-btn:hover {
  background: #f9cffd;
  transform: scale(1.02);
}

/* Кнопки модального окна */
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
</style>
