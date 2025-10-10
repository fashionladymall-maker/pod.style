'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useContext, useEffect, useState, type ChangeEvent } from 'react';
import type { Creation } from '@/lib/types';
import { generatePatternAction } from '@/features/creations/server/actions';
import { AuthContext } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';

const STYLE_OPTIONS = ['可爱', '酷炫', '简约', '复古', '未来', '自然'];
const GUEST_STORAGE_KEY = 'podstyle_guest_user';

const ensureGuestId = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  const existing = window.localStorage.getItem(GUEST_STORAGE_KEY);
  if (existing) {
    return existing;
  }
  const generated = window.crypto?.randomUUID
    ? `guest-${window.crypto.randomUUID()}`
    : `guest-${Math.random().toString(36).slice(2, 10)}`;
  window.localStorage.setItem(GUEST_STORAGE_KEY, generated);
  return generated;
};

export default function CreatePage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useContext(AuthContext);

  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<string>(STYLE_OPTIONS[0]);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [latestCreation, setLatestCreation] = useState<Creation | null>(null);

  useEffect(() => {
    if (guestId) {
      return;
    }
    const id = ensureGuestId();
    if (id) {
      setGuestId(id);
    }
  }, [guestId]);

  const resolvedUserId = auth?.user?.uid ?? guestId;

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setUploadedImage(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const result = readerEvent.target?.result;
      if (typeof result === 'string') {
        setUploadedImage(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && !uploadedImage) {
      toast({
        variant: 'destructive',
        title: '请提供创作灵感',
        description: '输入描述或上传参考图片后再试一次。',
      });
      return;
    }
    if (!resolvedUserId) {
      toast({
        variant: 'destructive',
        title: '暂无法生成',
        description: '正在初始化会话，请稍后重试或登录账户。',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const creation = await generatePatternAction({
        userId: resolvedUserId,
        prompt: prompt.trim() || '灵感来自图片',
        style: selectedStyle,
        referenceImage: uploadedImage ?? undefined,
      });

      setLatestCreation(creation);
      toast({
        title: '生成成功',
        description: '新的设计已添加到您的灵感库。',
      });
      setPrompt('');
      setUploadedImage(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : '生成过程中出现问题，请稍后再试。';
      toast({
        variant: 'destructive',
        title: '生成失败',
        description: message,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10">
        <header>
          <h1 className="text-3xl font-bold">创建设计</h1>
          <p className="mt-2 text-sm text-zinc-400">描述灵感或上传参考图片，AI 将为你生成新的商品图案。</p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-6">
            <section>
              <label className="mb-2 block text-sm font-medium">描述你的设计</label>
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="例如：万圣节骷髅头可爱风格..."
                className="h-32 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isGenerating}
              />
            </section>

            <section>
              <label className="mb-3 block text-sm font-medium">选择风格</label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {STYLE_OPTIONS.map((style) => {
                  const isActive = selectedStyle === style;
                  return (
                    <button
                      key={style}
                      type="button"
                      onClick={() => setSelectedStyle(style)}
                      className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                        isActive
                          ? 'border-blue-400 bg-blue-500/20 text-blue-200'
                          : 'border-zinc-700 bg-zinc-800 hover:bg-zinc-700'
                      }`}
                      disabled={isGenerating}
                    >
                      {style}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="space-y-3">
              <label className="block text-sm font-medium">或上传图片</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full cursor-pointer rounded-lg border border-dashed border-zinc-700 bg-zinc-900 px-4 py-3 text-sm file:mr-4 file:cursor-pointer file:rounded-md file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-white hover:file:bg-blue-700"
                disabled={isGenerating}
              />
              {uploadedImage && (
                <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
                  <Image
                    src={uploadedImage}
                    alt="已上传的参考图片"
                    width={400}
                    height={400}
                    className="h-48 w-full object-cover"
                  />
                </div>
              )}
            </section>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full rounded-lg bg-blue-600 py-3 font-medium transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-zinc-700"
            >
              {isGenerating ? '生成中...' : '生成设计'}
            </button>
          </div>

          <aside className="space-y-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <h2 className="text-lg font-semibold">进度提示</h2>
              <ul className="mt-3 space-y-2 text-sm text-zinc-400">
                <li>• 支持 prompt + 图片双重灵感</li>
                <li>• 未登录用户将作为访客保存创作</li>
                <li>• 生成完成后可在首页的灵感库查看</li>
              </ul>
            </div>

            {latestCreation && (
              <div className="space-y-3 rounded-xl border border-blue-500/40 bg-blue-500/10 p-5">
                <h3 className="text-base font-semibold text-blue-100">最新生成</h3>
                <p className="text-sm text-blue-200/80">{latestCreation.summary ?? latestCreation.prompt}</p>
                {latestCreation.patternUri && (
                  <Image
                    src={latestCreation.patternUri}
                    alt={latestCreation.prompt}
                    width={400}
                    height={400}
                    className="h-48 w-full rounded-lg object-cover"
                  />
                )}
                <button
                  type="button"
                  className="w-full rounded-lg border border-blue-400/60 py-2 text-sm font-medium text-blue-100 transition-colors hover:bg-blue-500/20"
                  onClick={() => router.push('/')}
                >
                  查看我的创作
                </button>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
