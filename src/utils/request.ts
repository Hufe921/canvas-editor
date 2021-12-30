import axios from 'axios'

const baseURL = 'https://hufe.club/yilitong-server'

export default async function request(url: string, data?: any) {
  try {
    const result = await axios.post(`${baseURL}${url}`, data)
    return result.data
  } catch (error) {
    alert('请求失败，请查看日志')
    throw error
  }
}