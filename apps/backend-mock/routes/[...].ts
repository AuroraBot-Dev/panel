import { defineEventHandler } from 'h3';

export default defineEventHandler(() => {
  return `
<h1>AuroraBot Dashboard</h1>
<h2>Development Mock API is running</h2>
<ul>
<li><a href="/api/auth/login">/api/auth/login</a></li>
<li><a href="/api/auth/codes">/api/auth/codes</a></li>
<li><a href="/api/user/info">/api/user/info</a></li>
<li><a href="/api/menu/all">/api/menu/all</a></li>
<li><a href="/api/auth/logout">/api/auth/logout</a></li>
<li><a href="/api/aurora/agents">/api/aurora/agents</a></li>
<li><a href="/api/aurora/metrics/summary?range=24h">/api/aurora/metrics/summary</a></li>
<li><a href="/api/aurora/metrics/trend?range=24h">/api/aurora/metrics/trend</a></li>
</ul>
`;
});
