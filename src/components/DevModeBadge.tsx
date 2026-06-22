import { APP_ENV, IS_PRODUCTION } from "@/lib/firebase";

/**
 * Small fixed badge shown in every non-production build so it's always obvious
 * which Firebase environment the app is talking to. Renders nothing in prod.
 */
const DevModeBadge = () => {
  if (IS_PRODUCTION) return null;

  return (
    <div
      className="fixed bottom-3 right-3 z-[9999] select-none rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-black shadow-lg"
      title={`Running against the ${APP_ENV} Firebase environment`}
    >
      {APP_ENV.toUpperCase()} ENV
    </div>
  );
};

export default DevModeBadge;
