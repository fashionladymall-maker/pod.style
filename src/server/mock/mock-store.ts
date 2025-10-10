import { v4 as uuidv4 } from 'uuid';
import type {
  Creation,
  LegacyComment,
  Notification,
  NotificationInput,
  Order,
  OrderDetails,
  PaymentSummary,
  ShippingInfo,
  Follow,
  FollowStats,
  Hashtag,
  ViewHistory,
  UserFineTunedModel,
} from '@/lib/types';
import { mockCreations as seedCreations } from '@/lib/test-data/mock-creations';
import type { UserSettings, UserSettingsUpdate, UserProfile, UpdateUserProfileInput } from '@/features/users/types';
import { DEFAULT_USER_SETTINGS } from '@/features/users/types';

type InternalCreation = Creation & {
  hashtags?: string[];
};

const cloneCreation = (creation: InternalCreation): Creation => ({
  ...creation,
  likedBy: [...creation.likedBy],
  favoritedBy: [...creation.favoritedBy],
  models: creation.models.map((model) => ({ ...model })),
});

const normalizeCreation = (creation: Creation): InternalCreation => ({
  ...creation,
  isPublic: creation.isPublic ?? true,
  createdAt: creation.createdAt ?? new Date().toISOString(),
  favoriteCount: creation.favoriteCount ?? 0,
  favoritedBy: creation.favoritedBy ?? [],
  likeCount: creation.likeCount ?? 0,
  likedBy: creation.likedBy ?? [],
  commentCount: creation.commentCount ?? 0,
  shareCount: creation.shareCount ?? 0,
  remakeCount: creation.remakeCount ?? 0,
  orderCount: creation.orderCount ?? 0,
  viewCount: creation.viewCount ?? 0,
  models: (creation.models ?? []).map((model) => ({
    ...model,
    isPublic: model.isPublic ?? true,
  })),
});

const creationStore: InternalCreation[] = seedCreations.map((creation, index) => ({
  ...normalizeCreation(creation),
  id: creation.id || `mock-${index + 1}`,
  hashtags: [],
}));

const commentsStore = new Map<string, LegacyComment[]>();
const ordersStore: Order[] = [];
const notificationsStore = new Map<string, Notification[]>();
const userProfileStore = new Map<string, UserProfile>();

const followerMap = new Map<string, Set<string>>();
const followingMap = new Map<string, Set<string>>();

interface HashtagRecord {
  id: string;
  name: string;
  count: number;
  createdAt: string;
  updatedAt?: string;
  creationIds: Set<string>;
}

const hashtagStore = new Map<string, HashtagRecord>();

const viewHistoryStore = new Map<string, ViewHistory[]>();

const userModelStore = new Map<string, UserFineTunedModel>();
const userSettingsStore = new Map<string, UserSettings>();

const ensureArray = <T,>(value: T[] | undefined): T[] => (value ? [...value] : []);

const computeTrendingScore = (creation: InternalCreation) => {
  const {
    likeCount = 0,
    favoriteCount = 0,
    shareCount = 0,
    commentCount = 0,
    remakeCount = 0,
    orderCount = 0,
  } = creation;
  return likeCount * 2 + favoriteCount * 3 + shareCount + commentCount * 1.5 + remakeCount * 4 + orderCount * 5;
};

const getCreationIndex = (creationId: string) =>
  creationStore.findIndex((creation) => creation.id === creationId);

const getCreationById = (creationId: string): InternalCreation | null => {
  const index = getCreationIndex(creationId);
  return index >= 0 ? creationStore[index] : null;
};

const ensureHashtagRecord = (name: string): HashtagRecord => {
  const normalized = name.toLowerCase();
  let record = hashtagStore.get(normalized);
  if (!record) {
    record = {
      id: uuidv4(),
      name: normalized,
      count: 0,
      createdAt: new Date().toISOString(),
      creationIds: new Set<string>(),
    };
    hashtagStore.set(normalized, record);
  }
  return record;
};

const extractHashtags = (text: string): string[] => {
  const matches = text.match(/#[\w\u4e00-\u9fa5]+/g);
  if (!matches) return [];
  return [...new Set(matches.map((tag) => tag.slice(1).toLowerCase()))];
};

const createPlaceholderImage = (text: string, width = 600, height = 800) =>
  `https://placehold.co/${width}x${height}/png?text=${encodeURIComponent(text.slice(0, 32))}`;

const formatUserDisplayName = (userId: string) => `用户-${userId.slice(0, 6)}`;

export const mockGeneratePattern = ({
  userId,
  prompt,
  style,
  referenceImage,
}: {
  userId: string;
  prompt: string;
  style: string;
  referenceImage?: string | null;
}): Creation => {
  const id = uuidv4();
  const nowIso = new Date().toISOString();
  const imageUri = referenceImage ?? createPlaceholderImage(prompt);

  const creation: InternalCreation = {
    id,
    userId,
    userName: formatUserDisplayName(userId),
    prompt,
    style,
    summary: prompt.slice(0, 120),
    patternUri: imageUri,
    previewPatternUri: imageUri,
    models: [],
    createdAt: nowIso,
    isPublic: false,
    orderCount: 0,
    likeCount: 0,
    likedBy: [],
    favoriteCount: 0,
    favoritedBy: [],
    commentCount: 0,
    shareCount: 0,
    remakeCount: 0,
    viewCount: 0,
    hashtags: [],
  } as InternalCreation;

  creationStore.unshift(creation);
  return cloneCreation(creation);
};

export const mockGenerateModel = (input: {
  creationId: string;
  userId: string;
  category: string;
  colorName: string;
}): Creation => {
  const { creationId, category, colorName, userId } = input;
  void userId;
  const creation = getCreationById(creationId);
  if (!creation) {
    throw new Error('Creation not found');
  }

  const modelUri = createPlaceholderImage(`${category}-${colorName}`, 900, 900);
  creation.models = [
    ...creation.models,
    {
      uri: modelUri,
      previewUri: modelUri,
      category,
      isPublic: true,
    },
  ];
  creation.orderCount = creation.orderCount ?? 0;

  return cloneCreation(creation);
};

export const mockGetPublicCreations = (limit: number = 20): Creation[] =>
  creationStore
    .filter((creation) => creation.isPublic !== false)
    .slice(0, limit)
    .map(cloneCreation);

export const mockGetTrendingCreations = (limit: number = 20): Creation[] =>
  [...creationStore]
    .filter((creation) => creation.isPublic !== false)
    .sort((a, b) => computeTrendingScore(b) - computeTrendingScore(a))
    .slice(0, limit)
    .map(cloneCreation);

export const mockGetUserCreations = (userId: string): Creation[] =>
  creationStore
    .filter((creation) => creation.userId === userId)
    .map(cloneCreation);

export const mockFindCreationById = (creationId: string): Creation | null => {
  const creation = getCreationById(creationId);
  return creation ? cloneCreation(creation) : null;
};

export const mockDeleteCreation = (creationId: string): void => {
  const index = getCreationIndex(creationId);
  if (index >= 0) {
    creationStore.splice(index, 1);
  }
  commentsStore.delete(creationId);
};

export const mockToggleCreationPublicStatus = (creationId: string, isPublic: boolean): Creation => {
  const creation = getCreationById(creationId);
  if (!creation) {
    throw new Error('Creation not found');
  }
  creation.isPublic = isPublic;
  return cloneCreation(creation);
};

export const mockToggleLike = (creationId: string, userId: string, isLiked: boolean): void => {
  const creation = getCreationById(creationId);
  if (!creation) {
    throw new Error('Creation not found');
  }

  const hasLiked = creation.likedBy.includes(userId);
  if (isLiked && !hasLiked) {
    creation.likedBy.push(userId);
    creation.likeCount += 1;
  } else if (!isLiked && hasLiked) {
    creation.likedBy = creation.likedBy.filter((id) => id !== userId);
    creation.likeCount = Math.max(0, creation.likeCount - 1);
  }
};

export const mockToggleFavorite = (creationId: string, userId: string, isFavorited: boolean): void => {
  const creation = getCreationById(creationId);
  if (!creation) {
    throw new Error('Creation not found');
  }

  const hasFavorited = creation.favoritedBy.includes(userId);
  if (isFavorited && !hasFavorited) {
    creation.favoritedBy.push(userId);
    creation.favoriteCount += 1;
  } else if (!isFavorited && hasFavorited) {
    creation.favoritedBy = creation.favoritedBy.filter((id) => id !== userId);
    creation.favoriteCount = Math.max(0, creation.favoriteCount - 1);
  }
};

export const mockIncrementMetric = (creationId: string, field: 'shareCount' | 'remakeCount'): void => {
  const creation = getCreationById(creationId);
  if (!creation) {
    throw new Error('Creation not found');
  }
  creation[field] = (creation[field] ?? 0) + 1;
};

export const mockDeleteModel = (creationId: string, modelUri: string): Creation => {
  const creation = getCreationById(creationId);
  if (!creation) {
    throw new Error('Creation not found');
  }
  const initialLength = creation.models.length;
  creation.models = creation.models.filter((model) => model.uri !== modelUri);
  if (creation.models.length === initialLength) {
    throw new Error('Model not found on creation');
  }
  return cloneCreation(creation);
};

export const mockToggleModelVisibility = (creationId: string, modelUri: string, isPublic: boolean): Creation => {
  const creation = getCreationById(creationId);
  if (!creation) {
    throw new Error('Creation not found');
  }
  creation.models = creation.models.map((model) =>
    model.uri === modelUri
      ? {
          ...model,
          isPublic,
        }
      : model
  );
  return cloneCreation(creation);
};

export const mockForkCreation = (sourceCreationId: string, userId: string): Creation => {
  const source = getCreationById(sourceCreationId);
  if (!source) {
    throw new Error('Source creation not found');
  }
  const nowIso = new Date().toISOString();
  const cloned: InternalCreation = {
    ...source,
    id: uuidv4(),
    userId,
    userName: formatUserDisplayName(userId),
    isPublic: false,
    createdAt: nowIso,
    orderCount: 0,
    likeCount: 0,
    likedBy: [],
    favoriteCount: 0,
    favoritedBy: [],
    commentCount: 0,
    shareCount: 0,
    remakeCount: 0,
    models: source.models.map((model) => ({ ...model, isPublic: false })),
  };
  creationStore.unshift(cloned);
  return cloneCreation(cloned);
};

export const mockAddComment = ({
  creationId,
  userId,
  userName,
  userPhotoURL,
  content,
}: {
  creationId: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  content: string;
}): LegacyComment => {
  const creation = getCreationById(creationId);
  if (!creation) {
    throw new Error('Creation not found');
  }
  const comment: LegacyComment = {
    id: uuidv4(),
    userId,
    userName,
    userPhotoURL,
    content,
    createdAt: new Date().toISOString(),
  };
  const existing = commentsStore.get(creationId) ?? [];
  commentsStore.set(creationId, [comment, ...existing]);
  creation.commentCount += 1;
  return comment;
};

export const mockGetComments = (creationId: string): LegacyComment[] =>
  ensureArray(commentsStore.get(creationId));

export const mockLogInteraction = ({
  action,
  creationId,
  userId,
  weight = 1,
}: {
  action: 'view' | 'like' | 'favorite' | 'share' | 'order' | 'comment' | 'remake';
  creationId: string;
  userId: string | null;
  weight?: number;
  modelUri?: string;
  metadata?: Record<string, unknown>;
}): void => {
  const creation = getCreationById(creationId);
  if (!creation) {
    return;
  }

  switch (action) {
    case 'share':
      creation.shareCount += Math.max(1, weight);
      break;
    case 'remake':
      creation.remakeCount += Math.max(1, weight);
      break;
    case 'order':
      creation.orderCount += Math.max(1, weight);
      break;
    case 'view':
      creation.viewCount = (creation.viewCount ?? 0) + Math.max(1, weight);
      break;
    case 'like':
      if (userId) {
        mockToggleLike(creationId, userId, true);
      }
      break;
    case 'favorite':
      if (userId) {
        mockToggleFavorite(creationId, userId, true);
      }
      break;
    default:
      break;
  }
};

export const mockPlaceOrder = ({
  userId,
  creationId,
  modelUri,
  category,
  orderDetails,
  shippingInfo,
  paymentSummary,
  price,
}: {
  userId: string;
  creationId: string;
  modelUri: string;
  category: string;
  orderDetails: OrderDetails;
  shippingInfo: ShippingInfo;
  paymentSummary: PaymentSummary;
  price: number;
}): Order => {
  const order: Order = {
    id: uuidv4(),
    userId,
    creationId,
    modelUri,
    category,
    size: orderDetails.size,
    colorName: orderDetails.colorName,
    quantity: orderDetails.quantity,
    price,
    shippingInfo,
    paymentSummary,
    createdAt: new Date().toISOString(),
    status: 'Processing',
    statusHistory: [
      {
        status: 'Processing',
        occurredAt: new Date().toISOString(),
      },
    ],
  };

  ordersStore.unshift(order);
  const creation = getCreationById(creationId);
  if (creation) {
    creation.orderCount += Math.max(1, orderDetails.quantity);
  }

  return order;
};

export const mockGetOrders = (userId: string): Order[] =>
  ordersStore
    .filter((order) => order.userId === userId)
    .map((order) => ({
      ...order,
      statusHistory: order.statusHistory ? order.statusHistory.map((event) => ({ ...event })) : undefined,
    }));

const ensureUserSettings = (userId: string): UserSettings => {
  const existing = userSettingsStore.get(userId);
  if (existing) {
    return existing;
  }

  const seeded: UserSettings = {
    ...DEFAULT_USER_SETTINGS,
    updatedAt: new Date().toISOString(),
  };
  userSettingsStore.set(userId, seeded);
  return seeded;
};

export const mockGetUserSettings = (userId: string): UserSettings => ensureUserSettings(userId);

export const mockUpdateUserSettings = (
  userId: string,
  updates: UserSettingsUpdate,
): UserSettings => {
  const current = ensureUserSettings(userId);
  const timestamp = new Date().toISOString();

  const next: UserSettings = {
    ...current,
    notifications: {
      ...current.notifications,
      ...(updates.notifications ?? {}),
    },
    privacy: {
      ...current.privacy,
      ...(updates.privacy ?? {}),
    },
    language: updates.language ?? current.language,
    theme: updates.theme ?? current.theme,
    updatedAt: timestamp,
  };

  userSettingsStore.set(userId, next);
  return next;
};

const seedNotifications = (userId: string): Notification[] => {
  const now = Date.now();
  return [
    {
      id: uuidv4(),
      userId,
      type: 'order',
      title: '订单已发货',
      message: '您的订单 #1002401 已进入配送流程，预计 3 天内送达。',
      actorId: undefined,
      actorName: '系统通知',
      createdAt: new Date(now - 60 * 60 * 1000).toISOString(),
      isRead: false,
    },
    {
      id: uuidv4(),
      userId,
      type: 'comment',
      title: '新评论',
      message: 'Alice 刚刚给你的设计留言：“喜欢这套配色！”',
      actorId: 'user-alice',
      actorName: 'Alice',
      createdAt: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
      isRead: false,
    },
    {
      id: uuidv4(),
      userId,
      type: 'follow',
      title: '新增关注',
      message: '设计师 Max 关注了你，快去看看他的新作品。',
      actorId: 'user-max',
      actorName: 'Max',
      createdAt: new Date(now - 26 * 60 * 60 * 1000).toISOString(),
      isRead: true,
    },
  ];
};

const ensureNotifications = (userId: string): Notification[] => {
  const existing = notificationsStore.get(userId);
  if (existing) {
    return existing;
  }
  const seeded = seedNotifications(userId);
  notificationsStore.set(userId, seeded);
  return seeded;
};

export const mockGetNotificationsForUser = (
  userId: string,
  type?: string,
  page: number = 1,
  limit: number = 20,
): { notifications: Notification[]; hasMore: boolean } => {
  const list = ensureNotifications(userId);
  const filtered = type && type !== 'all' ? list.filter((item) => item.type === type) : list;
  const start = Math.max(page - 1, 0) * limit;
  const pageItems = filtered.slice(start, start + limit);
  return {
    notifications: pageItems.map((item) => ({ ...item })),
    hasMore: filtered.length > start + limit,
  };
};

export const mockMarkNotificationAsRead = (notificationId: string): void => {
  for (const [userId, list] of notificationsStore.entries()) {
    const index = list.findIndex((notification) => notification.id === notificationId);
    if (index >= 0) {
      const updated = [...list];
      updated[index] = { ...updated[index], isRead: true };
      notificationsStore.set(userId, updated);
      break;
    }
  }
};

export const mockMarkAllNotificationsAsRead = (userId: string): void => {
  const list = ensureNotifications(userId);
  notificationsStore.set(
    userId,
    list.map((notification) => ({ ...notification, isRead: true })),
  );
};

export const mockDeleteNotification = (notificationId: string): void => {
  for (const [userId, list] of notificationsStore.entries()) {
    const filtered = list.filter((notification) => notification.id !== notificationId);
    if (filtered.length !== list.length) {
      notificationsStore.set(userId, filtered);
      break;
    }
  }
};

export const mockDeleteAllNotifications = (userId: string): void => {
  notificationsStore.set(userId, []);
};

export const mockGetUnreadNotificationCount = (userId: string): number => {
  return ensureNotifications(userId).filter((notification) => !notification.isRead).length;
};

export const mockCreateNotification = (input: NotificationInput): Notification => {
  const list = ensureNotifications(input.userId);
  const notification: Notification = {
    id: uuidv4(),
    userId: input.userId,
    type: input.type,
    title: input.title,
    message: input.message,
    actorId: input.actorId,
    actorName: input.actorId ? `用户-${input.actorId.slice(0, 6)}` : '系统',
    relatedId: input.relatedId,
    link: input.link,
    createdAt: new Date().toISOString(),
    isRead: false,
    metadata: input.metadata,
  };

  notificationsStore.set(input.userId, [notification, ...list]);
  return notification;
};

const ensureUserProfile = (userId: string, email?: string, name?: string): UserProfile => {
  let profile = userProfileStore.get(userId);
  if (!profile) {
    profile = {
      id: userId,
      name: name ?? `用户-${userId.slice(0, 6)}`,
      email,
      bio: '欢迎来到 POD.STYLE！',
      avatar: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: undefined,
      followingCount: Math.floor(Math.random() * 120),
      followersCount: Math.floor(Math.random() * 320),
    };
    userProfileStore.set(userId, profile);
  }
  return profile;
};

export const mockGetUserProfile = (userId: string): UserProfile | null => ensureUserProfile(userId);

export const mockUpdateUserProfile = (input: UpdateUserProfileInput): UserProfile => {
  const current = ensureUserProfile(input.userId);
  const updated: UserProfile = {
    ...current,
    name: input.name ?? current.name,
    bio: input.bio ?? current.bio,
    avatar: input.avatar ?? current.avatar,
    updatedAt: new Date().toISOString(),
  };
  userProfileStore.set(input.userId, updated);
  return updated;
};

export const mockCreateUserProfile = (userId: string, email?: string, name?: string): UserProfile =>
  ensureUserProfile(userId, email, name);

const ensureUserModel = (userId: string): UserFineTunedModel => {
  const existing = userModelStore.get(userId);
  if (existing) {
    return existing;
  }
  const nowIso = new Date().toISOString();
  const model: UserFineTunedModel = {
    userId,
    modelName: 'mock/pattern-generator',
    displayName: '示例个性化模型',
    provider: 'custom',
    baseModel: 'mock-base',
    status: 'ready',
    createdAt: nowIso,
    updatedAt: nowIso,
    lastUsedAt: nowIso,
    personalization: {
      strength: 0.6,
      tags: [],
      preferredStyles: [],
    },
    metadata: {
      initializedAutomatically: true,
      source: 'mock-store',
    },
  };
  userModelStore.set(userId, model);
  return model;
};

export const mockEnsureUserFineTunedModel = (userId: string): UserFineTunedModel => ensureUserModel(userId);

export const mockUpdateUserFineTunedModel = (
  userId: string,
  updates: Partial<UserFineTunedModel>,
): UserFineTunedModel => {
  const current = ensureUserModel(userId);
  const basePersonalization = current.personalization ?? {
    strength: 0.6,
    tags: [] as string[],
    preferredStyles: [] as string[] | undefined,
  };
  const personalization = updates.personalization
    ? {
        strength: updates.personalization.strength ?? basePersonalization.strength ?? 0.6,
        tags: updates.personalization.tags ?? basePersonalization.tags ?? [],
        preferredStyles:
          updates.personalization.preferredStyles ?? basePersonalization.preferredStyles ?? [],
      }
    : basePersonalization;
  const updated: UserFineTunedModel = {
    ...current,
    ...updates,
    personalization,
    metadata: {
      ...(current.metadata ?? {}),
      ...(updates.metadata ?? {}),
    },
    updatedAt: new Date().toISOString(),
  };
  userModelStore.set(userId, updated);
  return updated;
};

export const mockMarkUserFineTunedModelUsed = (userId: string): UserFineTunedModel => {
  const current = ensureUserModel(userId);
  const nowIso = new Date().toISOString();
  const updated = {
    ...current,
    lastUsedAt: nowIso,
    updatedAt: nowIso,
  };
  userModelStore.set(userId, updated);
  return updated;
};

export const mockRecordView = (userId: string, creationId: string, duration?: number): ViewHistory => {
  const entry: ViewHistory = {
    id: uuidv4(),
    userId,
    creationId,
    viewedAt: new Date().toISOString(),
    duration,
  };
  const existing = viewHistoryStore.get(userId) ?? [];
  viewHistoryStore.set(userId, [entry, ...existing].slice(0, 200));
  const creation = getCreationById(creationId);
  if (creation) {
    creation.viewCount = (creation.viewCount ?? 0) + 1;
  }
  return entry;
};

export const mockGetViewHistory = (userId: string, limit: number): ViewHistory[] =>
  ensureArray(viewHistoryStore.get(userId)).slice(0, limit);

export const mockGetViewedCreationIds = (userId: string, limit: number): string[] =>
  ensureArray(viewHistoryStore.get(userId))
    .map((entry) => entry.creationId)
    .filter((value, index, array) => array.indexOf(value) === index)
    .slice(0, limit);

export const mockClearViewHistory = (userId: string): void => {
  viewHistoryStore.delete(userId);
};

export const mockDeleteViewHistoryItem = (historyId: string): void => {
  viewHistoryStore.forEach((entries, userKey) => {
    const filtered = entries.filter((entry) => entry.id !== historyId);
    if (filtered.length !== entries.length) {
      viewHistoryStore.set(userKey, filtered);
    }
  });
};

export const mockHasViewed = (userId: string, creationId: string): boolean =>
  ensureArray(viewHistoryStore.get(userId)).some((entry) => entry.creationId === creationId);

export const mockGetRecentlyViewed = (userId: string, limit: number): string[] =>
  ensureArray(viewHistoryStore.get(userId))
    .slice(0, limit)
    .map((entry) => entry.creationId);

export const mockGetAllViewHistoryEntries = (): ViewHistory[] => {
  const entries: ViewHistory[] = [];
  viewHistoryStore.forEach((list) => {
    entries.push(...list);
  });
  return entries;
};

const ensureFollowSet = (map: Map<string, Set<string>>, key: string): Set<string> => {
  let set = map.get(key);
  if (!set) {
    set = new Set();
    map.set(key, set);
  }
  return set;
};

export const mockFollowUser = (followerId: string, followingId: string): Follow => {
  const followingSet = ensureFollowSet(followerMap, followerId);
  const followersSet = ensureFollowSet(followingMap, followingId);

  followingSet.add(followingId);
  followersSet.add(followerId);

  return {
    id: `${followerId}-${followingId}`,
    followerId,
    followingId,
    followerName: formatUserDisplayName(followerId),
    followingName: formatUserDisplayName(followingId),
    createdAt: new Date().toISOString(),
  };
};

export const mockUnfollowUser = (followerId: string, followingId: string): void => {
  followerMap.get(followerId)?.delete(followingId);
  followingMap.get(followingId)?.delete(followerId);
};

export const mockIsFollowing = (followerId: string, followingId: string): boolean =>
  followerMap.get(followerId)?.has(followingId) ?? false;

export const mockGetFollowStats = (userId: string, currentUserId?: string): FollowStats => {
  const followingCount = followerMap.get(userId)?.size ?? 0;
  const followersCount = followingMap.get(userId)?.size ?? 0;
  const stats: FollowStats = {
    followingCount,
    followersCount,
  };
  if (currentUserId) {
    stats.isFollowing = mockIsFollowing(currentUserId, userId);
    stats.isFollowedBy = mockIsFollowing(userId, currentUserId);
  }
  return stats;
};

const paginateFollows = (ids: string[], page: number, limit: number): { slice: string[]; hasMore: boolean } => {
  const startIndex = Math.max(page - 1, 0) * limit;
  const slice = ids.slice(startIndex, startIndex + limit);
  const hasMore = ids.length > startIndex + slice.length;
  return { slice, hasMore };
};

export const mockGetFollowing = (userId: string, page: number, limit: number): { follows: Follow[]; hasMore: boolean } => {
  const followingIds = Array.from(followerMap.get(userId) ?? []);
  const { slice, hasMore } = paginateFollows(followingIds, page, limit);
  const follows = slice.map((targetId) => ({
    id: `${userId}-${targetId}`,
    followerId: userId,
    followingId: targetId,
    followerName: formatUserDisplayName(userId),
    followingName: formatUserDisplayName(targetId),
    createdAt: new Date().toISOString(),
  }));
  return { follows, hasMore };
};

export const mockGetFollowers = (userId: string, page: number, limit: number): { follows: Follow[]; hasMore: boolean } => {
  const followerIds = Array.from(followingMap.get(userId) ?? []);
  const { slice, hasMore } = paginateFollows(followerIds, page, limit);
  const follows = slice.map((followerId) => ({
    id: `${followerId}-${userId}`,
    followerId,
    followingId: userId,
    followerName: formatUserDisplayName(followerId),
    followingName: formatUserDisplayName(userId),
    createdAt: new Date().toISOString(),
  }));
  return { follows, hasMore };
};

export const mockGetMutualFollows = (userId: string): Follow[] => {
  const followers = followingMap.get(userId) ?? new Set<string>();
  const following = followerMap.get(userId) ?? new Set<string>();
  const mutualIds = [...followers].filter((id) => following.has(id));
  return mutualIds.map((mutualId) => ({
    id: `${userId}-${mutualId}`,
    followerId: userId,
    followingId: mutualId,
    followerName: formatUserDisplayName(userId),
    followingName: formatUserDisplayName(mutualId),
    createdAt: new Date().toISOString(),
  }));
};

export const mockRemoveFollower = (userId: string, followerId: string): void => {
  followingMap.get(userId)?.delete(followerId);
  followerMap.get(followerId)?.delete(userId);
};

export const mockAddHashtagsToCreation = (creationId: string, userId: string, text: string): string[] => {
  const creation = getCreationById(creationId);
  if (!creation) {
    throw new Error('Creation not found');
  }
  const hashtagNames = extractHashtags(text);
  if (hashtagNames.length === 0) {
    return [];
  }
  creation.hashtags = creation.hashtags ?? [];
  const added: string[] = [];
  for (const name of hashtagNames) {
    if (!creation.hashtags.includes(name)) {
      creation.hashtags.push(name);
    }
    const record = ensureHashtagRecord(name);
    if (!record.creationIds.has(creationId)) {
      record.creationIds.add(creationId);
      record.count += 1;
      record.updatedAt = new Date().toISOString();
    }
    added.push(record.name);
  }
  return added;
};

export const mockGetHashtagsForCreation = (creationId: string): Hashtag[] => {
  const creation = getCreationById(creationId);
  if (!creation || !creation.hashtags) {
    return [];
  }
  return creation.hashtags.map((name) => {
    const record = ensureHashtagRecord(name);
    return {
      id: record.id,
      name: record.name,
      count: record.count,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  });
};

export const mockGetCreationsByHashtag = (hashtagName: string, limit: number): string[] => {
  const record = hashtagStore.get(hashtagName.toLowerCase());
  if (!record) return [];
  return Array.from(record.creationIds).slice(0, limit);
};

export const mockGetTrendingHashtags = (limit: number): Hashtag[] =>
  [...hashtagStore.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((record) => ({
      id: record.id,
      name: record.name,
      count: record.count,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }));

export const mockSearchHashtags = (query: string, limit: number): Hashtag[] => {
  const normalized = query.toLowerCase().replace('#', '');
  if (!normalized) return [];
  return [...hashtagStore.values()]
    .filter((record) => record.name.includes(normalized))
    .slice(0, limit)
    .map((record) => ({
      id: record.id,
      name: record.name,
      count: record.count,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }));
};

export const mockGetHashtagByName = (name: string): Hashtag | null => {
  const record = hashtagStore.get(name.toLowerCase());
  if (!record) return null;
  return {
    id: record.id,
    name: record.name,
    count: record.count,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
};

export const mockBuildFeedResponse = (limit: number) => {
  const creations = mockGetTrendingCreations(limit);
  return {
    items: creations.map((creation) => ({
      id: creation.id,
      creation,
      source: 'fallback' as const,
    })),
    nextCursor: null,
    source: 'fallback' as const,
  };
};
