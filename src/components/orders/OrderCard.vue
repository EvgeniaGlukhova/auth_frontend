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
<!--      <button-->
<!--        v-if="type === 'assembly'"-->
<!--        @click="$emit('status-change', order.id, 'ready')"-->
<!--        class="action-btn"-->
<!--      >-->
<!--        Начать сборку-->
<!--      </button>-->
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
        v-if="canGoBack"
        @click="$emit('go-back', order.id)"
        class="action-btn back-btn"
      >
        Вернуть
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
import { computed } from 'vue'

const props = defineProps({
  order: {
    type: Object,
    required: true
  },
  type: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['status-change', 'view-details', 'go-back', 'complete-order'])


const canGoBack = computed(() => ['assembly', 'ready', 'completed'].includes(props.type))

// доп функции
const formatDate = (date) => date?.split('T')[0] || ''
const formatTime = (time) => time?.substring(0, 5) || ''

const getOrderItemsText = () => {
  if (!props.order.items?.length) return 'Нет товаров'
  return props.order.items.map(item => `${item.itemable?.name || 'Товар'} x${item.quantity}`).join(', ')
}

const getTimeText = () => {
  if (props.order.delivery_date && props.order.delivery_time) {
    return `${formatDate(props.order.delivery_date)} ${formatTime(props.order.delivery_time)}`
  }
  if (props.order.delivery_date) return formatDate(props.order.delivery_date)
  if (props.order.assembly_date) return `Сборка: ${formatDate(props.order.assembly_date)}`
  return 'Дата не указана'
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700&display=swap');

.order-card {
  background: #ffffff;
  border-radius: 20px;
  padding: 1rem;
  margin-bottom: 0.8rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  border: 1px solid #f5f5f7;
  font-family: 'Inter', sans-serif;
}

.order-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(217, 235, 97, 0.2);
  border-color: #d9eb61;
}

.order-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.order-number {
  font-weight: 700;
  font-size: 0.85rem;
  color: #e07bc4;
  background: #f9cffd20;
  padding: 0.2rem 0.6rem;
  border-radius: 30px;
}

.order-client {
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.3rem;
  color: #000000;
}

.order-items {
  font-size: 0.7rem;
  color: #666666;
  margin-bottom: 0.5rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.order-time {
  font-size: 0.65rem;
  color: #999999;
  margin-bottom: 0.7rem;
}

.order-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.action-btn {
  padding: 0.3rem 0.8rem;
  border: none;
  border-radius: 30px;
  cursor: pointer;
  font-size: 0.7rem;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  transition: all 0.2s ease;
}

/* Кнопка В работу (для срочных заказов) */
.action-btn {
  background: #ffffff;
  color: #000000;
  border: 2px solid #d9eb61;
}

.action-btn:hover {
  background: #d9eb61;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(217, 235, 97, 0.3);
}

/* Кнопка Начать сборку / Готово */
.action-btn.assemble-btn {
  background: #ffffff;
  border: 2px solid #f9cffd;
  color: #8b3a8b;
}

.action-btn.assemble-btn:hover {
  background: #f9cffd;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(249, 207, 253, 0.3);
}

/* Кнопка Выдан */
.action-btn.complete-btn {
  background: #ffffff;
  border: 2px solid #77b7d3;
  color: #1a3a4a;
}

.action-btn.complete-btn:hover {
  background: #77b7d3;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(119, 183, 211, 0.3);
}

/* Кнопка Подробнее */
.action-btn.details-btn {
  background: #f5f5f7;
  border: none;
  color: #000000;
}

.action-btn.details-btn:hover {
  background: #e8e8ec;
  transform: translateY(-1px);
}

/* Для кнопок без специфичного класса */
.action-btn:not(.assemble-btn):not(.complete-btn):not(.details-btn) {
  background: #ffffff;
  border: 2px solid #d9eb61;
  color: #000000;
}

.action-btn:not(.assemble-btn):not(.complete-btn):not(.details-btn):hover {
  background: #d9eb61;
}

.back-btn {
  background: #ffffff;
  border: 2px solid #ff9800;
  color: #e65100;
}

.back-btn:hover {
  background: #ff9800;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(255, 152, 0, 0.3);
}

</style>
