import { BUILD_ID } from '@/lib/build-id';

// Always answered by the live deployment: the installed app compares this to
// the build it is running and reloads itself when they differ.
export const dynamic = 'force-dynamic';

export function GET() {
  return Response.json(
    { build: BUILD_ID },
    { headers: { 'Cache-Control': 'no-store, must-revalidate' } },
  );
}
