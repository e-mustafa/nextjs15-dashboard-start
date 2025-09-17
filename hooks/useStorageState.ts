import { useCallback, useEffect, useState } from 'react';

type StorageType = 'local' | 'session';

export default function useStorageState<T>(keyName: string, defaultValue: T, storageType: StorageType = 'local') {
	const [value, setValue] = useState<T>(defaultValue);

	const getStorage = (): Storage | null => {
		if (typeof window === 'undefined') return null;
		return storageType === 'local' ? localStorage : sessionStorage;
	};

	// Rehydrate after mount
	useEffect(() => {
		const storage = getStorage();
		console.log('storage:', storage);

		if (!storage) {
			setValue(defaultValue);
			return;
		}

		const stored = storage.getItem(keyName);
		console.log('stored:', stored);
		if (stored) {
			try {
				setValue(JSON.parse(stored));
			} catch {
				setValue(defaultValue);
			}
		} else {
			setValue(defaultValue);
		}
	}, [keyName, storageType]);

	// Sync changes
	useEffect(() => {
		const storage = getStorage();
		if (!storage) return;
		storage.setItem(keyName, JSON.stringify(value));
	}, [value, keyName, storageType]);

	const remove = useCallback(() => {
		const storage = getStorage();
		if (!storage) return;
		storage.removeItem(keyName);
		setValue(defaultValue);
	}, [keyName, defaultValue, storageType]);

	return [value, setValue, remove] as const;
}
