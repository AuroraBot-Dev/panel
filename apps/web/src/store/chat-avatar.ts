import { ref, watch } from 'vue';

import { defineStore } from 'pinia';

interface ChatAvatarState {
  botIcon: string;
  botUrl: string;
  userIcon: string;
  userUrl: string;
}

const STORAGE_KEY = 'aurora-chat-avatars';

const DEFAULTS: ChatAvatarState = {
  botIcon: 'lucide:bot',
  botUrl: '',
  userIcon: 'lucide:user',
  userUrl: '',
};

function loadState(): ChatAvatarState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ChatAvatarState>;
      return {
        botIcon:
          typeof parsed.botIcon === 'string'
            ? parsed.botIcon
            : DEFAULTS.botIcon,
        botUrl:
          typeof parsed.botUrl === 'string' ? parsed.botUrl : DEFAULTS.botUrl,
        userIcon:
          typeof parsed.userIcon === 'string'
            ? parsed.userIcon
            : DEFAULTS.userIcon,
        userUrl:
          typeof parsed.userUrl === 'string'
            ? parsed.userUrl
            : DEFAULTS.userUrl,
      };
    }
  } catch {
    // Ignore malformed storage and fall back to defaults.
  }
  return { ...DEFAULTS };
}

export const useChatAvatarStore = defineStore('chat-avatar', () => {
  const saved = loadState();
  const botIcon = ref(saved.botIcon);
  const botUrl = ref(saved.botUrl);
  const userIcon = ref(saved.userIcon);
  const userUrl = ref(saved.userUrl);

  watch(
    [botIcon, botUrl, userIcon, userUrl],
    () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          botIcon: botIcon.value,
          botUrl: botUrl.value,
          userIcon: userIcon.value,
          userUrl: userUrl.value,
        } satisfies ChatAvatarState),
      );
    },
    { deep: true },
  );

  return { botIcon, botUrl, userIcon, userUrl };
});
