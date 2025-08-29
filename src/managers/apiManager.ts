import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';
import { McpServer, ApiResponse, ApiRequest } from '../types/mcpServer';

export class ApiManager {
    private readonly timeout = 30000; // 30 seconds

    /**
     * 调用 MCP 服务器 API
     */
    async callServer(
        server: McpServer,
        endpoint: string,
        method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
        body?: any
    ): Promise<ApiResponse> {
        try {
            const url = this.buildUrl(server.url, endpoint);
            const config = this.buildRequestConfig(server, method, body);

            const response: AxiosResponse = await axios({
                url,
                method,
                ...config
            });

            return {
                status: response.status,
                statusText: response.statusText,
                data: response.data,
                headers: response.headers as { [key: string]: string }
            };
        } catch (error: any) {
            if (error.response) {
                // 服务器响应了错误状态码
                return {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data,
                    headers: error.response.headers as { [key: string]: string }
                };
            } else if (error.request) {
                // 请求已发出但没有收到响应
                throw new Error(`No response received from server: ${error.message}`);
            } else {
                // 请求配置出错
                throw new Error(`Request configuration error: ${error.message}`);
            }
        }
    }

    /**
     * 测试服务器连接
     */
    async testConnection(server: McpServer): Promise<boolean> {
        try {
            const response = await this.callServer(server, '/health', 'GET');
            return response.status >= 200 && response.status < 300;
        } catch {
            // 如果 /health 端点不存在，尝试根路径
            try {
                const response = await this.callServer(server, '/', 'GET');
                return response.status >= 200 && response.status < 500; // 允许 404 等客户端错误
            } catch {
                return false;
            }
        }
    }

    /**
     * 构建完整的 URL
     */
    private buildUrl(baseUrl: string, endpoint: string): string {
        const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
        const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        return `${base}${path}`;
    }

    /**
     * 构建请求配置
     */
    private buildRequestConfig(
        server: McpServer,
        method: string,
        body?: any
    ): AxiosRequestConfig {
        const config: AxiosRequestConfig = {
            timeout: this.timeout,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'VSCode-MCP-Manager/1.0.0',
                ...server.headers
            }
        };

        // 添加认证头
        if (server.apiKey) {
            config.headers!['Authorization'] = `Bearer ${server.apiKey}`;
        }

        // 添加请求体
        if (body && (method === 'POST' || method === 'PUT')) {
            config.data = body;
        }

        return config;
    }

    /**
     * 格式化错误消息
     */
    formatError(error: any): string {
        if (error.response) {
            const status = error.response.status;
            const statusText = error.response.statusText;
            const message = error.response.data?.message || error.response.data?.error || 'Unknown error';
            return `HTTP ${status} ${statusText}: ${message}`;
        } else if (error.request) {
            return `Network error: Unable to reach server`;
        } else {
            return `Request error: ${error.message}`;
        }
    }

    /**
     * 验证响应数据
     */
    validateResponse(response: ApiResponse): boolean {
        return response.status >= 200 && response.status < 300;
    }
}