<template>
  <div v-if="show" class="modal-overlay" @click="close">
    <div class="modal-content details-modal" @click.stop>
      <div class="modal-header">
        <h3>Заказ #{{ order?.id }} - {{ getClientName() }}</h3>
        <button class="close-btn" @click="close">X</button>
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
              <span class="info-label">Сотрудник:</span>
              <span class="info-value">{{ getEmployeeName() }}</span>
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

.details-modal {
  max-width: 700px;
  width: 90%;
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

.info-section {
  margin-bottom: 25px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.section-title {
  background: #f0f0f0;
  padding: 10px 15px;
  font-weight: bold;
  font-size: 14px;
  border-bottom: 1px solid #e0e0e0;
  color: #000000;
}

.info-grid {
  padding: 15px;
}

.info-row {
  display: flex;
  margin-bottom: 10px;
  font-size: 14px;
}

.info-label {
  width: 140px;
  font-weight: bold;
  color: #666666;
}

.info-value {
  flex: 1;
  color: #000000;
}

.info-value.total {
  font-size: 16px;
  font-weight: bold;
  color: #000000;
}

.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #000000;
}

.status-badge.new,
.status-badge.assembly,
.status-badge.ready,
.status-badge.completed,
.status-badge.cancelled {
  background: #e0e0e0;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
}

.items-table th,
.items-table td {
  padding: 10px 15px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
  color: #000000;
}

.items-table th {
  background: #f0f0f0;
  font-weight: bold;
  font-size: 13px;
  color: #000000;
}

.total-row {
  background: #f0f0f0;
}

.total-label {
  text-align: right;
  font-weight: bold;
  color: #000000;
}

.total-value {
  font-weight: bold;
  color: #000000;
  font-size: 16px;
}

.action-status-btn {
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
  background-color: #e0e0e0;
  color: #000000;
}

.action-status-btn:hover {
  background-color: #cccccc;
  transform: scale(1.05);
}

.close-modal-btn {
  padding: 8px 20px;
  background-color: #e0e0e0;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #000000;
}

.close-modal-btn:hover {
  background-color: #cccccc;
}



</style>
