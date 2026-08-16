import {
  defineOverridesPreferences,
  definePreferencesExtension,
} from '@vben/preferences';

interface WebNaivePreferencesExtension {
  defaultTableSize: number;
  enableFormFullscreen: boolean;
  reportTitle: string;
  tenantMode: 'multi' | 'single';
}

/**
 * @description 项目配置文件
 * 只需要覆盖项目中的一部分配置，不需要的配置不用覆盖，会自动使用默认配置
 * !!! 更改配置后请清空缓存，否则可能不生效
 */
export const overridesPreferences = defineOverridesPreferences({
  // overrides
  app: {
    accessMode: 'frontend',
    defaultAvatar:
      'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=AuroraBot',
    defaultHomePath: '/overview',
    enableCheckUpdates: false,
    layout: 'header-sidebar-nav',
    name: import.meta.env.VITE_APP_TITLE,
  },
  copyright: {
    companyName: 'AuroraBot Dev',
    date: '2026',
    enable: true,
    settingShow: false,
  },
  logo: {
    showText: true,
    source: '/logo.svg',
  },
  sidebar: {
    collapsed: true,
    collapsedButton: true,
    fixedButton: true,
  },
  tabbar: {
    enable: false,
  },
  theme: {
    mode: 'auto',
    radius: '0.75',
  },
  transition: {
    name: 'fade',
  },
  widget: {
    logoutButtonPosition: 'none',
    notificationButtonPosition: 'none',
    order: [
      'globalSearch',
      'preferences',
      'themeToggle',
      'languageToggle',
      'timezone',
      'fullscreen',
      'refresh',
      'lockScreenBtn',
      'logoutBtn',
      'notification',
    ],
  },
});

export const preferencesExtension =
  definePreferencesExtension<WebNaivePreferencesExtension>({
    tabLabel: 'preferences.naive.tabLabel',
    title: 'preferences.naive.title',
    fields: [
      {
        component: 'switch',
        defaultValue: true,
        key: 'enableFormFullscreen',
        label: 'preferences.naive.fields.enableFormFullscreen.label',
        tip: 'preferences.naive.fields.enableFormFullscreen.tip',
      },
      {
        component: 'select',
        defaultValue: 'single',
        key: 'tenantMode',
        label: 'preferences.naive.fields.tenantMode.label',
        options: [
          {
            label: 'preferences.naive.fields.tenantMode.options.single.label',
            value: 'single',
          },
          {
            label: 'preferences.naive.fields.tenantMode.options.multi.label',
            value: 'multi',
          },
        ],
      },
      {
        component: 'number',
        componentProps: {
          max: 200,
          min: 10,
          step: 10,
        },
        defaultValue: 20,
        key: 'defaultTableSize',
        label: 'preferences.naive.fields.defaultTableSize.label',
      },
      {
        component: 'input',
        defaultValue: '',
        key: 'reportTitle',
        label: 'preferences.naive.fields.reportTitle.label',
        placeholder: 'preferences.naive.fields.reportTitle.placeholder',
      },
    ],
  });
