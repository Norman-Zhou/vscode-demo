import * as vscode from 'vscode';
import { McpServer } from '../types/mcpServer';
import { ConfigurationManager } from '../managers/configurationManager';

export class McpServerProvider implements vscode.TreeDataProvider<McpServerItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<McpServerItem | undefined | null | void> = new vscode.EventEmitter<McpServerItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<McpServerItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private configManager: ConfigurationManager) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: McpServerItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: McpServerItem): Thenable<McpServerItem[]> {
        if (!element) {
            // 返回根级别的服务器列表
            return Promise.resolve(this.getServerItems());
        }
        return Promise.resolve([]);
    }

    private getServerItems(): McpServerItem[] {
        const servers = this.configManager.getServers();
        return servers.map(server => new McpServerItem(
            server.name,
            server.url,
            server,
            vscode.TreeItemCollapsibleState.None
        ));
    }
}

export class McpServerItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly description: string,
        public readonly server: McpServer,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        
        this.tooltip = this.getTooltip();
        this.description = this.getDescription();
        this.contextValue = 'mcpServer';
        this.iconPath = new vscode.ThemeIcon('server');
    }

    private getTooltip(): string {
        const lines = [
            `Name: ${this.server.name}`,
            `URL: ${this.server.url}`
        ];
        
        if (this.server.apiKey) {
            lines.push('Authentication: API Key configured');
        }
        
        if (this.server.headers && Object.keys(this.server.headers).length > 0) {
            lines.push(`Custom Headers: ${Object.keys(this.server.headers).length}`);
        }
        
        return lines.join('\n');
    }

    private getDescription(): string {
        try {
            const url = new URL(this.server.url);
            return `${url.hostname}${url.port ? ':' + url.port : ''}`;
        } catch {
            return this.server.url;
        }
    }
}