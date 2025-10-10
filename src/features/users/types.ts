export interface UserProfile {
  id: string;
  name: string;
  bio?: string;
  avatar?: string;
  email?: string;
  createdAt: string;
  updatedAt?: string;
  followingCount?: number;
  followersCount?: number;
}

export interface UpdateUserProfileInput {
  userId: string;
  name?: string;
  bio?: string;
  avatar?: string;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  likes: boolean;
  comments: boolean;
  followers: boolean;
}

export interface PrivacySettings {
  profilePublic: boolean;
  showEmail: boolean;
  showDesigns: boolean;
}

export interface UserSettings {
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  language: string;
  theme: 'dark' | 'light';
  updatedAt?: string;
}

export interface UserSettingsUpdate {
  notifications?: Partial<NotificationSettings>;
  privacy?: Partial<PrivacySettings>;
  language?: string;
  theme?: 'dark' | 'light';
  updatedAt?: string;
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  notifications: {
    email: true,
    push: true,
    likes: true,
    comments: true,
    followers: true,
  },
  privacy: {
    profilePublic: true,
    showEmail: false,
    showDesigns: true,
  },
  language: 'zh-CN',
  theme: 'dark',
};
