export enum Environments {
	DEV = 'development',
	STAGE = 'staging',
	PROD = 'production',
}

export enum UserGender {
	Male = 'male',
	Female = 'female',
}

export enum UserStatus {
	Active = 'active',
	Inactive = 'inactive',
	Expired = 'expired',
	Cancelled = 'cancelled',
}

export enum UserRole {
	ADMIN = 'ADMIN',
	EDITOR = 'EDITOR',
	MODERATOR = 'MODERATOR',
	MANAGER = 'MANAGER',
	AUTHOR = 'AUTHOR',
	CORRUPTER = 'CONTRIBUTOR',
	USER = 'USER',
	GUEST = 'guest',
}

export enum AuthProviders {
	Credentials = 'credentials',
	Google = 'google',
	Facebook = 'facebook',
	Twitter = 'twitter',
	Github = 'github',
	Apple = 'apple',
	Discord = 'discord',
	Twitch = 'twitch',
	Spotify = 'spotify',
	Yahoo = 'yahoo',
	LinkedIn = 'linkedin',
	Instagram = 'instagram',
	Reddit = 'reddit',
	Microsoft = 'microsoft',
	Slack = 'slack',
	Bitbucket = 'bitbucket',
}

export enum AuthSessionStrategy {
	JWT = 'jwt',
	Database = 'database',
}

// ------------------------------------------ links ------------------------------------------
export enum GeneralLinks {
	// landing ------------------------------
	HOME = '/',
	ABOUT = '/about',
	CONTACT = '/contact',
	// auth ---------------------------------
	SIGN_IN = 'sign-in',
	SIGN_UP = '/sign-up',
	FORGOT_PASSWORD = '/forgot-password',
	RESET_PASSWORD = '/reset-password',
	CHANGE_PASSWORD = '/change-password',
	VERIFY_EMAIL = '/verify-email',
	OAUTH_CALLBACK = '/auth/callback',
	// errors -------------------------------
	NOT_FOUND = '/404',
	ERROR_404 = '/404',
	ERROR_500 = '/500',
	// user profile -------------------------
	PROFILE = '/profile',
	SETTINGS = '/settings',
	TERMS = '/terms',
	PRIVACY = '/privacy',
	DASHBOARD = '/dashboard',
	ADMIN = '/admin',
	ADMIN_DASHBOARD = '/admin/dashboard',
}
export enum AuthFormType {
	SIGN_IN = 'SIGN_IN',
	SIGN_UP = 'SIGN_UP',
	FORGOT_PASSWORD = 'FORGOT_PASSWORD',
	RESET_PASSWORD = 'RESET_PASSWORD',
	CHANGE_PASSWORD = 'CHANGE_PASSWORD',
	VERIFY_EMAIL = 'VERIFY_EMAIL',
}