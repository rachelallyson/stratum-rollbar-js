import { notFound } from "next/navigation";
import { generateStaticParamsFor, importPage } from "nextra/pages";
import { getMDXComponents } from "../../mdx-components";

const STATIC_ASSET_PATTERNS = [
  "favicon.ico",
  "apple-touch-icon.png",
  "apple-touch-icon-precomposed.png",
];

function isStaticAssetPath(mdxPath: string[]): boolean {
  const first = mdxPath[0];
  if (!first) return false;
  if (STATIC_ASSET_PATTERNS.includes(first)) return true;
  if (first.startsWith("_")) return true;
  if (/\.(ico|png|jpg|jpeg|svg|webp|gif)$/i.test(first)) return true;
  return mdxPath.some((seg) => /\.(js|mjs|cjs|css|json|wasm)$/i.test(seg));
}

export const generateStaticParams = generateStaticParamsFor("mdxPath");

export async function generateMetadata(props: {
  params: Promise<{ mdxPath?: string[] }>;
}) {
  const params = await props.params;
  const pathSegments = params.mdxPath ?? [];
  if (isStaticAssetPath(pathSegments)) {
    return {};
  }
  const { metadata } = await importPage(pathSegments);
  return metadata;
}

const Wrapper = getMDXComponents().wrapper;

export default async function ContentPage(props: {
  params: Promise<{ mdxPath?: string[] }>;
}) {
  const params = await props.params;
  const pathSegments = params.mdxPath ?? [];
  if (isStaticAssetPath(pathSegments)) {
    notFound();
  }
  const result = await importPage(pathSegments);
  const { default: MDXContent, toc, metadata, sourceCode } = result;
  return (
    <Wrapper toc={toc} metadata={metadata} sourceCode={sourceCode}>
      <MDXContent params={params} />
    </Wrapper>
  );
}
