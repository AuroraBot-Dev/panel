import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const feature = (name: string, path: string, key: string, icon: string) => ({
  name,
  path,
  component: () => import('#/views/aurora/feature-placeholder.vue'),
  props: { featureKey: key },
  meta: { icon, title: $t(`page.aurora.features.${key}.title`) },
});

const realFeature = (
  name: string,
  path: string,
  key: string,
  icon: string,
  component: () => Promise<unknown>,
) => ({
  name,
  path,
  component,
  meta: { icon, title: $t(`page.aurora.features.${key}.title`) },
});

const routes: RouteRecordRaw[] = [
  {
    ...realFeature(
      'AgentObservation',
      '/observation',
      'observation',
      'lucide:activity',
      () => import('#/views/aurora/observation.vue'),
    ),
    meta: {
      icon: 'lucide:activity',
      order: -90,
      title: $t('page.aurora.nav.observation'),
    },
  },
  {
    name: 'Chat',
    path: '/chat',
    redirect: '/chat/console',
    meta: {
      icon: 'lucide:messages-square',
      order: -80,
      title: $t('page.aurora.nav.chat'),
    },
    children: [
      realFeature(
        'ChatConsole',
        'console',
        'chatConsole',
        'lucide:bot-message-square',
        () => import('#/views/aurora/chat-console.vue'),
      ),
      realFeature(
        'Conversations',
        'conversations',
        'conversations',
        'lucide:message-circle-more',
        () => import('#/views/aurora/conversations.vue'),
      ),
    ],
  },
  {
    name: 'Configuration',
    path: '/configuration',
    redirect: '/configuration/agent',
    meta: {
      icon: 'lucide:settings-2',
      order: -70,
      title: $t('page.aurora.nav.configuration'),
    },
    children: [
      realFeature(
        'AgentSettings',
        'agent',
        'agentSettings',
        'lucide:sliders-horizontal',
        () => import('#/views/aurora/agent-settings.vue'),
      ),
      realFeature(
        'Models',
        'models',
        'models',
        'lucide:boxes',
        () => import('#/views/aurora/models.vue'),
      ),
      realFeature(
        'Prompts',
        'prompts',
        'prompts',
        'lucide:notebook-pen',
        () => import('#/views/aurora/prompts.vue'),
      ),
    ],
  },
  {
    name: 'Resources',
    path: '/resources',
    redirect: '/resources/emoji',
    meta: {
      icon: 'lucide:library-big',
      order: -60,
      title: $t('page.aurora.nav.resources'),
    },
    children: [
      feature('EmojiPacks', 'emoji', 'emoji', 'lucide:smile-plus'),
      feature(
        'Expressions',
        'expressions',
        'expressions',
        'lucide:message-square-text',
      ),
      feature(
        'BlockedWords',
        'blocked-words',
        'blockedWords',
        'lucide:badge-x',
      ),
      feature('Learning', 'learning', 'learning', 'lucide:brain-circuit'),
      realFeature(
        'Memory',
        'memory',
        'memory',
        'lucide:database-zap',
        () => import('#/views/aurora/memory.vue'),
      ),
    ],
  },
  {
    name: 'Extensions',
    path: '/extensions',
    redirect: '/extensions/plugins',
    meta: {
      icon: 'lucide:blocks',
      order: -50,
      title: $t('page.aurora.nav.extensions'),
    },
    children: [
      feature('Plugins', 'plugins', 'plugins', 'lucide:plug-zap'),
      feature('Marketplace', 'marketplace', 'marketplace', 'lucide:store'),
    ],
  },
  {
    name: 'Operations',
    path: '/operations',
    redirect: '/operations/logs',
    meta: {
      icon: 'lucide:wrench',
      order: -40,
      title: $t('page.aurora.nav.operations'),
    },
    children: [
      realFeature(
        'Logs',
        'logs',
        'logs',
        'lucide:scroll-text',
        () => import('#/views/aurora/logs.vue'),
      ),
      realFeature(
        'Diagnostics',
        'diagnostics',
        'diagnostics',
        'lucide:stethoscope',
        () => import('#/views/aurora/diagnostics.vue'),
      ),
    ],
  },
];

export default routes;
