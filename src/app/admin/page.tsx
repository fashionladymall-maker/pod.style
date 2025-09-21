// src/app/admin/page.tsx

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function AdminPage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <Card>
            <CardHeader>
              <CardTitle>后台管理</CardTitle>
              <CardDescription>
                在这里管理您的订单和客户信息。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>欢迎来到您的管理后台。后续功能将在这里展开。</p>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
