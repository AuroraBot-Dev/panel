import { eventHandler, getQuery } from 'h3';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse, useResponseSuccess } from '~/utils/response';

const base = [122, 174, 146, 238, 202, 316, 271, 405, 342, 477, 429, 556];

function rangeMultiplier(range: unknown) {
  if (range === '30d') return 28;
  if (range === '7d') return 7;
  return 1;
}

export default eventHandler((event) => {
  if (!verifyAccessToken(event)) return unAuthorizedResponse(event);
  const { range } = getQuery(event);
  const multiplier = rangeMultiplier(range);
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
