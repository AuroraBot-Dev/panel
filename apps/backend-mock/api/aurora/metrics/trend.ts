import { eventHandler, getQuery } from 'h3';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse, useResponseSuccess } from '~/utils/response';

const base = [122, 174, 146, 238, 202, 316, 271, 405, 342, 477, 429, 556];

export default eventHandler((event) => {
  if (!verifyAccessToken(event)) return unAuthorizedResponse(event);
  const { range } = getQuery(event);
  const multiplier = range === '30d' ? 28 : range === '7d' ? 7 : 1;
  const suffix = range === '24h' || !range ? ':00' : '';
  return useResponseSuccess(
    base.map((requests, index) => ({
      inputTokens: requests * 1840 * multiplier,
      label: `${String(index * 2).padStart(2, '0')}${suffix}`,
      outputTokens: requests * 620 * multiplier,
      requests: requests * multiplier,
    })),
  );
});
