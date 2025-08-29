import * as vscode from 'vscode';
import { McpServer } from '../types/mcpServer';

export class ConfigurationManager {
    private readonly configSection = 'mcpManager';
    private readonly serversKey = 'servers';

    /**
     * 获取所有配置的 MCP 服务器
     */
    getServers(): McpServer[] {
        const config = vscode.workspace.getConfiguration(this.configSection);
        const servers = config.get<McpServer[]>(this.serversKey, []);
        return servers;
    }

    /**
     * 添加新的 MCP 服务器
     */
    async addServer(server: McpServer): Promise<void> {
        const servers = this.getServers();
        
        // 检查是否已存在同名服务器
        if (servers.some(s => s.name === server.name)) {
            throw new Error(`Server with name "${server.name}" already exists`);
        }

        servers.push(server);
        await this.updateServersConfig(servers);
    }

    /**
     * 更新现有的 MCP 服务器
     */
    async updateServer(oldServer: McpServer, newServer: McpServer): Promise<void> {
        const servers = this.getServers();
        const index = servers.findIndex(s => s.name === oldServer.name && s.url === oldServer.url);
        
        if (index === -1) {
            throw new Error(`Server "${oldServer.name}" not found`);
        }

        // 如果名称发生变化，检查新名称是否已存在
        if (oldServer.name !== newServer.name && servers.some(s => s.name === newServer.name)) {
            throw new Error(`Server with name "${newServer.name}" already exists`);
        }

        servers[index] = newServer;
        await this.updateServersConfig(servers);
    }

    /**
     * 删除 MCP 服务器
     */
    async deleteServer(server: McpServer): Promise<void> {
        const servers = this.getServers();
        const filteredServers = servers.filter(s => !(s.name === server.name && s.url === server.url));
        
        if (filteredServers.length === servers.length) {
            throw new Error(`Server "${server.name}" not found`);
        }

        await this.updateServersConfig(filteredServers);
    }

    /**
     * 根据名称查找服务器
     */
    findServerByName(name: string): McpServer | undefined {
        const servers = this.getServers();
        return servers.find(s => s.name === name);
    }

    /**
     * 验证服务器配置
     */
    validateServer(server: McpServer): string[] {
        const errors: string[] = [];

        if (!server.name || server.name.trim() === '') {
            errors.push('Server name is required');
        }

        if (!server.url || server.url.trim() === '') {
            errors.push('Server URL is required');
        } else {
            try {
                new URL(server.url);
            } catch {
                errors.push('Server URL is not valid');
            }
        }

        return errors;
    }

    /**
     * 更新服务器配置到 VS Code 设置
     */
    private async updateServersConfig(servers: McpServer[]): Promise<void> {
        const config = vscode.workspace.getConfiguration(this.configSection);
        await config.update(this.serversKey, servers, vscode.ConfigurationTarget.Global);
    }
}