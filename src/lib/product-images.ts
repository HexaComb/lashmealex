import "server-only";

import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 credentials are not configured (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)");
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

function getBucketName() {
  const bucket = process.env.R2_BUCKET_NAME ?? "product-images";
  return bucket;
}

/**
 * Builds the app-local delivery URL for an R2-backed product image.
 */
export function getProductImagePath(key: string) {
  return `/images/${key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")}`;
}

/**
 * Fetches a product image object from R2.
 */
export async function getProductImageObject(objectKey: string) {
  const client = getR2Client();
  const response = await client.send(
    new GetObjectCommand({
      Bucket: getBucketName(),
      Key: objectKey,
    }),
  );

  if (!response.Body) {
    return null;
  }

  const bytes = await response.Body.transformToByteArray();
  return {
    body: bytes,
    contentType: response.ContentType ?? "application/octet-stream",
    etag: response.ETag ?? "",
  };
}

/**
 * Uploads a product image to R2 and returns the app-local image path.
 */
export async function putProductImage(
  objectKey: string,
  bytes: ArrayBuffer,
  contentType: string,
): Promise<string> {
  const client = getR2Client();
  await client.send(
    new PutObjectCommand({
      Bucket: getBucketName(),
      Key: objectKey,
      Body: new Uint8Array(bytes),
      ContentType: contentType || "application/octet-stream",
    }),
  );

  return getProductImagePath(objectKey);
}
