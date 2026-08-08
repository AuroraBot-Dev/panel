import { eventHandler } from 'h3';
import { agents } from '~/utils/aurora-data';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse, useResponseSuccess } from '~/utils/response';

export default eventHandler((event) => {
  if (!verifyAccessToken(event)) return unAuthorizedResponse(event);
  return useResponseSuccess(agents);
});
