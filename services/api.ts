import axios from "axios";

import { parseCookies, setCookie } from 'nookies'
import { AxiosError } from 'axios';
import { signOut } from "../contexts/AuthContext";

interface AxiosErrorResponse {
    code?: string;
}

let isRefreshing = false
let failRequestsQueue = []

let cookies = parseCookies() // executa somente a primeira vez

export const api = axios.create({

    baseURL: 'http://localhost:3333',
    headers: {
        Authorization: `Bearer ${cookies['nextauth.token']}`
    }

})

// interceptors: allows to intercept request and responses
// 1º parameter: success case function
// 2º parameter: fail case function
// it executes in each request/response

api.interceptors.response.use(
	response => {
		return response // sucess? Do nothing
	},
	(error: AxiosError<AxiosErrorResponse>) => {
		if (error.response.status === 401) {
			if (error.response.data?.code === 'token.expired') {
				// If token expire, renew refresh token.
				cookies = parseCookies()

				const { 'nextauth.refreshToken': refreshToken } = cookies;
				const originalConfig = error.config

				if (!isRefreshing) {
					isRefreshing = true

					api.post('/refresh', { refreshToken })
						.then(response => {
							const { token } = response.data //new token given by the response
							const newRefreshToken = response.data.refreshToken //new refresh token given by the response

							setCookie(undefined, 'nextauth.token', token, {
								maxAge: 60 * 60 * 24 * 7, // life time: 7 days
								path: '/'
							})
					
							setCookie(undefined, 'nextauth.refreshToken', newRefreshToken, {
								maxAge: 60 * 60 * 24 * 7, // life time: 7 days
								path: '/'
							})

							api.defaults.headers['Authorization'] = `Bearer ${token}`

							failRequestsQueue.forEach(request => request.onSuccess(token))
							failRequestsQueue = []

						})
                  .catch(err => {
							failRequestsQueue.forEach(request => request.onFailure(err))
							failRequestsQueue = []
							
						})
                  .finally(() => {
							isRefreshing = false
						})
				}

				return new Promise((resolve, reject) => {
					failRequestsQueue.push({
						onSuccess: (token: string) => {
							originalConfig.headers['Authorization'] = `Bearer ${token}`
							resolve(api(originalConfig)) //calls the API again
						},
						onFailure: (err: AxiosError) => {
							reject(err)
						}
					})
				})
			} else {
				// Other error? Sign out the user.
				signOut()
			}
		}   

		return Promise.reject(error)
	})