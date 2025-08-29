import * as vscode from 'vscode';
import { McpServerProvider } from './providers/mcpServerProvider';
import { ConfigurationManager } from './managers/configurationManager';
import { ApiManager } from './managers/apiManager';
import { McpServer } from './types/mcpServer';
import { ErrorHandler } from './utils/errorHandler';

let mcpServerProvider: McpServerProvider;
let configManager: ConfigurationManager;
let apiManager: ApiManager;

export function activate(context: vscode.ExtensionContext) {
	console.log('MCP Manager extension is now active!');

	// 初始化管理器
	configManager = new ConfigurationManager();
	apiManager = new ApiManager();
	mcpServerProvider = new McpServerProvider(configManager);

	// 注册树视图提供者
	vscode.window.createTreeView('mcpServerList', {
		treeDataProvider: mcpServerProvider,
		showCollapseAll: true
	});

	// 注册命令
	const commands = [
		vscode.commands.registerCommand('vscode-demo.selectServer', selectServer),
		vscode.commands.registerCommand('vscode-demo.refreshServers', () => mcpServerProvider.refresh()),
		vscode.commands.registerCommand('vscode-demo.addServer', addServer),
		vscode.commands.registerCommand('vscode-demo.editServer', editServer),
		vscode.commands.registerCommand('vscode-demo.deleteServer', deleteServer),
		vscode.commands.registerCommand('vscode-demo.callServer', callServer),
		vscode.commands.registerCommand('vscode-demo.helloWorld', () => {
			vscode.window.showInformationMessage('Hello World from vscode-demo!');
		}),
	];

	context.subscriptions.push(...commands);

	// 监听配置变化
	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration('vscode-demo.servers')) {
				mcpServerProvider.refresh();
			}
		})
	);
}

async function selectServer() {
	try {
		const servers = configManager.getServers();
		if (servers.length === 0) {
			ErrorHandler.showInfo('No MCP servers configured. Please add a server first.');
			return;
		}

		const serverItems = servers.map(server => ({
			label: server.name,
			description: server.url,
			server: server
		}));

		const selected = await vscode.window.showQuickPick(serverItems, {
			placeHolder: 'Select an MCP server to call'
		});

		if (selected) {
			await promptForApiCall(selected.server);
		}
	} catch (error) {
		ErrorHandler.handleError(error, 'select server');
	}
}

async function promptForApiCall(server: McpServer) {
	try {
		const endpoint = await vscode.window.showInputBox({
			prompt: `Enter API endpoint for ${server.name}`,
			placeHolder: '/api/endpoint'
		});

		if (!endpoint) {
			return;
		}

		const method = await vscode.window.showQuickPick(
			['GET', 'POST', 'PUT', 'DELETE'],
			{ placeHolder: 'Select HTTP method' }
		) as 'GET' | 'POST' | 'PUT' | 'DELETE' | undefined;

		if (!method) {
			return;
		}

		let requestBody: any = undefined;
		if (method === 'POST' || method === 'PUT') {
			const bodyInput = await vscode.window.showInputBox({
				prompt: 'Enter request body (JSON format, optional)',
				placeHolder: '{"key": "value"}'
			});

			if (bodyInput && bodyInput.trim()) {
				try {
					requestBody = JSON.parse(bodyInput);
				} catch (error) {
					vscode.window.showErrorMessage('Invalid JSON format in request body');
					return;
				}
			}
		}

		const response = await ErrorHandler.withProgress(
			`Calling ${server.name}${endpoint}`,
			async () => await apiManager.callServer(server, endpoint, method, requestBody)
		);

		if (apiManager.validateResponse(response)) {
			await showApiResponse(response, server.name, endpoint);
		} else {
			ErrorHandler.handleNetworkError({ response }, server.name);
		}
	} catch (error) {
		ErrorHandler.handleNetworkError(error, server.name);
	}
}

async function showApiResponse(response: any, serverName: string, endpoint: string) {
	const document = await vscode.workspace.openTextDocument({
		content: JSON.stringify(response, null, 2),
		language: 'json'
	});

	await vscode.window.showTextDocument(document, {
		preview: true,
		viewColumn: vscode.ViewColumn.Beside
	});

	vscode.window.showInformationMessage(`API call to ${serverName}${endpoint} completed successfully`);
}

async function addServer() {
	try {
		const name = await vscode.window.showInputBox({
			prompt: 'Enter server name',
			placeHolder: 'My MCP Server'
		});

		if (!name) {
			return;
		}

		const url = await vscode.window.showInputBox({
			prompt: 'Enter server URL',
			placeHolder: 'https://api.example.com'
		});

		if (!url) {
			return;
		}

		const apiKey = await vscode.window.showInputBox({
			prompt: 'Enter API key (optional)',
			placeHolder: 'your-api-key',
			password: true
		});

		const server: McpServer = {
			name,
			url,
			apiKey: apiKey || undefined
		};

		// 验证服务器配置
		const validationErrors = configManager.validateServer(server);
		if (validationErrors.length > 0) {
			ErrorHandler.handleValidationError(validationErrors, 'Server configuration');
			return;
		}

		await configManager.addServer(server);
		mcpServerProvider.refresh();
		ErrorHandler.showInfo(`Server "${name}" added successfully`);
	} catch (error) {
		ErrorHandler.handleConfigurationError(error, 'add server');
	}
}

async function editServer(item?: any) {
	try {
		let server: McpServer;

		if (item && item.server) {
			server = item.server;
		} else {
			const servers = configManager.getServers();
			if (servers.length === 0) {
				vscode.window.showInformationMessage('No servers to edit');
				return;
			}

			const serverItems = servers.map(s => ({
				label: s.name,
				description: s.url,
				server: s
			}));

			const selected = await vscode.window.showQuickPick(serverItems, {
				placeHolder: 'Select server to edit'
			});

			if (!selected) {
				return;
			}
			server = selected.server;
		}

		const name = await vscode.window.showInputBox({
			prompt: 'Enter server name',
			value: server.name
		});

		if (!name) {
			return;
		}

		const url = await vscode.window.showInputBox({
			prompt: 'Enter server URL',
			value: server.url
		});

		if (!url) {
			return;
		}

		const apiKey = await vscode.window.showInputBox({
			prompt: 'Enter API key (optional)',
			value: server.apiKey || '',
			password: true
		});

		const updatedServer: McpServer = {
			name,
			url,
			apiKey: apiKey || undefined
		};

		// 验证服务器配置
		const validationErrors = configManager.validateServer(updatedServer);
		if (validationErrors.length > 0) {
			ErrorHandler.handleValidationError(validationErrors, 'Server configuration');
			return;
		}

		await configManager.updateServer(server, updatedServer);
		mcpServerProvider.refresh();
		ErrorHandler.showInfo(`Server "${name}" updated successfully`);
	} catch (error) {
		ErrorHandler.handleConfigurationError(error, 'edit server');
	}
}

async function deleteServer(item?: any) {
	try {
		let server: McpServer;

		if (item && item.server) {
			server = item.server;
		} else {
			const servers = configManager.getServers();
			if (servers.length === 0) {
				vscode.window.showInformationMessage('No servers to delete');
				return;
			}

			const serverItems = servers.map(s => ({
				label: s.name,
				description: s.url,
				server: s
			}));

			const selected = await vscode.window.showQuickPick(serverItems, {
				placeHolder: 'Select server to delete'
			});

			if (!selected) {
				return;
			}
			server = selected.server;
		}

		const confirmed = await ErrorHandler.showConfirmation(
			`Are you sure you want to delete server "${server.name}"?`
		);

		if (confirmed) {
			await configManager.deleteServer(server);
			mcpServerProvider.refresh();
			ErrorHandler.showInfo(`Server "${server.name}" deleted successfully`);
		}
	} catch (error) {
		ErrorHandler.handleConfigurationError(error, 'delete server');
	}
}

async function callServer(item?: any) {
	try {
		if (item && item.server) {
			await promptForApiCall(item.server);
		} else {
			await selectServer();
		}
	} catch (error) {
		ErrorHandler.handleError(error, 'call server');
	}
}

export function deactivate() {
	console.log('MCP Manager extension is now deactivated');
}