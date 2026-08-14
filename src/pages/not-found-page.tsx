import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="px-8 py-16 text-center">
      <h1 className="text-3xl font-bold">This page isn’t here.</h1>
      <p className="mt-2 text-[15px] text-muted-foreground">Check the link, or go back to the feed.</p>
      <Link to="/" className="mt-4 inline-block text-sm underline">
        Back to feed
      </Link>
    </div>
  );
}
