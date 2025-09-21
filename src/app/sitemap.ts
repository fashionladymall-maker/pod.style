import { MetadataRoute } from 'next'
 
export default function sitemap(): MetadataRoute.Sitemap {
  
  // In the future, you can fetch dynamic routes from your database
  // const posts = await db.posts.findMany()
  // const postRoutes = posts.map((post) => ({
  //   url: `https://pod.style/blog/${post.slug}`,
  //   lastModified: post.updatedAt,
  // }))

  const staticRoutes = [
    '',
    '/admin'
  ];

  const routes = staticRoutes.map((route) => ({
    url: `https://pod.style${route}`,
    lastModified: new Date().toISOString(),
  }));
 
  return routes;
}