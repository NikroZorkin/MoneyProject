import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  // External packages that shouldn't be bundled by Turbopack
  serverExternalPackages: ['pdf-parse'],
};

export default withNextIntl(nextConfig);
