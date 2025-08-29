import * as vscode from 'vscode';

export class ErrorHandler {
    /**
     * 处理并显示错误消息
     */
    static handleError(error: any, context?: string): void {
        const message = this.formatErrorMessage(error, context);
        vscode.window.showErrorMessage(message);
        console.error(`MCP Manager Error${context ? ` (${context})` : ''}:`, error);
    }

    /**
     * 显示警告消息
     */
    static showWarning(message: string): void {
        vscode.window.showWarningMessage(`MCP Manager: ${message}`);
    }

    /**
     * 显示信息消息
     */
    static showInfo(message: string): void {
        vscode.window.showInformationMessage(`MCP Manager: ${message}`);
    }

    /**
     * 处理网络错误
     */
    static handleNetworkError(error: any, serverName?: string): void {
        let message = 'Network error occurred';
        
        if (serverName) {
            message = `Failed to connect to server "${serverName}"`;
        }

        if (error.code === 'ENOTFOUND') {
            message += ': Server not found. Please check the URL.';
        } else if (error.code === 'ECONNREFUSED') {
            message += ': Connection refused. Please check if the server is running.';
        } else if (error.code === 'ETIMEDOUT') {
            message += ': Connection timed out. Please check your network connection.';
        } else if (error.response) {
            const status = error.response.status;
            const statusText = error.response.statusText;
            message += `: HTTP ${status} ${statusText}`;
            
            if (status === 401) {
                message += '. Please check your API key.';
            } else if (status === 403) {
                message += '. Access forbidden. Please check your permissions.';
            } else if (status === 404) {
                message += '. Endpoint not found.';
            } else if (status >= 500) {
                message += '. Server error occurred.';
            }
        }

        vscode.window.showErrorMessage(message);
        console.error('MCP Manager Network Error:', error);
    }

    /**
     * 处理配置错误
     */
    static handleConfigurationError(error: any, action?: string): void {
        let message = 'Configuration error occurred';
        
        if (action) {
            message = `Failed to ${action}`;
        }

        if (error.message) {
            message += `: ${error.message}`;
        }

        vscode.window.showErrorMessage(message);
        console.error('MCP Manager Configuration Error:', error);
    }

    /**
     * 处理验证错误
     */
    static handleValidationError(errors: string[], context?: string): void {
        const message = context 
            ? `${context} validation failed:\n${errors.join('\n')}`
            : `Validation failed:\n${errors.join('\n')}`;
        
        vscode.window.showErrorMessage(message);
    }

    /**
     * 格式化错误消息
     */
    private static formatErrorMessage(error: any, context?: string): string {
        let message = 'An unexpected error occurred';
        
        if (context) {
            message = `Failed to ${context}`;
        }

        if (typeof error === 'string') {
            message += `: ${error}`;
        } else if (error instanceof Error) {
            message += `: ${error.message}`;
        } else if (error && error.message) {
            message += `: ${error.message}`;
        }

        return message;
    }

    /**
     * 显示确认对话框
     */
    static async showConfirmation(
        message: string, 
        confirmText: string = 'Yes', 
        cancelText: string = 'No'
    ): Promise<boolean> {
        const result = await vscode.window.showWarningMessage(
            message,
            { modal: true },
            confirmText,
            cancelText
        );
        return result === confirmText;
    }

    /**
     * 显示进度提示
     */
    static async withProgress<T>(
        title: string,
        task: (progress: vscode.Progress<{ message?: string; increment?: number }>) => Promise<T>
    ): Promise<T> {
        return vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: `MCP Manager: ${title}`,
                cancellable: false
            },
            task
        );
    }

    /**
     * 记录调试信息
     */
    static logDebug(message: string, data?: any): void {
        console.log(`MCP Manager Debug: ${message}`, data || '');
    }

    /**
     * 记录信息
     */
    static logInfo(message: string, data?: any): void {
        console.info(`MCP Manager Info: ${message}`, data || '');
    }
}