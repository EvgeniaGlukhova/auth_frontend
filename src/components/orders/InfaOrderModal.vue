<template>
  <div v-if="show" class="modal-overlay" @click="close">
    <div class="modal-content details-modal" @click.stop>
      <div class="modal-header">
        <h3>Заказ #{{ order?.id }} - {{ getClientName() }}</h3>
        <button class="close-btn" @click="close">✕</button>
      </div>

      <div class="modal-body">
        <!-- Информация о заказе -->
        <div class="info-section">
          <div class="section-title">ИНФОРМАЦИЯ О ЗАКАЗЕ</div>
          <div class="info-grid">
            <div class="info-row">
              <span class="info-label">Сотрудник:</span>
              <span class="info-value">{{ getEmployeeName() }}</span>
            </div>
            <div class="info-row" v-if="order?.delivery_type">
              <span class="info-label">Тип доставки:</span>
              <span class="info-value">{{ getDeliveryTypeText(order?.delivery_type) }}</span>
            </div>
            <div class="info-row" v-if="order?.delivery_address">
              <span class="info-label">Адрес доставки:</span>
              <span class="info-value">{{ order?.delivery_address }}</span>
            </div>
            <div class="info-row" v-if="order?.courier">
              <span class="info-label">Курьер:</span>
              <span class="info-value">{{ getCourierName() }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Номер заказа:</span>
              <span class="info-value">{{ order?.id }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Дата создания:</span>
              <span class="info-value">{{ formatDate(order?.created_at) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Дата готовности:</span>
              <span class="info-value">{{ getReadyDate() }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Текущий статус:</span>
              <span class="info-value status-badge" :class="order?.status">
                {{ getStatusText(order?.status) }}
              </span>
            </div>
            <div class="info-row">
              <span class="info-label">Тип заказа:</span>
              <span class="info-value">{{ order?.type === 'order' ? 'Заказ' : 'Продажа' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Способ оплаты:</span>
              <span class="info-value">{{ getPaymentMethodText(order?.payment_method) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Итого:</span>
              <span class="info-value total">{{ order?.total_amount }} руб.</span>
            </div>
            <div v-if="order?.comment" class="info-row">
              <span class="info-label">Комментарий:</span>
              <span class="info-value">{{ order?.comment }}</span>
            </div>
          </div>
        </div>

        <!-- Состав заказа -->
        <div class="info-section">
          <div class="section-title">СОСТАВ ЗАКАЗА</div>
          <table class="items-table">
            <thead>
            <tr>
              <th>Товар</th>
              <th>Количество</th>
              <th>Цена</th>
              <th>Сумма</th>
            </tr>
            </thead>
            <tbody>
            <tr v-if="!order?.items || order.items.length === 0">
              <td colspan="4" style="text-align: center;">Нет товаров в заказе</td>
            </tr>
            <tr v-for="item in order?.items" :key="item.id">
              <td>{{ getItemName(item) }}</td>
              <td>{{ item.quantity }} шт</td>
              <td>{{ formatPrice(item.price || item.itemable?.price) }} руб</td>
              <td>{{ formatPrice(item.quantity * (item.price || item.itemable?.price)) }} руб</td>
            </tr>
            <tr class="total-row">
              <td colspan="3" class="total-label">Итого:</td>
              <td class="total-value">{{ order?.total_amount }} руб</td>
            </tr>
            </tbody>
          </table>
        </div>

        <!-- Информация о клиенте -->
        <div class="info-section">
          <div class="section-title">КЛИЕНТ</div>
          <div class="info-grid">
            <div class="info-row">
              <span class="info-label">Имя:</span>
              <span class="info-value">{{ getClientFullName() }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Телефон:</span>
              <span class="info-value">{{ getClientPhone() }}</span>
            </div>
            <div v-if="order?.delivery_date" class="info-row">
              <span class="info-label">Доставка:</span>
              <span class="info-value">{{ formatDate(order?.delivery_date) }} {{ order?.delivery_time || '' }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button
          v-if="canChangeStatus"
          @click="changeStatus"
          class="action-status-btn"
          :class="getStatusActionClass()"
        >
          {{ getStatusActionText() }}
        </button>
        <button @click="close" class="close-modal-btn">Закрыть</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  show: Boolean,
  order: Object
})

const emit = defineEmits(['close', 'status-change', 'complete-order'])

const formatPrice = (price) => {
  if (!price && price !== 0) return '0'
  return Number(price).toFixed(2)
}

const canChangeStatus = computed(() => {
  if (!props.order) return false
  const status = props.order.status
  return status !== 'completed' && status !== 'cancelled'
})

const getClientName = () => {
  if (!props.order) return ''
  return props.order.client_name || props.order.client?.name || 'Клиент'
}

const getClientFullName = () => {
  if (!props.order) return 'Не указан'
  if (props.order.client) {
    return `${props.order.client.surname || ''} ${props.order.client.name || ''}`.trim() || props.order.client.name
  }
  return props.order.client_name || 'Не указан'
}

const getClientPhone = () => {
  if (!props.order) return 'Не указан'
  if (props.order.client) {
    return props.order.client.phone || 'Не указан'
  }
  return props.order.client_phone || 'Не указан'
}

const formatDate = (date) => {
  if (!date) return 'Не указана'
  const d = new Date(date)
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const getReadyDate = () => {
  if (!props.order) return 'Не указана'
  if (props.order.type === 'sale') {
    return formatDate(props.order.created_at)
  }
  if (props.order.assembly_date) {
    return formatDate(props.order.assembly_date) + ' ' + (props.order.delivery_time || '')
  }
  if (props.order.delivery_date) {
    return formatDate(props.order.delivery_date) + ' ' + (props.order.delivery_time || '')
  }
  return 'Не указана'
}

const getStatusText = (status) => {
  const statuses = {
    new: 'Новый',
    assembly: 'В сборке',
    ready: 'Готов',
    completed: 'Завершен',
    cancelled: 'Отменен'
  }
  return statuses[status] || status
}

const getPaymentMethodText = (method) => {
  const methods = {
    cash: 'Наличные',
    card: 'Карта',
    qr: 'QR-код'
  }
  return methods[method] || 'Не указан'
}

const getItemName = (item) => {
  if (item.itemable) {
    return item.itemable.name
  }
  return 'Товар'
}

const getStatusActionText = () => {
  if (!props.order) return ''
  const status = props.order.status
  const actions = {
    new: 'В работу',
    assembly: 'Отправить в готовые',
    ready: 'Выдать заказ'
  }
  return actions[status] || 'Изменить статус'
}

// Получить класс кнопки действия
const getStatusActionClass = () => {
  if (!props.order) return ''
  const status = props.order.status
  const classes = {
    new: 'work-btn',
    assembly: 'assemble-btn',
    ready: 'complete-btn'
  }
  return classes[status] || 'default-btn'
}

const changeStatus = () => {
  if (!props.order) return

  let newStatus = ''
  switch (props.order.status) {
    case 'new':
      newStatus = 'assembly'
      break
    case 'assembly':
      newStatus = 'ready'
      break
    case 'ready':
      // ✅ Вместо простого изменения статуса - вызываем завершение со списанием
      emit('complete-order', props.order.id)
      return
    default:
      return
  }

  emit('status-change', props.order.id, newStatus)
}

// Получить имя сотрудника, который создал заказ
const getEmployeeName = () => {
  if (!props.order) return 'Не указан'

  // Если есть данные о сотруднике в заказе
  if (props.order.user) {
    const user = props.order.user
    const fullName = `${user.surname || ''} ${user.name || ''} ${user.patronymic || ''}`.trim()
    if (fullName) {
      return fullName
    }
    return user.email?.split('@')[0] || 'Сотрудник'
  }

  // Если есть только user_id, но данные не подгрузились
  if (props.order.user_id) {
    return `ID: ${props.order.user_id}`
  }

  return 'Не указан'
}

// Получить текст типа доставки
const getDeliveryTypeText = (type) => {
  const types = {
    'pickup': 'Самовывоз',
    'delivery': 'Доставка'
  }
  return types[type] || type || 'Не указан'
}

// Получить имя курьера
const getCourierName = () => {
  if (!props.order?.courier) return 'Не назначен'
  const courier = props.order.courier
  const fullName = `${courier.surname || ''} ${courier.name || ''} ${courier.patronymic || ''}`.trim()
  return fullName || courier.email?.split('@')[0] || 'Курьер'
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

.details-modal {
  max-width: 700px;
  width: 90%;
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
  font-size: 1.2rem;
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

/* Секции информации */
.info-section {
  margin-bottom: 1.5rem;
  border: 1px solid #f5f5f7;
  border-radius: 20px;
  overflow: hidden;
}

.section-title {
  background: #f9cffd30;
  padding: 0.7rem 1rem;
  font-weight: 700;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #f5f5f7;
  color: #2c3e2f;
}

.info-grid {
  padding: 1rem;
}

.info-row {
  display: flex;
  margin-bottom: 0.6rem;
  font-size: 0.85rem;
}

.info-label {
  width: 140px;
  font-weight: 600;
  color: #4a5b4e;
}

.info-value {
  flex: 1;
  color: #2c3e2f;
}

.info-value.total {
  font-size: 1rem;
  font-weight: 700;
  color: #2c3e2f;
}

/* Статус бейдж */
.status-badge {
  display: inline-block;
  padding: 0.2rem 0.7rem;
  border-radius: 30px;
  font-size: 0.7rem;
  font-weight: 600;
  background: #f5f5f7;
  color: #4a5b4e;
}

.status-badge.new {
  background: #f9cffd;
  color: #8b3a8b;
}

.status-badge.assembly {
  background: #d9eb61;
  color: #2c5e2c;
}

.status-badge.ready {
  background: #77b7d3;
  color: #1a3a4a;
}

.status-badge.completed {
  background: #fffded;
  color: #d4a500;

}

.status-badge.cancelled {
  background: #e85d4a;
  color: #ffffff;
}

/* Таблица товаров */
.items-table {
  width: 100%;
  border-collapse: collapse;
}

.items-table th,
.items-table td {
  padding: 0.7rem 1rem;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
  color: #2c3e2f;
  font-size: 0.85rem;
}

.items-table th {
  background: #f9f9fb;
  font-weight: 600;
  color: #4a5b4e;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.total-row {
  background: #f9f9fb;
}

.total-label {
  text-align: right;
  font-weight: 700;
  color: #2c3e2f;
}

.total-value {
  font-weight: 700;
  color: #2c3e2f;
  font-size: 1rem;
}

/* Кнопка действия статуса */
.action-status-btn {
  padding: 0.6rem 1.5rem;
  border: none;
  border-radius: 40px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
  font-family: 'Inter', sans-serif;
  transition: all 0.3s ease;
}

.action-status-btn.work-btn {
  background: #d9eb61;
  color: #2c3e2f;
  box-shadow: 0 2px 6px rgba(217, 235, 97, 0.3);
}

.action-status-btn.work-btn:hover {
  background: #c4db3a;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(217, 235, 97, 0.4);
}

.action-status-btn.assemble-btn {
  background: #f9cffd;
  color: #8b3a8b;
  box-shadow: 0 2px 6px rgba(249, 207, 253, 0.3);
}

.action-status-btn.assemble-btn:hover {
  background: #f0c4ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(249, 207, 253, 0.4);
}

.action-status-btn.complete-btn {
  background: #77b7d3;
  color: #1a3a4a;
  box-shadow: 0 2px 6px rgba(119, 183, 211, 0.3);
}

.action-status-btn.complete-btn:hover {
  background: #5a9ec0;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(119, 183, 211, 0.4);
}

.action-status-btn.default-btn {
  background: #f5f5f7;
  color: #4a5b4e;
}

.action-status-btn.default-btn:hover {
  background: #e8e8ec;
  transform: translateY(-2px);
}

/* Кнопка закрытия */
.close-modal-btn {
  padding: 0.6rem 1.5rem;
  background: #f5f5f7;
  border: none;
  border-radius: 40px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
  font-family: 'Inter', sans-serif;
  color: #4a5b4e;
  transition: all 0.3s ease;
}

.close-modal-btn:hover {
  background: #e8e8ec;
  transform: translateY(-1px);
}
</style>
