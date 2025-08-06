export const toasterConfig = {
	position: 'top-center',
	duration:2500,
	richColors: true,
	expand: false,
	closeButton: false,
};

export const toastTypes = ['success', 'error', 'info', 'warning', 'default', 'action', 'promise'] as const;

export const toastConfig = {
	success: {
		duration: 2500,
		position: 'top-center' as const,
		style: {
			color: 'green',
			backgroundColor: 'green',
			className: 'font-semibold',
		},
		// closeButton: true,
	},
	error: {
		duration: 2500,
		position: 'top-center' as const,
		style: {
			color: 'red',
			className: 'bg-destructive text-destructive-foreground font-semibold',
		},
		// closeButton: true,
	},
	info: {
		duration: 2500,
		position: 'top-center' as const,
		style: {
			color: 'blue',
		},
		// closeButton: true,
	},
	warning: {
		duration: 2500,
		position: 'top-center' as const,
		style: {
			color: 'yellow',
		},
		// closeButton: true,
	},
};
