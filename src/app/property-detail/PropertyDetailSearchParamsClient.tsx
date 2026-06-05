"use client";

import { useSearchParams } from "next/navigation";
import PropertyDetailClient from "./PropertyDetailClient";

export default function PropertyDetailSearchParamsClient() {
  const searchParams = useSearchParams();
  const propertyId = searchParams.get("id") ?? "";

  return <PropertyDetailClient propertyId={propertyId} />;
}