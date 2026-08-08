import { eventHandler, getQuery } from 'h3';
import { metricsByRange, storage } from '~/utils/aurora-data';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse, useResponseSuccess } from '~/utils/response';

export default eventHandler((event) => {
  if (!verifyAccessToken(event)) return unAuthorizedResponse(event);
  const { range } = getQuery(event);
  const key = range === '7d' || range === '30d' ? range : '24h';
  return useResponseSuccess({ ...metricsByRange[key], storage });
});
