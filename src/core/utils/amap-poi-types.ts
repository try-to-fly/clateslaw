// Default POI typecodes for AMap WebService Place Search.
// These are heuristics; we may tune them based on real-world results.
//
// Ref: https://lbs.amap.com/api/webservice/download (POI category code table)

export type CategoryKey =
  | 'charging'
  | 'parking'
  | 'food'
  | 'convenience'
  | 'mall'
  | 'toilet'
  | 'coffee'
  | 'carwash'
  | 'pharmacy'
  | 'supermarket'
  | 'hotel';

// NOTE: Some categories can have multiple relevant typecodes; we search them in one request
// and then bucket results by typecode prefix match.
export const DEFAULT_TYPECODES: Record<CategoryKey, string[]> = {
  // 充电站：汽车充电站(011100)
  charging: ['011100'],

  // 停车场：停车场(150900)
  parking: ['150900'],

  // 美食：餐饮服务(050000)
  food: ['050000'],

  // 便利店：购物服务->便民商店/便利店；常见码表里 060200 系列
  convenience: ['060200'],

  // 商场：购物服务->商场；常见码表里 060100 系列
  mall: ['060100'],

  // 厕所：公共设施->公共厕所；常见码表里 200300 系列
  toilet: ['200300', '200301'],

  // 咖啡厅：餐饮服务->咖啡厅
  coffee: ['050500'],

  // 洗车场：汽车服务->洗车场
  carwash: ['010500'],

  // 药店：医药保健销售
  pharmacy: ['090600'],

  // 超市：购物服务->超级市场
  supermarket: ['060400'],

  // 酒店：住宿服务
  hotel: ['100000'],
};

export const OTHER_BUNDLED: CategoryKey[] = ['convenience', 'mall', 'toilet'];
