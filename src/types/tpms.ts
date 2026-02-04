/** 轮胎压力记录 */
export interface TPMSRecord {
  date: string;
  /** 左前轮压力 (bar) */
  fl: number | null;
  /** 右前轮压力 (bar) */
  fr: number | null;
  /** 左后轮压力 (bar) */
  rl: number | null;
  /** 右后轮压力 (bar) */
  rr: number | null;
  /** 外部温度 */
  outside_temp: number | null;
}

/** 轮胎压力统计 */
export interface TPMSStats {
  /** 最新读数 */
  latest: TPMSRecord | null;
  /** 平均压力 */
  avg: {
    fl: number | null;
    fr: number | null;
    rl: number | null;
    rr: number | null;
  };
  /** 是否有异常（压力差异过大） */
  hasAlert: boolean;
  /** 异常信息 */
  alertMessage: string | null;
}

/** 轮胎压力查询参数 */
export interface TPMSQueryParams {
  from?: string;
  to?: string;
}
