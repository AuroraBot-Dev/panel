export interface UserInfo {
  homePath?: string;
  id: number;
  password: string;
  realName: string;
  roles: string[];
  username: string;
}

export const MOCK_USERS: UserInfo[] = [
  {
    homePath: '/overview',
    id: 1,
    password: '123456',
    realName: 'Aurora Administrator',
    roles: ['admin'],
    username: 'admin',
  },
  {
    homePath: '/overview',
    id: 2,
    password: '123456',
    realName: 'Aurora Operator',
    roles: ['operator'],
    username: 'operator',
  },
];

export const MOCK_CODES = [
  {
    codes: ['agent:read', 'agent:write', 'config:write', 'logs:read'],
    username: 'admin',
  },
  {
    codes: ['agent:read', 'logs:read'],
    username: 'operator',
  },
];

const overviewMenu = {
  component: '/aurora/dashboard/index',
  meta: {
    affixTab: true,
    icon: 'lucide:layout-dashboard',
    order: -100,
    title: 'page.aurora.nav.overview',
  },
  name: 'Overview',
  path: '/overview',
};

export const MOCK_MENUS = MOCK_USERS.map(({ username }) => ({
  menus: [overviewMenu],
  username,
}));

export const MOCK_MENU_LIST = [
  {
    component: '/aurora/dashboard/index',
    id: 1,
    meta: overviewMenu.meta,
    name: overviewMenu.name,
    path: overviewMenu.path,
    status: 1,
    type: 'menu',
  },
];

export function getMenuIds(menus: any[]) {
  return menus.flatMap((item) => [
    item.id,
    ...(item.children ? getMenuIds(item.children) : []),
  ]);
}
