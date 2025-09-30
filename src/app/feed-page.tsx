import { cookies, headers } from 'next/headers';
import { getInitialFeedAction } from '@/features/feed/server/actions';
import { FEED_PAGE_SIZE, isFeedRefreshEnabled } from '@/features/feed/config';
import FeedScreen from '@/components/screens/feed-screen';

const deriveRegion = async () => {
  const headerList = await headers();
  return headerList.get('x-vercel-ip-country') ?? headerList.get('x-region') ?? null;
};

const deriveLocale = async () => {
  const cookieStore = await cookies();
  return cookieStore.get('NEXT_LOCALE')?.value ?? null;
};

export default async function FeedPage() {
  const [region, locale] = await Promise.all([deriveRegion(), deriveLocale()]);
  const initialFeed = await getInitialFeedAction({
    region: region ?? undefined,
    locale: locale ?? undefined,
    limit: FEED_PAGE_SIZE,
  });

  const refreshEnabled = isFeedRefreshEnabled();

  return <FeedScreen initialFeed={initialFeed} region={region} locale={locale} refreshEnabled={refreshEnabled} />;
}
