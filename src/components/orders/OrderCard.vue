<template>
  <div class="order-card">
    <div class="order-header">
      <span class="order-number">Заказ #{{ order.id }}</span>
    </div>
    <div class="order-client">{{ order.client_name || order.client?.name || 'Клиент не указан' }}</div>
    <div class="order-items">{{ getOrderItemsText() }}</div>
    <div class="order-time">{{ getTimeText() }}</div>
    <div class="order-actions">
      <button
        v-if="type === 'urgent'"
        @click="$emit('status-change', order.id, 'assembly')"
        class="action-btn"
      >
        В работу
      </button>
      <button
        v-if="type === 'assembly'"
        @click="$emit('status-change', order.id, 'ready')"
        class="action-btn"
      >
        Начать сборку
      </button>
      <button
        v-if="type === 'ready'"
        @click="$emit('complete-order', order.id)"
        class="action-btn complete-btn"
      >
        Выдан
      </button>
      <button
        v-if="type === 'assembly'"
        @click="$emit('status-change', order.id, 'ready')"
        class="action-btn assemble-btn"
      >
        Готово
      </button>
      <button
        @click="$emit('view-details', order)"
        class="action-btn details-btn"
      >
        Подробнее
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  order: Object,
  type: String // urgent, planned, assembly, ready, completed
})

const emit = defineEmits(['status-change', 'view-details'])

const getOrderItemsText = () => {
  if (!props.order.items || props.order.items.length === 0) {
    return 'Нет товаров'
  }
  return props.order.items.map(item => {
    const name = item.itemable?.name || 'Товар'
    const quantity = item.quantity
    return `${name} x${quantity}`
  }).join(', ')
}

const getTimeText = () => {
  if (props.order.delivery_date && props.order.delivery_time) {
    return `${props.order.delivery_date} ${props.order.delivery_time}`
  }
  if (props.order.delivery_date) {
    return props.order.delivery_date
  }
  if (props.order.assembly_date) {
    return `Сборка: ${props.order.assembly_date}`
  }
  return 'Дата не указана'
}
</script>

<style scoped>
.order-card {
  background: white;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.order-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.order-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.order-number {
  font-weight: bold;
  font-size: 14px;
  color: #000000;
}

.order-client {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 5px;
  color: #000000;
}

.order-items {
  font-size: 12px;
  color: #666666;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.order-time {
  font-size: 11px;
  color: #666666;
  margin-bottom: 10px;
}

.order-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-btn {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
  transition: all 0.3s;
  background-color: #e0e0e0;
  color: #000000;
}

.action-btn:hover {
  background-color: #cccccc;
  transform: scale(1.05);
}

.details-btn {
  background-color: #e0e0e0;
  color: #000000;
}

.details-btn:hover {
  background-color: #cccccc;
}

.complete-btn {
  background-color: #e0e0e0;
  color: white;
}

.complete-btn:hover {
  background-color: #e0e0e0;
}
</style>
