import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建 axios 实例
const request = axios.create({
    // ⭐ 注意：这里必须是你后端的端口号
    baseURL: 'http://localhost:9090', 
    timeout: 5000
})

// 1. 请求拦截器
request.interceptors.request.use(config => {
    config.headers['Content-Type'] = 'application/json;charset=utf-8';
    
    // 取出 token 带给后端
    const token = localStorage.getItem("token");
    if (token) {
        config.headers['token'] = token;
    }
    return config
}, error => {
    return Promise.reject(error)
})

// 2. 响应拦截器
request.interceptors.response.use(response => {
    let res = response.data;
    // 兼容服务端返回字符串
    if (typeof res === 'string') {
        res = res ? JSON.parse(res) : res
    }
    return res;
}, error => {
    console.log('err' + error)
    ElMessage.error(error.message || '网络连接异常')
    return Promise.reject(error)
})

export default request