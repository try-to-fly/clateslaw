import got from 'got';

export interface AmapRegeoResult {
  formatted_address?: string;
  country?: string;
  province?: string;
  city?: string;
  district?: string;
  township?: string;
  neighborhood?: string;
  adcode?: string;
}

/**
 * AMap (Gaode) reverse geocoding.
 * Docs: https://lbs.amap.com/api/webservice/guide/api/georegeo
 */
export async function amapReverseGeocode(params: {
  key: string;
  lng: number;
  lat: number;
  radius?: number;
}): Promise<AmapRegeoResult> {
  const { key, lng, lat, radius = 200 } = params;

  const url = 'https://restapi.amap.com/v3/geocode/regeo';
  const searchParams = {
    key,
    location: `${lng},${lat}`,
    radius: String(radius),
    extensions: 'base',
  };

  const res = await got(url, {
    searchParams,
    timeout: { request: 15_000 },
  }).json<any>();

  if (!res || res.status !== '1') {
    throw new Error(`AMap regeo failed: ${res?.info || 'unknown'} (${res?.infocode || ''})`);
  }

  const regeo = res.regeocode || {};
  const addr = regeo.addressComponent || {};

  const city = Array.isArray(addr.city) ? addr.city[0] : addr.city;

  return {
    formatted_address: regeo.formatted_address,
    country: addr.country,
    province: addr.province,
    city: city || addr.province,
    district: addr.district,
    township: addr.township,
    neighborhood: addr.neighborhood?.name,
    adcode: addr.adcode,
  };
}
