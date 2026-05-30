import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ margin: "48px 22px", maxWidth: "640px" }}>
      <p className="eyebrow">404</p>
      <h1>That bench is empty.</h1>
      <p>This page is not in the workshop yet.</p>
      <Link className="button button-light" href="/">
        Back to the floor
      </Link>
    </main>
  );
}
