import { useEffect, useLayoutEffect, useState } from 'react';

const useIsClient = () => {
	const [isClient, setIsClient] = useState(false);

	const useIsoEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

	useIsoEffect(() => {
		setIsClient(true);
	}, []);

	return isClient;
};
export default useIsClient;
