const FACILITIES = [
  ["Pool", "Lap lanes, rooftop dips, and a beach when the hotel has one."],
  ["Wi-Fi", "A connection that holds up for a call and a late checkout."],
  ["Spa", "Steam, massage, and a quiet room after the flight."],
  ["Fitness", "Weights and a treadmill that are not an afterthought."],
  ["Dining", "Breakfast in the rate, or a kitchen worth staying in for."],
  ["Front desk", "Someone awake when the flight lands after midnight."],
  ["Parking", "A space on site, or one you can reserve nearby."],
  ["Family rooms", "Beds for more than two, without a surprise sofa."],
] as const;

const STORIES = [
  {
    quote:
      "We compared three rooms on the map, prebooked the refundable one, and the price on the confirmation matched.",
    name: "Amaka Obi",
    place: "Lagos to Lisbon",
  },
  {
    quote:
      "The dates and guest count stayed with me from the homepage to the room list. I did not have to search twice.",
    name: "Jonah Ellis",
    place: "Two nights in Rome",
  },
  {
    quote:
      "I wanted a pool and a desk that answered the phone. Both were on the hotel page before I paid.",
    name: "Leila Haddad",
    place: "A week in Dubai",
  },
] as const;

export function Facilities() {
  return (
    <section id="facilities" className="bg-sand">
      <div className="mx-auto w-full max-w-6xl px-5 py-16 md:px-8 md:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-clay">
          Facilities
        </p>
        <h2 className="mt-2 max-w-2xl font-display text-4xl tracking-tight md:text-5xl">
          What a good hotel should already have.
        </h2>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FACILITIES.map(([title, copy]) => (
            <li key={title} className="rounded-3xl bg-paper p-5">
              <FacilityMark />
              <h3 className="mt-4 font-display text-2xl">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-neutral-500">{copy}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Testimonials() {
  return (
    <section
      id="stories"
      className="mx-auto w-full max-w-6xl px-5 py-16 md:px-8 md:py-24"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-clay">
        Guest notes
      </p>
      <h2 className="mt-2 font-display text-4xl tracking-tight md:text-5xl">
        Stays people would book again.
      </h2>
      <ul className="mt-10 grid gap-4 md:grid-cols-3">
        {STORIES.map((story) => (
          <li
            key={story.name}
            className="flex flex-col rounded-3xl bg-white p-6 ring-1 ring-ink/8"
          >
            <p className="font-display text-5xl leading-none text-clay">“</p>
            <blockquote className="mt-3 flex-1 text-lg leading-7">
              {story.quote}
            </blockquote>
            <footer className="mt-6 text-sm">
              <p className="font-semibold">{story.name}</p>
              <p className="text-neutral-500">{story.place}</p>
            </footer>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function HowItWorks() {
  const steps = [
    ["Search", "Set a city, the nights, and who is coming."],
    ["Compare", "Filter the list and read the same hotels on the map."],
    [
      "Choose",
      "Open a hotel and pick a room rate with its cancellation terms.",
    ],
    ["Confirm", "Prebook the offer, then send the guest details to book it."],
  ];

  return (
    <section id="how-it-works" className="bg-ink text-sand">
      <div className="mx-auto w-full max-w-6xl px-5 py-16 md:px-8 md:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
          How it works
        </p>
        <h2 className="mt-2 max-w-xl font-display text-4xl tracking-tight text-white md:text-5xl">
          From a city name to a confirmed room.
        </h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-4">
          {steps.map(([title, copy], index) => (
            <li key={title}>
              <p className="font-display text-3xl text-gold">{`0${index + 1}`}</p>
              <h3 className="mt-3 text-xl text-white">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-neutral-500">{copy}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Editorial() {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-16 md:px-8 md:py-24">
      <div className="relative overflow-hidden rounded-[2rem] min-h-[420px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=2000&q=80"
          alt="A hotel pool at dusk"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-ink/45" />
        <div className="relative flex min-h-[420px] flex-col justify-end p-8 text-white md:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/75">
            The stay
          </p>
          <h2 className="mt-3 max-w-lg font-display text-4xl leading-tight md:text-6xl">
            A room is easier to trust when the map and the price agree.
          </h2>
        </div>
      </div>
    </section>
  );
}

function FacilityMark() {
  return (
    <span
      className="grid h-10 w-10 place-items-center rounded-full bg-pine text-sand"
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      >
        <path
          d="M4 18V8m0 10h16M8 18V6h8v12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
