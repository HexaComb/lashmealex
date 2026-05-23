import { notFound } from "next/navigation";

import { getProductImageObject } from "@/lib/product-images";

interface ProductImageRouteProps {
  params: Promise<{
    key: string[];
  }>;
}

/**
 * Streams a product image out of R2 through the app runtime.
 */
export async function GET(_request: Request, context: ProductImageRouteProps) {
  const { key } = await context.params;

  if (!key || key.length === 0) {
    notFound();
  }

  const objectKey = key.map((segment) => decodeURIComponent(segment)).join("/");
  const object = await getProductImageObject(objectKey);

  if (!object) {
    notFound();
  }

  const headers = new Headers();
  headers.set("content-type", object.contentType);
  headers.set("etag", object.etag);
  headers.set("cache-control", "public, max-age=31536000, immutable");

  return new Response(Buffer.from(object.body), { headers });
}
