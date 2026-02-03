/** 统一 API 响应格式 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
