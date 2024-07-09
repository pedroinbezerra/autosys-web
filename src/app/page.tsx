"use client";

import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter();
  if (typeof window != "undefined") router.push('/login');
}
