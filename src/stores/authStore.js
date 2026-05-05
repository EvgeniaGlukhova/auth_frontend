import { defineStore } from 'pinia'
import api from '../services/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('access_token') || null,
    isAuthenticated: !!localStorage.getItem('access_token'),
    loading: false,
    errorMessage: ''
  }),

  getters: {
    // Проверка ролей
    isAdministrator: (state) => state.user?.role === 'administrator',
    isFlorist: (state) => state.user?.role === 'florist',
    isSeller: (state) => state.user?.role === 'seller',
    isSellerFlorist: (state) => state.user?.role === 'seller - florist',

    // Полное имя
    fullName: (state) => {
      if (!state.user) return ''
      return `${state.user.surname || ''} ${state.user.name || ''} ${state.user.patronymic || ''}`.trim()
    }
  },

  actions: {
    async login(email, password) {
      this.loading = true
      this.errorMessage = ''

      try {
        const response = await api.post('/login', { email, password })

        if (response.data.success) {
          this.token = response.data.access_token
          this.user = response.data.user
          this.isAuthenticated = true

          localStorage.setItem('access_token', response.data.access_token)
          localStorage.setItem('user', JSON.stringify(response.data.user))

          return true
        }
        return false
      } catch (error) {
        console.error('Ошибка входа:', error)
        if (error.response?.data?.errors) {
          const errors = error.response.data.errors
          this.errorMessage = Object.values(errors).flat().join(', ')
        } else if (error.response?.data?.message) {
          this.errorMessage = error.response.data.message
        } else {
          this.errorMessage = 'Ошибка подключения к серверу'
        }
        return false
      } finally {
        this.loading = false
      }
    },

    async logout() {
      try {
        if (this.token) {
          await api.post('/logout')
        }
      } catch (error) {
        console.error('Ошибка при выходе:', error)
      } finally {
        this.token = null
        this.user = null
        this.isAuthenticated = false
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
      }
    },

    async fetchUser() {
      if (!this.token) return

      try {
        const response = await api.get('/me')
        if (response.data.success) {
          this.user = response.data.data
          localStorage.setItem('user', JSON.stringify(response.data.data))
        }
      } catch (error) {
        console.error('Ошибка загрузки пользователя:', error)
        if (error.response?.status === 401) {
          this.logout()
        }
      }
    },

    // Восстановление сессии при загрузке
    restoreSession() {
      const token = localStorage.getItem('access_token')
      const user = localStorage.getItem('user')

      if (token && user) {
        this.token = token
        this.user = JSON.parse(user)
        this.isAuthenticated = true
      }
    }
  }
})
