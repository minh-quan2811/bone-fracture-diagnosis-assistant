import Link from "next/link";

export default function Home() {
  return (
    <div>
      <h1>Bone Fracture Helper (Frontend)</h1>
      <p>
        <Link href="/login">Go to Login</Link>
      </p>
    </div>
  );
}
