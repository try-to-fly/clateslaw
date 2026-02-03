/** TeslaMate 设置 */
export interface Settings {
  unit_of_length: 'km' | 'mi';
  unit_of_temperature: 'C' | 'F';
  preferred_range: 'ideal' | 'rated';
  base_url: string;
}

/** 设置查询参数 */
export interface SettingsQueryParams {
  carId?: number;
}
