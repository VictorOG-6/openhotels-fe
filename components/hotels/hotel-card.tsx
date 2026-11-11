import Link from "next/link";

import { Photo, Stars } from "@/components/hotels/photo";
import { formatMoney, scoreOutOfTen } from "@/lib/hotels/format";
import type { StayHotel } from "@/lib/hotels/types";
import { cn } from "@/lib/utils";

export default function HotelCard({
  hotel,
  href,
  nights,
  active = false,
  onHover,
}: {
  hotel: StayHotel;
  href: string;
  nights: number;
  active?: boolean;
  onHover?: (id: string | null) => void;
}) {
  const score = scoreOutOfTen(hotel.rating);
  const place = [hotel.city, hotel.country].filter(Boolean).join(", ");

  return (
    <article
      id={`stay-${hotel.id}`}
      onMouseEnter={() => onHover?.(hotel.id)}
      onMouseLeave={() => onHover?.(null)}
      className={cn(
        "scroll-mt-48 overflow-hidden rounded-3xl bg-white ring-1 ring-ink/8 transition",
        active && "ring-2 ring-ink",
      )}
    >
      <Link href={href} className="grid grid-cols-1 sm:grid-cols-[220px_minmax(0,1fr)]">
        <div className="relative h-52 sm:h-full sm:min-h-44">
          <Photo src={hotel.image} alt="" className="absolute inset-0" />
        </div>
        <div className="flex flex-col gap-3 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              {place ? <p className="text-sm text-muted">{place}</p> : null}
              <h3 className="font-display text-2xl leading-tight">{hotel.name}</h3>
            </div>
            {score != null ? (
              <p className="rounded-full bg-sand px-2.5 py-1 text-sm font-semibold">
                {score.toFixed(1)}
                {hotel.reviewCount ? (
                  <span className="font-normal text-muted"> ({hotel.reviewCount})</span>
                ) : null}
              </p>
            ) : null}
          </div>
          {hotel.description ? (
            <p className="line-clamp-2 text-sm leading-6 text-muted">{hotel.description}</p>
          ) : null}
          <div className="mt-auto flex items-end justify-between gap-3">
            <div className="space-y-1">
              <Stars value={hotel.stars} />
              {hotel.refundable === true ? (
                <p className="text-xs font-medium text-pine">Refundable rate</p>
              ) : hotel.refundable === false ? (
                <p className="text-xs text-muted">Non-refundable</p>
              ) : null}
            </div>
            <p className="text-right">
              {hotel.price != null ? (
                <>
                  <span className="text-lg font-semibold">
                    {formatMoney(hotel.price, hotel.currency || "USD")}
                  </span>
                  <span className="block text-xs text-muted">
                    total{nights > 0 ? ` · ${nights} night${nights === 1 ? "" : "s"}` : ""}
                  </span>
                </>
              ) : (
                <span className="text-sm font-medium">See rooms</span>
              )}
            </p>
          </div>
        </div>
      </Link>
    </article>
  );
}
