import { defineStore } from 'pinia';
import api from '../services/api';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000/api';

export const useDataStore = defineStore('data', {
  state: () => ({
    // Цветы (компоненты)
    flowers: [],
    flowers_total: 0,

    // Букеты
    bouquets: [],
    bouquets_total: 0,

    materials: [],
    materials_total: 0,

    // Поставщики
    suppliers: [],
    suppliers_total: 0,

    // Элементы букетов (связь букетов с цветами)
    bouquetItems: [],

    // Клиенты
    clients: [],
    clients_total: 0,

    // Заказы
    orders: [],
    orders_total: 0,

    // Элементы заказов
    orderItems: [],
    orderItems_total: 0,

    // Пользователи (сотрудники)
    users: [],
    users_total: 0,

    // Рабочие смены
    workshifts: [],
    workshifts_total: 0,

    // Графики работы
    schedules: [],
    schedules_total: 0,


    // Общие
    loading: false,
    errorMessage: "",
    errorCode: "",
  }),

  actions: {
    // ==================== ЦВЕТЫ (КОМПОНЕНТЫ) ====================

    async get_flowers(search = '') {
      this.loading = true;
      this.errorMessage = "";
      try {
        const response = await api.get( '/flower');
        let flowers = Array.isArray(response.data) ? response.data : [];

        if (search && flowers.length) {
          flowers = flowers.filter(flower =>
            flower.name && flower.name.toLowerCase().includes(search.toLowerCase())
          );
        }

        this.flowers = flowers;
        this.flowers_total = flowers.length;
      } catch (error) {
        console.error('Ошибка загрузки цветов:', error);
        if (error.response) {
          this.errorMessage = error.response.data.message || "Ошибка загрузки цветов";
        } else if (error.request) {
          this.errorMessage = "Нет ответа от сервера";
        } else {
          this.errorMessage = error.message;
        }
        this.flowers = [];
        this.flowers_total = 0;
      } finally {
        this.loading = false;
      }
    },

    async create_flower(data) {
      this.errorMessage = "";
      try {
        const response = await api.post('/flower', data, {
          headers: {
            'Content-Type': 'application/json',
          }
        });
        if (response.data.success) {
          await this.get_flowers();
          return response.data;
        }
        return response.data;
      } catch (error) {
        if (error.response) {
          this.errorMessage = error.response.data.message || "Ошибка создания цветка";
          console.error(error);
        } else if (error.request) {
          this.errorMessage = "Нет ответа от сервера";
          console.error(error);
        } else {
          this.errorMessage = error.message;
          console.error(error);
        }
        throw error;
      }
    },

    async update_flower(id, data) {
      this.errorMessage = "";
      try {

        console.log('update_flower отправляем:', { id, data })  // ← для отладки

        const response = await api.put(`/flower/${id}`, data)

        if (response.data.success) {
          await this.get_flowers();
          return response.data;
        }
        return response.data;
      } catch (error) {
        if (error.response) {
          this.errorMessage = error.response.data.message || "Ошибка обновления цветка";
          console.error(error);
        } else if (error.request) {
          this.errorMessage = "Нет ответа от сервера";
          console.error(error);
        } else {
          this.errorMessage = error.message;
          console.error(error);
        }
        throw error;
      }
    },

    async incoming_flower(id, data) {
      this.errorMessage = "";
      this.loading = true;
      try {
        const response = await api.post(`/flower/${id}/incoming`, data)

        if (response.data.success) {
          await this.get_flowers();
          return response.data;
        }
        return response.data;
      } catch (error) {
        console.error('Ошибка поставки цветка:', error);
        this.errorMessage = error.response?.data?.message || "Ошибка поставки";
        throw error;
      } finally {
        this.loading = false;
      }
    },

// НОВЫЙ МЕТОД: Списание (расход)
    async outgoing_flower(id, data) {
      this.errorMessage = "";
      this.loading = true;
      try {
        const response = await api.post(`/flower/${id}/outgoing`, data)

        if (response.data.success) {
          await this.get_flowers();
          return response.data;
        }
        return response.data;
      } catch (error) {
        console.error('Ошибка списания цветка:', error);
        this.errorMessage = error.response?.data?.message || "Ошибка списания";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async delete_flower(id) {
      this.errorMessage = "";
      try {
        const response = await api.delete(`/flower/${id}`);
        if (response.data.success) {
          await this.get_flowers();
          return response.data;
        }
        return response.data;
      } catch (error) {
        if (error.response) {
          this.errorMessage = error.response.data.message || "Ошибка удаления цветка";
          console.error(error);
        } else if (error.request) {
          this.errorMessage = "Нет ответа от сервера";
          console.error(error);
        } else {
          this.errorMessage = error.message;
          console.error(error);
        }
        throw error;
      }
    },

    // ==================== БУКЕТЫ ====================

    async get_bouquets(search = '') {
      this.loading = true;
      this.errorMessage = "";
      try {
        const response = await api.get('/bouquet');
        let bouquets = (response.data && Array.isArray(response.data.data)) ? response.data.data : [];

        if (search && bouquets.length) {
          bouquets = bouquets.filter(bouquet =>
            bouquet.name && bouquet.name.toLowerCase().includes(search.toLowerCase())
          );
        }

        this.bouquets = bouquets;
        this.bouquets_total = bouquets.length;
      } catch (error) {
        console.error('Ошибка загрузки букетов:', error);
        if (error.response) {
          this.errorMessage = error.response.data.message || "Ошибка загрузки букетов";
        } else if (error.request) {
          this.errorMessage = "Нет ответа от сервера";
        } else {
          this.errorMessage = error.message;
        }
        this.bouquets = [];
        this.bouquets_total = 0;
      } finally {
        this.loading = false;
      }
    },

    async create_bouquet(data) {
      this.errorMessage = "";
      try {
        const response = await api.post('/bouquet', data, {
          headers: {
            'Content-Type': 'application/json',
          }
        });
        if (response.data.success) {
          await this.get_bouquets();
          return response.data;
        }
        return response.data;
      } catch (error) {
        if (error.response) {
          this.errorMessage = error.response.data.message || "Ошибка создания букета";
          console.error(error);
        } else if (error.request) {
          this.errorMessage = "Нет ответа от сервера";
          console.error(error);
        } else {
          this.errorMessage = error.message;
          console.error(error);
        }
        throw error;
      }
    },

    async update_bouquet(id, data) {
      this.errorMessage = "";
      try {
        const currentBouquet = this.bouquets.find(b => b.id === id)
        const oldQuantity = currentBouquet?.quantity || 0
        const newQuantity = data.quantity !== undefined ? data.quantity : oldQuantity

        const response = await api.put(`/bouquet/${id}`, data, {
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (response.data.success) {
          // Для букетов тоже можно записывать движения
          if (data.quantity !== undefined && data.quantity !== oldQuantity) {
            const diff = newQuantity - oldQuantity
            const type = diff > 0 ? 'incoming' : 'outgoing'

            await api.post('/bouquet-movements', {  // или отдельная таблица
              bouquet_id: id,
              type: type,
              quantity: Math.abs(diff),
              quantity_before: oldQuantity,
              quantity_after: newQuantity,
              reason: data.reason || (diff > 0 ? 'Поставка' : 'Расход'),
              user_id: JSON.parse(localStorage.getItem('user'))?.id
            });
          }

          await this.get_bouquets();
          return response.data;
        }
        return response.data;
      } catch (error) {
        if (error.response) {
          this.errorMessage = error.response.data.message || "Ошибка обновления букета";
          console.error(error);
        } else if (error.request) {
          this.errorMessage = "Нет ответа от сервера";
          console.error(error);
        } else {
          this.errorMessage = error.message;
          console.error(error);
        }
        throw error;
      }
    },

    async delete_bouquet(id) {
      this.errorMessage = "";
      try {
        const response = await api.delete(`/bouquet/${id}`);
        if (response.data.success) {
          await this.get_bouquets();
          return response.data;
        }
        return response.data;
      } catch (error) {
        if (error.response) {
          this.errorMessage = error.response.data.message || "Ошибка удаления букета";
          console.error(error);
        } else if (error.request) {
          this.errorMessage = "Нет ответа от сервера";
          console.error(error);
        } else {
          this.errorMessage = error.message;
          console.error(error);
        }
        throw error;
      }
    },

    // ==================== ПОСТАВЩИКИ ====================

    async get_suppliers(search = '') {
      this.loading = true;
      this.errorMessage = "";
      try {
        const response = await api.get( '/supplier');
        let suppliers = (response.data && Array.isArray(response.data.data)) ? response.data.data : [];

        if (search && suppliers.length) {
          suppliers = suppliers.filter(supplier =>
            (supplier.company_name && supplier.company_name.toLowerCase().includes(search.toLowerCase())) ||
            (supplier.responsible_person && supplier.responsible_person.toLowerCase().includes(search.toLowerCase()))
          );
        }

        this.suppliers = suppliers;
        this.suppliers_total = suppliers.length;
      } catch (error) {
        console.error('Ошибка загрузки поставщиков:', error);
        if (error.response) {
          this.errorMessage = error.response.data.message || "Ошибка загрузки поставщиков";
        } else if (error.request) {
          this.errorMessage = "Нет ответа от сервера";
        } else {
          this.errorMessage = error.message;
        }
        this.suppliers = [];
        this.suppliers_total = 0;
      } finally {
        this.loading = false;
      }
    },

    async create_supplier(data) {
      this.errorMessage = "";
      try {
        const response = await api.post('/supplier', data, {
          headers: {
            'Content-Type': 'application/json',
          }
        });
        if (response.data.success) {
          await this.get_suppliers();
          return response.data;
        }
        return response.data;
      } catch (error) {
        if (error.response) {
          this.errorMessage = error.response.data.message || "Ошибка создания поставщика";
          console.error(error);
        } else if (error.request) {
          this.errorMessage = "Нет ответа от сервера";
          console.error(error);
        } else {
          this.errorMessage = error.message;
          console.error(error);
        }
        throw error;
      }
    },

    async update_supplier(id, data) {
      this.errorMessage = "";
      try {
        const response = await api.put( `/supplier/${id}`, data, {
          headers: {
            'Content-Type': 'application/json',
          }
        });
        if (response.data.success) {
          await this.get_suppliers();
          return response.data;
        }
        return response.data;
      } catch (error) {
        if (error.response) {
          this.errorMessage = error.response.data.message || "Ошибка обновления поставщика";
          console.error(error);
        } else if (error.request) {
          this.errorMessage = "Нет ответа от сервера";
          console.error(error);
        } else {
          this.errorMessage = error.message;
          console.error(error);
        }
        throw error;
      }
    },

    async delete_supplier(id) {
      this.errorMessage = "";
      try {
        const response = await api.delete(`/supplier/${id}`);
        if (response.data.success) {
          await this.get_suppliers();
          return response.data;
        }
        return response.data;
      } catch (error) {
        if (error.response) {
          this.errorMessage = error.response.data.message || "Ошибка удаления поставщика";
          console.error(error);
        } else if (error.request) {
          this.errorMessage = "Нет ответа от сервера";
          console.error(error);
        } else {
          this.errorMessage = error.message;
          console.error(error);
        }
        throw error;
      }
    },

    // ==================== ЭЛЕМЕНТЫ БУКЕТОВ ====================

    /// ==================== ЭЛЕМЕНТЫ БУКЕТОВ (BOUQUET ITEMS) ====================

    async get_bouquet_items(bouquetId = null) {
      this.loading = true;
      this.errorMessage = "";
      try {
        let url = '/bouquet-item';
        if (bouquetId) {
          url += `?bouquet_id=${bouquetId}`;
        }
        const response = await api.get(url);

        let items = [];
        if (response.data.success) {
          items = response.data.data;
        } else if (Array.isArray(response.data)) {
          items = response.data;
        }

        this.bouquetItems = items;
        return items;
      } catch (error) {
        console.error('Ошибка загрузки состава букетов:', error);
        this.bouquetItems = [];
      } finally {
        this.loading = false;
      }
    },

    async create_bouquet_item(itemData) {
      this.errorMessage = "";
      this.loading = true;
      try {
        console.log('=== create_bouquet_item ===')
        console.log('Отправляемые данные:', itemData)

        const response = await api.post('/bouquet-item', itemData);

        console.log('Ответ сервера:', response.data)

        if (response.data.success) {
          await this.get_bouquet_items(itemData.bouquet_id);
          return response.data;
        }
        return response.data;
      } catch (error) {
        console.error('Ошибка добавления компонента в букет:', error);
        console.error('Детали ошибки:', error.response?.data)
        this.errorMessage = error.response?.data?.message || "Ошибка добавления компонента";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async update_bouquet_item(id, data) {
      this.errorMessage = "";
      this.loading = true;
      try {
        const response = await api.put(`/bouquet-item/${id}`, data);

        if (response.data.success) {
          await this.get_bouquet_items();
          return response.data;
        }
        return response.data;
      } catch (error) {
        console.error('Ошибка обновления состава букета:', error);
        this.errorMessage = error.response?.data?.message || "Ошибка обновления";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async delete_bouquet_item(id) {
      this.errorMessage = "";
      this.loading = true;
      try {
        const response = await api.delete(`/bouquet-item/${id}`);

        if (response.data.success) {
          await this.get_bouquet_items();
          return response.data;
        }
        return response.data;
      } catch (error) {
        console.error('Ошибка удаления компонента из букета:', error);
        this.errorMessage = error.response?.data?.message || "Ошибка удаления";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // ==================== КЛИЕНТЫ ====================

    async get_clients(search = '') {
      this.loading = true;
      this.errorMessage = "";

      console.log('=== get_clients ===')
      console.log('search параметр:', search)

      const url = `/client?search=${encodeURIComponent(search)}`
      console.log('URL запроса:', url)
      try {
        const response = await api.get('/client', {
          params: { search: search }
        });

        console.log('get_clients response:', response.data)

        // Важно! Правильно загружаем данные
        if (response.data.success) {
          this.clients = response.data.data
        } else if (Array.isArray(response.data)) {
          this.clients = response.data
        } else {
          this.clients = response.data.data || []
        }

        this.clients_total = this.clients.length
        console.log('Загружено клиентов:', this.clients.length)

      } catch (error) {
        console.error('Ошибка:', error)
        this.clients = []
      } finally {
        this.loading = false
      }
    },

    async create_client(data) {
      this.errorMessage = "";
      try {
        const response = await api.post( '/client', data, {
          headers: {
            'Content-Type': 'application/json',
          }
        });
        if (response.data.success) {
          await this.get_clients();
          return response.data;
        }
        return response.data;
      } catch (error) {
        if (error.response) {
          this.errorMessage = error.response.data.message || "Ошибка создания клиента";
          console.error(error);
        } else if (error.request) {
          this.errorMessage = "Нет ответа от сервера";
          console.error(error);
        } else {
          this.errorMessage = error.message;
          console.error(error);
        }
        throw error;
      }
    },

    async update_client(id, data) {
      this.errorMessage = "";
      try {
        const response = await api.put( `/client/${id}`, data, {
          headers: {
            'Content-Type': 'application/json',
          }
        });
        if (response.data.success) {
          await this.get_clients();
          return response.data;
        }
        return response.data;
      } catch (error) {
        if (error.response) {
          this.errorMessage = error.response.data.message || "Ошибка обновления клиента";
          console.error(error);
        } else if (error.request) {
          this.errorMessage = "Нет ответа от сервера";
          console.error(error);
        } else {
          this.errorMessage = error.message;
          console.error(error);
        }
        throw error;
      }
    },

    async delete_client(id) {
      this.errorMessage = "";
      try {
        const response = await api.delete( `/client/${id}`);
        if (response.data.success) {
          await this.get_clients();
          return response.data;
        }
        return response.data;
      } catch (error) {
        if (error.response) {
          this.errorMessage = error.response.data.message || "Ошибка удаления клиента";
          console.error(error);
        } else if (error.request) {
          this.errorMessage = "Нет ответа от сервера";
          console.error(error);
        } else {
          this.errorMessage = error.message;
          console.error(error);
        }
        throw error;
      }
    },

    // ==================== ЗАКАЗЫ (НОВЫЕ МЕТОДЫ) ====================

    async get_orders(search = '') {
      this.loading = true;
      this.errorMessage = "";
      try {
        const response = await api.get('/order');

        let orders = [];
        if (response.data.success) {
          orders = response.data.data;
        } else if (Array.isArray(response.data)) {
          orders = response.data;
        }

        // Фильтрация по поиску (по имени клиента, телефону, адресу)
        if (search && orders.length) {
          const searchLower = search.toLowerCase();
          orders = orders.filter(order =>
            (order.client_name && order.client_name.toLowerCase().includes(searchLower)) ||
            (order.client_phone && order.client_phone.includes(search)) ||
            (order.delivery_address && order.delivery_address.toLowerCase().includes(searchLower))
          );
        }

        this.orders = orders;
        this.orders_total = orders.length;
      } catch (error) {
        console.error('Ошибка загрузки заказов:', error);
        if (error.response) {
          this.errorMessage = error.response.data.message || "Ошибка загрузки заказов";
        } else if (error.request) {
          this.errorMessage = "Нет ответа от сервера";
        } else {
          this.errorMessage = error.message;
        }
        this.orders = [];
        this.orders_total = 0;
      } finally {
        this.loading = false;
      }
    },

    async get_order(id) {
      this.loading = true;
      this.errorMessage = "";
      try {
        const response = await api.get(`/order/${id}`);

        if (response.data.success) {
          return response.data.data;
        }
        return null;
      } catch (error) {
        console.error('Ошибка загрузки заказа:', error);
        if (error.response) {
          this.errorMessage = error.response.data.message || "Ошибка загрузки заказа";
        } else if (error.request) {
          this.errorMessage = "Нет ответа от сервера";
        } else {
          this.errorMessage = error.message;
        }
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async create_order(orderData) {
      this.errorMessage = "";
      this.loading = true;
      try {
        // Добавляем user_id текущего пользователя
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        const orderWithUser = {
          ...orderData,
          user_id: user.id || null
        }

        console.log('Отправляемые данные:', orderWithUser);

        const response = await api.post('/order', orderWithUser, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (response.data.success) {
          await this.get_orders();
          return response.data;
        }
        return response.data;
      } catch (error) {
        console.error('Ошибка создания заказа:', error);
        if (error.response) {
          console.error('Статус:', error.response.status);
          console.error('Данные ошибки:', error.response.data);

          if (error.response.status === 422) {
            const errors = error.response.data.errors;
            console.log('=== ПОЛНАЯ ОШИБКА ВАЛИДАЦИИ ===')
            console.log(JSON.stringify(errors, null, 2))
            let errorMessage = 'Ошибка валидации:\n';
            if (errors) {
              for (let field in errors) {
                errorMessage += `${field}: ${errors[field].join(', ')}\n`;
              }
            }
            alert(errorMessage)
          }else {
            this.errorMessage = error.response.data.message || "Ошибка создания заказа";
            alert(this.errorMessage);
          }
        } else if (error.request) {
          this.errorMessage = "Нет ответа от сервера";
          console.error(error);
        } else {
          this.errorMessage = error.message;
          console.error(error);
        }
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async update_order(id, data) {
      this.errorMessage = "";
      try {
        const response = await api.put(`/order/${id}`, data, {
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (response.data.success) {
          await this.get_orders();
          return response.data;
        }
        return response.data;
      } catch (error) {
        if (error.response) {
          this.errorMessage = error.response.data.message || "Ошибка обновления заказа";
          console.error(error);
        } else if (error.request) {
          this.errorMessage = "Нет ответа от сервера";
          console.error(error);
        } else {
          this.errorMessage = error.message;
          console.error(error);
        }
        throw error;
      }
    },

    async delete_order(id) {
      this.errorMessage = "";
      try {
        const response = await api.delete(`/order/${id}`);

        if (response.data.success) {
          await this.get_orders();
          return response.data;
        }
        return response.data;
      } catch (error) {
        if (error.response) {
          this.errorMessage = error.response.data.message || "Ошибка удаления заказа";
          console.error(error);
        } else if (error.request) {
          this.errorMessage = "Нет ответа от сервера";
          console.error(error);
        } else {
          this.errorMessage = error.message;
          console.error(error);
        }
        throw error;
      }
    },

    async update_order_status(id, status) {
      return await this.update_order(id, { status });
    },

    // ==================== ЭЛЕМЕНТЫ ЗАКАЗОВ ====================

    async get_order_items(orderId = null) {
      this.loading = true;
      this.errorMessage = "";
      try {
        let url = '/order-items';
        if (orderId) {
          url += `?order_id=${orderId}`;
        }

        const response = await api.get(url);

        let items = [];
        if (response.data.success) {
          items = response.data.data;
        } else if (Array.isArray(response.data)) {
          items = response.data;
        }

        this.orderItems = items;
        this.orderItems_total = items.length;
        return items;
      } catch (error) {
        console.error('Ошибка загрузки элементов заказов:', error);
        if (error.response) {
          this.errorMessage = error.response.data.message || "Ошибка загрузки элементов заказов";
        } else if (error.request) {
          this.errorMessage = "Нет ответа от сервера";
        } else {
          this.errorMessage = error.message;
        }
        this.orderItems = [];
        this.orderItems_total = 0;
      } finally {
        this.loading = false;
      }
    },

    async create_order_item(data) {
      this.errorMessage = "";
      try {
        const response = await api.post( '/order-items', data, {
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (response.data.success) {
          await this.get_order_items(data.order_id);
          return response.data;
        }
        return response.data;
      } catch (error) {
        if (error.response) {
          this.errorMessage = error.response.data.message || "Ошибка создания элемента заказа";
          console.error(error);
        } else if (error.request) {
          this.errorMessage = "Нет ответа от сервера";
          console.error(error);
        } else {
          this.errorMessage = error.message;
          console.error(error);
        }
        throw error;
      }
    },

    async delete_order_item(id, orderId) {
      this.errorMessage = "";
      try {
        const response = await api.delete(`/order-items/${id}`);

        if (response.data.success) {
          if (orderId) {
            await this.get_order_items(orderId);
          } else {
            await this.get_order_items();
          }
          return response.data;
        }
        return response.data;
      } catch (error) {
        if (error.response) {
          this.errorMessage = error.response.data.message || "Ошибка удаления элемента заказа";
          console.error(error);
        } else if (error.request) {
          this.errorMessage = "Нет ответа от сервера";
          console.error(error);
        } else {
          this.errorMessage = error.message;
          console.error(error);
        }
        throw error;
      }
    },

    async complete_order(id) {
      this.errorMessage = "";
      try {
        const response = await api.post(`/order/${id}/complete`);

        if (response.data.success) {
          await this.get_orders();
          return response.data;
        }
        return response.data;
      } catch (error) {
        console.error('Ошибка завершения заказа:', error);
        this.errorMessage = error.response?.data?.message || "Ошибка";
        throw error;
      }
    },



    // ==================== ПОЛЬЗОВАТЕЛИ (СОТРУДНИКИ) ====================

    async get_users(search = '') {
      this.loading = true;
      this.errorMessage = "";
      try {
        const response = await api.get('/user', {
          params: { search }
        });

        let users = [];
        if (response.data.success) {
          users = response.data.data;
        } else if (Array.isArray(response.data)) {
          users = response.data;
        } else if (response.data && Array.isArray(response.data.users)) {
          users = response.data.users;
        } else {
          users = [];
        }

        console.log('users после обработки:', users);
        console.log('users length:', users.length);

        this.users = users;
        this.users_total = users.length;
      } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
        this.errorMessage = error.response?.data?.message || "Ошибка загрузки пользователей";
        this.users = [];
        this.users_total = 0;
      } finally {
        this.loading = false;
      }
    },

    async get_user(id) {
      this.loading = true;
      this.errorMessage = "";
      try {
        const response = await api.get(`/user/${id}`);

        if (response.data.success) {
          return response.data.data;
        }
        return null;
      } catch (error) {
        console.error('Ошибка загрузки пользователя:', error);
        if (error.response?.status === 404) {
          this.errorMessage = "Сотрудник не найден";
        } else {
          this.errorMessage = error.response?.data?.message || "Ошибка загрузки пользователя";
        }
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async create_user(data) {
      this.errorMessage = "";
      this.loading = true;
      try {
        const response = await api.post( '/user', data, {
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (response.data.success) {
          await this.get_users();
          return response.data;
        }
        return response.data;
      } catch (error) {
        if (error.response) {
          // Обработка ошибки 403 (доступ запрещен)
          if (error.response.status === 403) {
            this.errorMessage = error.response.data.message || "У вас нет прав для добавления сотрудников";
          }
          // Обработка ошибки 422 (валидация)
          else if (error.response.status === 422) {
            const errors = error.response.data.errors;
            if (errors) {
              // Собираем все сообщения об ошибках валидации
              const errorMessages = Object.values(errors).flat();
              this.errorMessage = errorMessages.join(', ');
            } else {
              this.errorMessage = error.response.data.message || "Ошибка валидации данных";
            }
          }
          else {
            this.errorMessage = error.response.data.message || "Ошибка создания пользователя";
          }
          console.error('Ошибка создания пользователя:', error.response.data);
        } else if (error.request) {
          this.errorMessage = "Нет ответа от сервера";
          console.error(error);
        } else {
          this.errorMessage = error.message;
          console.error(error);
        }
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async update_user(id, data) {
      this.errorMessage = "";
      this.loading = true;
      try {
        const response = await api.put( `/user/${id}`, data, {
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (response.data.success) {
          await this.get_users();
          return response.data;
        }
        return response.data;
      } catch (error) {
        if (error.response) {
          // Обработка ошибки 403 (доступ запрещен)
          if (error.response.status === 403) {
            this.errorMessage = error.response.data.message || "У вас нет прав для редактирования сотрудников";
          }
          // Обработка ошибки 422 (валидация)
          else if (error.response.status === 422) {
            const errors = error.response.data.errors;
            if (errors) {
              const errorMessages = Object.values(errors).flat();
              this.errorMessage = errorMessages.join(', ');
            } else {
              this.errorMessage = error.response.data.message || "Ошибка валидации данных";
            }
          }
          else if (error.response.status === 404) {
            this.errorMessage = "Сотрудник не найден";
          }
          else {
            this.errorMessage = error.response.data.message || "Ошибка обновления пользователя";
          }
          console.error('Ошибка обновления пользователя:', error.response.data);
        } else if (error.request) {
          this.errorMessage = "Нет ответа от сервера";
          console.error(error);
        } else {
          this.errorMessage = error.message;
          console.error(error);
        }
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async delete_user(id) {
      this.errorMessage = "";
      this.loading = true;
      try {
        const response = await api.delete( `/user/${id}`);

        if (response.data.success) {
          await this.get_users();
          return response.data;
        }
        return response.data;
      } catch (error) {
        if (error.response) {
          // Обработка ошибки 403 (доступ запрещен)
          if (error.response.status === 403) {
            this.errorMessage = error.response.data.message || "У вас нет прав для удаления сотрудников";
          }
          else if (error.response.status === 404) {
            this.errorMessage = "Сотрудник не найден";
          }
          else {
            this.errorMessage = error.response.data.message || "Ошибка удаления пользователя";
          }
          console.error('Ошибка удаления пользователя:', error.response.data);
        } else if (error.request) {
          this.errorMessage = "Нет ответа от сервера";
          console.error(error);
        } else {
          this.errorMessage = error.message;
          console.error(error);
        }
        throw error;
      } finally {
        this.loading = false;
      }
    },

// ==================== РАБОЧИЕ СМЕНЫ ====================

    async get_workshifts(search = '') {
      this.loading = true;
      this.errorMessage = "";
      try {
        const response = await api.get('/workshift');

        let workshifts = [];
        if (response.data.success) {
          workshifts = response.data.data;
        } else if (Array.isArray(response.data)) {
          workshifts = response.data;
        } else if (response.data && Array.isArray(response.data.workshifts)) {
          workshifts = response.data.workshifts;
        } else {
          workshifts = [];
        }

        console.log('workshifts после обработки:', workshifts);
        console.log('workshifts length:', workshifts.length);

        // Фильтрация по поиску (по дате, имени сотрудника)
        if (search && workshifts.length) {
          const searchLower = search.toLowerCase();
          workshifts = workshifts.filter(shift =>
            (shift.date && shift.date.includes(search)) ||
            (shift.user && (shift.user.name && shift.user.name.toLowerCase().includes(searchLower)) ||
              (shift.user && shift.user.surname && shift.user.surname.toLowerCase().includes(searchLower)))
          );
        }

        this.workshifts = workshifts;
        this.workshifts_total = workshifts.length;
      } catch (error) {
        console.error('Ошибка загрузки рабочих смен:', error);
        if (error.response) {
          // Обработка ошибки 403 (доступ запрещен)
          if (error.response.status === 403) {
            this.errorMessage = error.response.data.message || "У вас нет прав для просмотра рабочих смен";
            this.workshifts = [];
            this.workshifts_total = 0;
          } else {
            this.errorMessage = error.response.data.message || "Ошибка загрузки рабочих смен";
          }
        } else if (error.request) {
          this.errorMessage = "Нет ответа от сервера";
        } else {
          this.errorMessage = error.message;
        }
        this.workshifts = [];
        this.workshifts_total = 0;
      } finally {
        this.loading = false;
      }
    },

    async get_workshift(id) {
      this.loading = true;
      this.errorMessage = "";
      try {
        const response = await api.get( `/workshift/${id}`);

        if (response.data.success) {
          return response.data.data;
        }
        return null;
      } catch (error) {
        console.error('Ошибка загрузки рабочей смены:', error);
        if (error.response) {
          if (error.response.status === 403) {
            this.errorMessage = error.response.data.message || "У вас нет прав для просмотра рабочей смены";
          } else if (error.response.status === 404) {
            this.errorMessage = "Рабочая смена не найдена";
          } else {
            this.errorMessage = error.response.data.message || "Ошибка загрузки рабочей смены";
          }
        } else if (error.request) {
          this.errorMessage = "Нет ответа от сервера";
        } else {
          this.errorMessage = error.message;
        }
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async create_workshift(data) {
      this.errorMessage = "";
      this.loading = true;
      try {
        const response = await api.post( '/workshift', data, {
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (response.data.success) {
          await this.get_workshifts();
          return response.data;
        }
        return response.data;
      } catch (error) {
        if (error.response) {
          // Обработка ошибки 403 (доступ запрещен)
          if (error.response.status === 403) {
            this.errorMessage = error.response.data.message || "У вас нет прав для создания рабочих смен";
          }
          // Обработка ошибки 422 (валидация)
          else if (error.response.status === 422) {
            const errors = error.response.data.errors;
            if (errors) {
              // Собираем все сообщения об ошибках валидации
              const errorMessages = Object.values(errors).flat();
              this.errorMessage = errorMessages.join(', ');
            } else {
              this.errorMessage = error.response.data.message || "Ошибка валидации данных";
            }
          }
          else {
            this.errorMessage = error.response.data.message || "Ошибка создания рабочей смены";
          }
          console.error('Ошибка создания рабочей смены:', error.response.data);
        } else if (error.request) {
          this.errorMessage = "Нет ответа от сервера";
          console.error(error);
        } else {
          this.errorMessage = error.message;
          console.error(error);
        }
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async update_workshift(id, data) {
      this.errorMessage = "";
      this.loading = true;
      try {
        const response = await api.put(`/workshift/${id}`, data, {
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (response.data.success) {
          await this.get_workshifts();
          return response.data;
        }
        return response.data;
      } catch (error) {
        if (error.response) {
          // Обработка ошибки 403 (доступ запрещен)
          if (error.response.status === 403) {
            this.errorMessage = error.response.data.message || "У вас нет прав для редактирования рабочих смен";
          }
          // Обработка ошибки 422 (валидация)
          else if (error.response.status === 422) {
            const errors = error.response.data.errors;
            if (errors) {
              const errorMessages = Object.values(errors).flat();
              this.errorMessage = errorMessages.join(', ');
            } else {
              this.errorMessage = error.response.data.message || "Ошибка валидации данных";
            }
          }
          else if (error.response.status === 404) {
            this.errorMessage = "Рабочая смена не найдена";
          }
          else {
            this.errorMessage = error.response.data.message || "Ошибка обновления рабочей смены";
          }
          console.error('Ошибка обновления рабочей смены:', error.response.data);
        } else if (error.request) {
          this.errorMessage = "Нет ответа от сервера";
          console.error(error);
        } else {
          this.errorMessage = error.message;
          console.error(error);
        }
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async delete_workshift(id) {
      this.errorMessage = "";
      this.loading = true;
      try {
        const response = await api.delete( `/workshift/${id}`);

        if (response.data.success) {
          await this.get_workshifts();
          return response.data;
        }
        return response.data;
      } catch (error) {
        if (error.response) {
          // Обработка ошибки 403 (доступ запрещен)
          if (error.response.status === 403) {
            this.errorMessage = error.response.data.message || "У вас нет прав для удаления рабочих смен";
          }
          else if (error.response.status === 404) {
            this.errorMessage = "Рабочая смена не найдена";
          }
          else {
            this.errorMessage = error.response.data.message || "Ошибка удаления рабочей смены";
          }
          console.error('Ошибка удаления рабочей смены:', error.response.data);
        } else if (error.request) {
          this.errorMessage = "Нет ответа от сервера";
          console.error(error);
        } else {
          this.errorMessage = error.message;
          console.error(error);
        }
        throw error;
      } finally {
        this.loading = false;
      }
    },

// ==================== ГРАФИКИ РАБОТЫ ====================

    async get_schedules(search = '') {
      this.loading = true;
      this.errorMessage = "";
      try {
        const response = await api.get( '/schedule');

        let schedules = [];
        if (response.data.success) {
          schedules = response.data.data;
        } else if (Array.isArray(response.data)) {
          schedules = response.data;
        } else if (response.data && Array.isArray(response.data.schedules)) {
          schedules = response.data.schedules;
        } else {
          schedules = [];
        }

        console.log('schedules после обработки:', schedules);
        console.log('schedules length:', schedules.length);

        // Фильтрация по поиску
        if (search && schedules.length) {
          const searchLower = search.toLowerCase();
          schedules = schedules.filter(schedule =>
            (schedule.date && schedule.date.includes(search)) ||
            (schedule.user && schedule.user.name && schedule.user.name.toLowerCase().includes(searchLower))
          );
        }

        this.schedules = schedules;
        this.schedules_total = schedules.length;
      } catch (error) {
        console.error('Ошибка загрузки графиков:', error);
        if (error.response) {
          // Обработка ошибки 403 (доступ запрещен)
          if (error.response.status === 403) {
            this.errorMessage = error.response.data.message || "У вас нет прав для просмотра графиков";
            this.schedules = [];
            this.schedules_total = 0;
          } else {
            this.errorMessage = error.response.data.message || "Ошибка загрузки графиков";
          }
        } else if (error.request) {
          this.errorMessage = "Нет ответа от сервера";
        } else {
          this.errorMessage = error.message;
        }
        this.schedules = [];
        this.schedules_total = 0;
      } finally {
        this.loading = false;
      }
    },

    async get_schedule(id) {
      this.loading = true;
      this.errorMessage = "";
      try {
        const response = await api.get( `/schedule/${id}`);

        if (response.data.success) {
          return response.data.data;
        }
        return null;
      } catch (error) {
        console.error('Ошибка загрузки графика:', error);
        if (error.response) {
          if (error.response.status === 403) {
            this.errorMessage = error.response.data.message || "У вас нет прав для просмотра графика";
          } else if (error.response.status === 404) {
            this.errorMessage = "График не найден";
          } else {
            this.errorMessage = error.response.data.message || "Ошибка загрузки графика";
          }
        } else if (error.request) {
          this.errorMessage = "Нет ответа от сервера";
        } else {
          this.errorMessage = error.message;
        }
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async create_schedule(data) {
      this.errorMessage = "";
      this.loading = true;
      try {
        const response = await api.post( '/schedule', data, {
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (response.data.success) {
          await this.get_schedules();
          return response.data;
        }
        return response.data;
      } catch (error) {
        if (error.response) {
          // Обработка ошибки 403 (доступ запрещен)
          if (error.response.status === 403) {
            this.errorMessage = error.response.data.message || "У вас нет прав для создания графиков";
          }
          // Обработка ошибки 422 (валидация)
          else if (error.response.status === 422) {
            const errors = error.response.data.errors;
            if (errors) {
              // Собираем все сообщения об ошибках валидации
              const errorMessages = Object.values(errors).flat();
              this.errorMessage = errorMessages.join(', ');
            } else {
              this.errorMessage = error.response.data.message || "Ошибка валидации данных";
            }
          }
          else {
            this.errorMessage = error.response.data.message || "Ошибка создания графика";
          }
          console.error('Ошибка создания графика:', error.response.data);
        } else if (error.request) {
          this.errorMessage = "Нет ответа от сервера";
          console.error(error);
        } else {
          this.errorMessage = error.message;
          console.error(error);
        }
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async update_schedule(id, data) {
      this.errorMessage = "";
      this.loading = true;
      try {
        const response = await api.put( `/schedule/${id}`, data, {
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (response.data.success) {
          await this.get_schedules();
          return response.data;
        }
        return response.data;
      } catch (error) {
        if (error.response) {
          // Обработка ошибки 403 (доступ запрещен)
          if (error.response.status === 403) {
            this.errorMessage = error.response.data.message || "У вас нет прав для изменения графиков";
          }
          // Обработка ошибки 422 (валидация)
          else if (error.response.status === 422) {
            const errors = error.response.data.errors;
            if (errors) {
              const errorMessages = Object.values(errors).flat();
              this.errorMessage = errorMessages.join(', ');
            } else {
              this.errorMessage = error.response.data.message || "Ошибка валидации данных";
            }
          }
          else if (error.response.status === 404) {
            this.errorMessage = "График не найден";
          }
          else {
            this.errorMessage = error.response.data.message || "Ошибка обновления графика";
          }
          console.error('Ошибка обновления графика:', error.response.data);
        } else if (error.request) {
          this.errorMessage = "Нет ответа от сервера";
          console.error(error);
        } else {
          this.errorMessage = error.message;
          console.error(error);
        }
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async delete_schedule(id) {
      this.errorMessage = "";
      this.loading = true;
      try {
        const response = await api.delete( `/schedule/${id}`);

        if (response.data.success) {
          await this.get_schedules();
          return response.data;
        }
        return response.data;
      } catch (error) {
        if (error.response) {
          // Обработка ошибки 403 (доступ запрещен)
          if (error.response.status === 403) {
            this.errorMessage = error.response.data.message || "У вас нет прав для удаления графиков";
          }
          else if (error.response.status === 404) {
            this.errorMessage = "График не найден";
          }
          else {
            this.errorMessage = error.response.data.message || "Ошибка удаления графика";
          }
          console.error('Ошибка удаления графика:', error.response.data);
        } else if (error.request) {
          this.errorMessage = "Нет ответа от сервера";
          console.error(error);
        } else {
          this.errorMessage = error.message;
          console.error(error);
        }
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // ==================== МАТЕРИАЛЫ ====================

    async get_materials(search = '') {
      this.loading = true;
      this.errorMessage = "";
      try {
        const response = await api.get('/material');

        let materials = [];
        if (response.data.success) {
          materials = response.data.data;
        } else if (Array.isArray(response.data)) {
          materials = response.data;
        } else {
          materials = [];
        }

        if (search && materials.length) {
          materials = materials.filter(material =>
            material.name && material.name.toLowerCase().includes(search.toLowerCase())
          );
        }

        this.materials = materials;
        this.materials_total = materials.length;
      } catch (error) {
        console.error('Ошибка загрузки материалов:', error);
        this.materials = [];
        this.materials_total = 0;
      } finally {
        this.loading = false;
      }
    },

    async create_material(data) {
      this.errorMessage = "";
      this.loading = true;
      try {
        const response = await api.post('/material', data);

        if (response.data.success) {
          await this.get_materials();
          return response.data;
        }
        return response.data;
      } catch (error) {
        console.error('Ошибка создания материала:', error);
        this.errorMessage = error.response?.data?.message || "Ошибка создания материала";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async update_material(id, data) {
      this.errorMessage = "";
      this.loading = true;
      try {
        const response = await api.put(`/material/${id}`, data);

        if (response.data.success) {
          await this.get_materials();
          return response.data;
        }
        return response.data;
      } catch (error) {
        console.error('Ошибка обновления материала:', error);
        this.errorMessage = error.response?.data?.message || "Ошибка обновления материала";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async delete_material(id) {
      this.errorMessage = "";
      this.loading = true;
      try {
        const response = await api.delete(`/material/${id}`);

        if (response.data.success) {
          await this.get_materials();
          return response.data;
        }
        return response.data;
      } catch (error) {
        console.error('Ошибка удаления материала:', error);
        this.errorMessage = error.response?.data?.message || "Ошибка удаления материала";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async incoming_material(id, data) {
      this.errorMessage = "";
      this.loading = true;
      try {
        const response = await api.post(`/material/${id}/incoming`, data);

        if (response.data.success) {
          await this.get_materials();
          return response.data;
        }
        return response.data;
      } catch (error) {
        console.error('Ошибка прихода материала:', error);
        this.errorMessage = error.response?.data?.message || "Ошибка прихода материала";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async outgoing_material(id, data) {
      this.errorMessage = "";
      this.loading = true;
      try {
        const response = await api.post(`/material/${id}/outgoing`, data);

        if (response.data.success) {
          await this.get_materials();
          return response.data;
        }
        return response.data;
      } catch (error) {
        console.error('Ошибка расхода материала:', error);
        this.errorMessage = error.response?.data?.message || "Ошибка расхода материала";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async create_flower_movement(data) {
      try {
        const response = await api.post('/flower-movements', data)
        return response.data
      } catch (error) {
        console.error('Ошибка записи движения:', error)
      }
    },


  },

  getters: {
    getFlowersForTable: (state) => {
      return Array.isArray(state.flowers) ? state.flowers : [];
    },

    getBouquetsForTable: (state) => {
      return Array.isArray(state.bouquets) ? state.bouquets : [];
    },


    // Заказы по статусу
    getOrdersByStatus: (state) => (status) => {
      return state.orders.filter(order => order.status === status);
    },

    // Заказы по типу
    getOrdersByType: (state) => (type) => {
      return state.orders.filter(order => order.type === type);
    },

    // Активные заказы (не завершенные и не отмененные)
    getActiveOrders: (state) => {
      return state.orders.filter(order =>
        order.status !== 'completed' && order.status !== 'cancelled'
      );
    },

    // Заказы клиента
    getOrdersByClient: (state) => (clientId) => {
      return state.orders.filter(order => order.client_id === clientId);
    },

    // Общая сумма всех заказов
    getTotalOrdersAmount: (state) => {
      return state.orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
    },

    // Пользователи по роли
    getUsersByRole: (state) => (roleId) => {
      return state.users.filter(user => user.role_id === roleId);
    },

    // Активные сотрудники
    getActiveUsers: (state) => {
      return state.users.filter(user => user.active !== false);
    },

    // Смены за сегодня
    getTodaysWorkshifts: (state) => {
      const today = new Date().toISOString().split('T')[0];
      return state.workshifts.filter(shift => shift.date === today && !shift.closed);
    },

    // Графики на неделю
    getSchedulesForDate: (state) => (date) => {
      return state.schedules.filter(schedule => schedule.date === date);
    },

    // Количество заказов по статусам
    getOrdersCountByStatus: (state) => {
      const counts = {
        new: 0,
        assembly: 0,
        ready: 0,
        completed: 0,
        cancelled: 0
      };
      state.orders.forEach(order => {
        if (counts[order.status] !== undefined) {
          counts[order.status]++;
        }
      });
      return counts;
    },
  }
});
