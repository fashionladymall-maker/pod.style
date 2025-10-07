'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Order {
  id: string;
  status: string;
  createdAt: Date;
  total: number;
  items: number;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: 从 Firestore 加载订单
    const loadOrders = async () => {
      try {
        // 模拟数据
        setOrders([
          {
            id: 'order-1',
            status: 'delivered',
            createdAt: new Date('2025-10-01'),
            total: 299,
            items: 2,
          },
          {
            id: 'order-2',
            status: 'shipping',
            createdAt: new Date('2025-10-05'),
            total: 199,
            items: 1,
          },
        ]);
      } catch (error) {
        console.error('加载订单失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      created: '已创建',
      paid: '已支付',
      printing: '打印中',
      shipping: '配送中',
      delivered: '已送达',
      returned: '已退货',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      created: 'text-gray-400',
      paid: 'text-blue-400',
      printing: 'text-yellow-400',
      shipping: 'text-purple-400',
      delivered: 'text-green-400',
      returned: 'text-red-400',
    };
    return colorMap[status] || 'text-gray-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>加载订单中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">我的订单</h1>

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">暂无订单</p>
            <Link
              href="/"
              className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              去逛逛
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block bg-zinc-800 border border-zinc-700 rounded-lg p-6 hover:bg-zinc-750 transition-colors"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm text-gray-400">订单号</p>
                    <p className="font-mono">{order.id}</p>
                  </div>
                  <div className={`font-medium ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <div className="text-gray-400">
                    {order.createdAt.toLocaleDateString('zh-CN')}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-400">{order.items} 件商品</span>
                    <span className="text-lg font-bold">¥{order.total}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

