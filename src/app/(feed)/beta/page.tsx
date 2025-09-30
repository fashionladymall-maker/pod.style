import { redirect } from 'next/navigation';
import { isFeedBetaEnabled } from '@/features/feed/config';
import FeedPage from '../../feed-page';

export default async function FeedBetaPage() {
  if (!isFeedBetaEnabled()) {
    redirect('/');
  }
  return <FeedPage />;
}
