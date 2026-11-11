"use client";

import { ArrowUpRight, Compass } from "lucide-react";
import type { BrandRecommendation } from "@/lib/brand-recommendations";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function ExploreBrands({
  brands, personalized, historyError, hasVisits, clearing, onClearHistory,
}: {
  brands: BrandRecommendation[];
  personalized: boolean;
  historyError: string | null;
  hasVisits: boolean;
  clearing: boolean;
  onClearHistory: () => void;
}) {
  return (
    <section aria-labelledby="explore-heading" className="flex flex-col gap-6">
      <div>
        <p className="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {personalized ? "Picked for your closet" : "Places to start"}
        </p>
        <h2 id="explore-heading" className="font-space-grotesk text-3xl font-medium tracking-tight">Explore brands</h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
          {personalized
            ? "Brands you've saved or explored, plus similar shops to try."
            : "Save a few pieces or open a shop below. Your suggestions will grow from there."}
        </p>
      </div>
      {historyError && (
        <Alert variant="destructive">
          <AlertDescription>
            {historyError}
            <Button type="button" variant="link" size="sm" onClick={() => window.location.reload()}>Reload to retry</Button>
          </AlertDescription>
        </Alert>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {brands.map((brand) => (
          <Card key={brand.domain} role="article" aria-label={brand.name} className="gap-0 p-5 sm:p-6">
            <div className="mb-6 flex items-start justify-between gap-3">
              <Compass aria-hidden="true" className="h-6 w-6 text-primary" />
              <Badge variant={brand.kind === "familiar" ? "secondary" : "outline"}>
                {brand.kind === "familiar" ? "Familiar" : brand.kind === "discover" ? "Discover" : "Start here"}
              </Badge>
            </div>
            <h3 className="text-xl font-medium">{brand.name}</h3>
            <p className="mt-1 break-all text-xs text-muted-foreground">{brand.domain}</p>
            <p className="mb-6 mt-4 flex-1 text-sm leading-6 text-muted-foreground">{brand.reason}</p>
            <Button asChild variant="outline" className="w-full">
              <a href={brand.url} target="_blank" rel="noopener noreferrer" data-shopping-link>
                Shop {brand.name} <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
              </a>
            </Button>
          </Card>
        ))}
      </div>
      {personalized && brands.length < 4 && (
        <p className="text-sm text-muted-foreground">Save a few more pieces to help us find similar new shops.</p>
      )}
      <Card className="gap-3 p-5 text-sm text-muted-foreground">
        <p>
          Suggestions match your saved pieces and your last 30 days of in-app shop visits against a curated brand directory.
          We record only the shop&apos;s domain and visit time—not product URLs or browsing outside Closetful.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" size="sm" disabled={clearing || (!hasVisits && !historyError)} onClick={onClearHistory}>
            {clearing ? "Clearing..." : "Clear click history"}
          </Button>
          <span className="text-xs">Your saved pieces stay in your closet.</span>
        </div>
      </Card>
    </section>
  );
}
