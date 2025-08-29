export interface McpServer {
    name: string;
    url: string;
    apiKey?: string;
    headers?: { [key: string]: string };
}

export interface ApiResponse {
    status: number;
    statusText: string;
    data: any;
    headers: { [key: string]: string };
}

export interface ApiRequest {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    endpoint: string;
    body?: any;
    headers?: { [key: string]: string };
}