import { create } from 'zustand';

interface storeType {
	settingsD: {
		redirectAfterSubmit: boolean;
	};
	setSettingsD: (setting: keyof storeType['settingsD']) => void;
	setSettingsDT: (setting: keyof storeType['settingsD']) => void;
}

export const useSettingsDStore = create<storeType>((set) => ({
	settingsD: {
		redirectAfterSubmit: true,
	},
	settingsDT: {
		EnableAutoCollapse: true,
		// columnResizeMode: 'onChange' as 'onChange' | 'onEnd',
		defaultPinDirection: 'left' as 'left' | 'right',

		// Behavior configuration for each feature

		searchMode: 'server' as 'server' | 'hybrid',
		sortMode: 'hybrid' as 'client' | 'server' | 'hybrid',
	},
	setSettingsD: (setting) => set((state) => ({ ...state, setting })),
	setSettingsDT: (setting) => set((state) => ({ ...state, setting })),
}));
