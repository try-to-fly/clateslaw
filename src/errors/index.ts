/**
 * Tesla 服务基础错误类
 */
export class TeslaServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'TeslaServiceError';
  }

  /**
   * 获取用户友好的错误消息
   */
  getUserMessage(): string {
    return this.message;
  }
}

/**
 * Grafana 连接错误
 */
export class GrafanaConnectionError extends TeslaServiceError {
  constructor(message: string, details?: unknown) {
    super(message, 'GRAFANA_CONNECTION_ERROR', details);
    this.name = 'GrafanaConnectionError';
  }

  getUserMessage(): string {
    return 'TeslaMate 服务连接失败，请检查 Grafana 服务是否正常运行';
  }
}

/**
 * 数据未找到错误
 */
export class DataNotFoundError extends TeslaServiceError {
  constructor(
    public readonly dataType: string,
    public readonly identifier?: string | number
  ) {
    const msg = identifier
      ? `${dataType} #${identifier} not found`
      : `No ${dataType} found`;
    super(msg, 'DATA_NOT_FOUND', { dataType, identifier });
    this.name = 'DataNotFoundError';
  }

  getUserMessage(): string {
    if (this.identifier) {
      return `找不到 ${this.getDataTypeName()} #${this.identifier}，请检查 ID 是否正确`;
    }
    return `该时间段内没有${this.getDataTypeName()}记录`;
  }

  private getDataTypeName(): string {
    const names: Record<string, string> = {
      drive: '行程',
      drives: '行程',
      charge: '充电',
      charges: '充电',
      battery: '电池数据',
      location: '位置',
    };
    return names[this.dataType] || this.dataType;
  }
}

/**
 * 截图生成错误
 */
export class ScreenshotError extends TeslaServiceError {
  constructor(message: string, details?: unknown) {
    super(message, 'SCREENSHOT_ERROR', details);
    this.name = 'ScreenshotError';
  }

  getUserMessage(): string {
    return '截图生成失败，可以尝试使用纯数据查询作为备选';
  }
}

/**
 * 查询协议错误
 */
export class QueryProtocolError extends TeslaServiceError {
  constructor(message: string, details?: unknown) {
    super(message, 'QUERY_PROTOCOL_ERROR', details);
    this.name = 'QueryProtocolError';
  }

  getUserMessage(): string {
    return '查询格式无效，请检查 JSON 结构是否正确';
  }
}

/**
 * 配置错误
 */
export class ConfigurationError extends TeslaServiceError {
  constructor(
    public readonly configKey: string,
    message?: string
  ) {
    super(message || `Missing configuration: ${configKey}`, 'CONFIGURATION_ERROR', { configKey });
    this.name = 'ConfigurationError';
  }

  getUserMessage(): string {
    return `配置缺失: ${this.configKey}，请检查环境变量设置`;
  }
}

/**
 * 判断是否为 TeslaServiceError
 */
export function isTeslaServiceError(error: unknown): error is TeslaServiceError {
  return error instanceof TeslaServiceError;
}

/**
 * 将任意错误转换为用户友好消息
 */
export function getErrorMessage(error: unknown): string {
  if (isTeslaServiceError(error)) {
    return error.getUserMessage();
  }

  if (error instanceof Error) {
    // 处理常见的网络错误
    if (error.message.includes('ECONNREFUSED')) {
      return 'TeslaMate 服务连接失败，请检查服务是否正常运行';
    }
    if (error.message.includes('ETIMEDOUT')) {
      return '连接超时，请检查网络状态';
    }
    return error.message;
  }

  return '发生未知错误';
}

/**
 * 包装异步函数，添加统一错误处理
 */
export function withErrorHandling<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  errorHandler?: (error: unknown) => void
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (errorHandler) {
        errorHandler(error);
      } else {
        console.error(getErrorMessage(error));
      }
      throw error;
    }
  }) as T;
}
