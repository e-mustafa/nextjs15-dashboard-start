import { create } from 'zustand';

interface storeType {
	processing: boolean;
	setProcessing: (processing: boolean) => void;
}

export const useGProgressBarStore = create<storeType>((set) => ({
	processing: false,
	setProcessing: (processing: boolean) => set({ processing }),
}));
