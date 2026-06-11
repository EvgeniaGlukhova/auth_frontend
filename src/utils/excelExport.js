import * as XLSX from 'xlsx'

// Форматирование даты
const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('ru-RU')
}

// Форматирование денег
const formatMoney = (value) => {
  return value?.toLocaleString('ru-RU') + ' ₽'
}

// Экспорт выручки
export const exportRevenue = (data, period) => {
  const wsData = [
    ['Отчет по выручке'],
    [`Период: ${period}`],
    [`Дата формирования: ${formatDate(new Date())}`],
    [],
    ['Показатель', 'Значение'],
    ['Выручка', formatMoney(data.revenue || 0)],
    ['Период', data.period || period],
    ['Дата начала', formatDate(data.start_date)],
  ]

  const ws = XLSX.utils.aoa_to_sheet(wsData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Выручка')
  XLSX.writeFile(wb, `выручка_${period}_${formatDate(new Date())}.xlsx`)
}

// Экспорт топ товаров
export const exportTopProducts = (flowers, bouquets, month) => {
  const wsData = [
    [`Топ товаров за ${month}`],
    [`Дата формирования: ${formatDate(new Date())}`],
    [],
    ['Цветы (топ 10)', 'Количество продаж'],
    ...flowers.map(f => [f.name || f.itemable?.name, f.total_quantity]),
    [],
    ['Букеты (топ 10)', 'Количество продаж'],
    ...bouquets.map(b => [b.name || b.itemable?.name, b.total_quantity]),
  ]

  const ws = XLSX.utils.aoa_to_sheet(wsData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Топ товаров')
  XLSX.writeFile(wb, `топ_товаров_${month}.xlsx`)
}


// Экспорт движения товаров
export const exportFlowerMovements = (movements, summary, period) => {
  const wsData = [
    [`Отчет по движению товаров за ${period}`],
    [`Дата формирования: ${formatDate(new Date())}`],
    [],
    ['Сводка', 'Количество (шт)'],
    ['Приход', summary.total_incoming || 0],
    ['Расход', summary.total_outgoing || 0],
    ['Потери', summary.total_loss || 0],
    [],
    ['Детализация движений'],
    ['Дата', 'Товар', 'Тип', 'Количество', 'Причина', 'Остаток до', 'Остаток после'],
    ...movements.map(m => [
      formatDate(m.created_at),
      m.movable?.name || '—',  // ← исправлено
      m.type === 'incoming' ? '📥 Приход' : m.type === 'outgoing' ? '📤 Расход' : '⚠️ Потери',
      m.quantity,
      m.reason || '—',
      m.quantity_before,
      m.quantity_after
    ])
  ]

  const ws = XLSX.utils.aoa_to_sheet(wsData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Движение товаров')
  XLSX.writeFile(wb, `движение_товаров_${period}.xlsx`)
}

// Экспорт сотрудников
export const exportEmployees = (employees) => {
  const wsData = [
    ['Список сотрудников'],
    [`Дата формирования: ${formatDate(new Date())}`],
    [],
    ['ID', 'ФИО', 'Должность', 'Телефон', 'Email'],
    ...employees.map(e => [
      e.id,
      `${e.surname || ''} ${e.name || ''} ${e.patronymic || ''}`.trim(),
      e.role?.name || getRoleName(e.role_id),
      e.phone || '—',
      e.email
    ])
  ]

  const ws = XLSX.utils.aoa_to_sheet(wsData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Сотрудники')
  XLSX.writeFile(wb, `сотрудники_${formatDate(new Date())}.xlsx`)
}

// Экспорт расписания смен
export const exportSchedule = (employees, schedules, month) => {
  const wsData = [
    [`Расписание смен на ${month}`],
    [`Дата формирования: ${formatDate(new Date())}`],
    [],
    ['Сотрудник', 'Дата', 'Смена'],
    ...schedules.map(s => [
      `${s.user?.surname || ''} ${s.user?.name || ''}`.trim(),
      formatDate(s.date),
      s.weekend ? 'Выходной' : `${s.start_time?.substring(0,5)}-${s.end_time?.substring(0,5)}`
    ])
  ]

  const ws = XLSX.utils.aoa_to_sheet(wsData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Расписание')
  XLSX.writeFile(wb, `расписание_${month}.xlsx`)
}

// ============= НОВАЯ ФУНКЦИЯ: ЭКСПОРТ ВСЕГО ОТЧЕТА =============
export const exportFullReport = (data) => {
  const workbook = XLSX.utils.book_new()
  const today = formatDate(new Date())

  const {
    period,
    monthName,
    revenue,
    clientsStat,
    ordersStat,
    topFlowers,
    topBouquets,
    movementsSummary,
    flowerMovements,
    employeeSales,
    employeeShifts
  } = data

  // 1. Лист "Выручка"
  const revenueData = [
    ['Отчет по выручке'],
    [`Период: ${period}`],
    [`Дата формирования: ${today}`],
    [],
    ['Показатель', 'Значение'],
    ['Выручка', formatMoney(revenue || 0)],
    ['Новых клиентов', clientsStat?.new_clients || 0],
    ['Всего клиентов', clientsStat?.total_clients || 0],
    ['Заказов выполнено', ordersStat?.completed_orders || 0],
  ]
  const revenueSheet = XLSX.utils.aoa_to_sheet(revenueData)
  XLSX.utils.book_append_sheet(workbook, revenueSheet, 'Выручка')

  // 2. Лист "Топ товаров"
  const topProductsData = [
    [`Топ товаров за ${monthName}`],
    [`Дата формирования: ${today}`],
    [],
    ['Цветы (топ 10)', 'Количество продаж'],
    ...(topFlowers || []).map(f => [f.name || f.itemable?.name || 'Цветок', f.total_quantity]),
    [],
    ['Букеты (топ 10)', 'Количество продаж'],
    ...(topBouquets || []).map(b => [b.name || b.itemable?.name || 'Букет', b.total_quantity]),
  ]
  const topProductsSheet = XLSX.utils.aoa_to_sheet(topProductsData)
  XLSX.utils.book_append_sheet(workbook, topProductsSheet, 'Топ товаров')

  // 3. Лист "Движение цветов"
  const movementsData = [
    [`Отчет по движению товаров за ${monthName}`],
    [`Дата формирования: ${today}`],
    [],
    ['Сводка', 'Количество (шт)'],
    ['Приход', movementsSummary?.total_incoming || 0],
    ['Расход', movementsSummary?.total_outgoing || 0],
    ['Потери', movementsSummary?.total_loss || 0],
    [],
    ['Детализация движений'],
    ['Дата', 'Товар', 'Тип', 'Количество', 'Причина', 'Остаток до', 'Остаток после'],
    ...(flowerMovements || []).map(m => [
      formatDate(m.created_at),
      m.movable?.name || '—',
      m.type === 'incoming' ? 'Приход' : m.type === 'outgoing' ? 'Расход' : 'Потери',
      m.quantity,
      m.reason || '—',
      m.quantity_before,
      m.quantity_after
    ])
  ]
  const movementsSheet = XLSX.utils.aoa_to_sheet(movementsData)
  XLSX.utils.book_append_sheet(workbook, movementsSheet, 'Движение цветов')

  // 4. Лист "Статусы заказов"
  const ordersStatusData = [
    ['Статусы заказов'],
    [`Период: ${period}`],
    [`Дата формирования: ${today}`],
    [],
    ['Статус', 'Количество'],
    ['Выполненные', ordersStat?.completed_orders || 0],
    ['Отмененные', ordersStat?.cancelled_orders || 0],
    ['Новые', ordersStat?.pending_orders || 0],
  ]
  const ordersStatusSheet = XLSX.utils.aoa_to_sheet(ordersStatusData)
  XLSX.utils.book_append_sheet(workbook, ordersStatusSheet, 'Статусы заказов')

  // 5. Лист "Продажи по сотрудникам"
  const employeeSalesData = [
    ['Продажи по сотрудникам'],
    [`Период: ${period}`],
    [`Дата формирования: ${today}`],
    [],
    ['Сотрудник', 'Сумма продаж (₽)'],
    ...(employeeSales || []).map(s => [
      s.user?.name || s.user_name || 'Сотрудник',
      formatMoney(s.total_sales)
    ])
  ]
  const employeeSalesSheet = XLSX.utils.aoa_to_sheet(employeeSalesData)
  XLSX.utils.book_append_sheet(workbook, employeeSalesSheet, 'Продажи по сотрудникам')

  // 6. Лист "Отработанные смены"
  const shiftsData = [
    ['Отработанные смены'],
    [`Период: ${period}`],
    [`Дата формирования: ${today}`],
    [],
    ['Сотрудник', 'Всего смен', 'Закрытых смен', 'Отработано часов'],
    ...(employeeShifts || []).map(s => [
      s.user_name || s.user?.name || 'Сотрудник',
      s.total_shifts,
      s.closed_shifts,
      s.total_hours
    ])
  ]
  const shiftsSheet = XLSX.utils.aoa_to_sheet(shiftsData)
  XLSX.utils.book_append_sheet(workbook, shiftsSheet, 'Отработанные смены')

  // Сохраняем файл
  XLSX.writeFile(workbook, `отчет_${period}_${today.replace(/\./g, '-')}.xlsx`)
}


// Универсальная функция для экспорта любых данных
export const exportToExcel = (data, sheetName, fileName) => {
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, `${fileName}_${formatDate(new Date())}.xlsx`)
}

// Получить название роли по ID
const getRoleName = (roleId) => {
  const roles = {
    1: 'Администратор',
    2: 'Флорист',
    3: 'Продавец',
    4: 'Продавец-флорист',
    5: 'Курьер'
  }
  return roles[roleId] || 'Сотрудник'
}
