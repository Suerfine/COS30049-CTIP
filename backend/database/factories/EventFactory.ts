import { faker } from "@faker-js/faker";
import { EventStatus } from "../../src/enum/EventStatus";
import { EventType } from "../../src/enum/EventType";

export type EventFactoryAttributes = {
  id?: number;
  user_id: number;

  title: string;
  description: string;

  event_start_at: Date;
  event_end_at: Date;

  type: EventType;

  status?: EventStatus;

  period_frequency?: number;
  period_unit?: "day" | "week" | "month";

  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
};

export type EventFactoryInput = Partial<EventFactoryAttributes>;

const eventTemplates = [
  {
    title: "Complete daily wildlife observation log",
    description:
      "Record species sightings and update biodiversity tracking system.",
  },
  {
    title: "Inspect mangrove restoration site",
    description:
      "Evaluate plant health and document survival rate of seedlings.",
  },
  {
    title: "Prepare workshop training materials",
    description:
      "Organize slides and field notes for upcoming conservation workshop.",
  },
  {
    title: "Review camera trap footage",
    description:
      "Identify wildlife activity and tag important conservation data.",
  },
  {
    title: "Update environmental data records",
    description:
      "Ensure field data is correctly entered into the system database.",
  },
  {
    title: "Coordinate field team schedule",
    description:
      "Assign tasks and ensure equipment readiness for field deployment.",
  },
];

const buildEventContent = () => faker.helpers.arrayElement(eventTemplates);

export const buildEvent = (
  overrides: EventFactoryInput = {}
): EventFactoryAttributes => {
  const type =
    overrides.type ??
    faker.helpers.arrayElement(Object.values(EventType));

  const status =
    overrides.status ?? EventStatus.PENDING;

  const base = buildEventContent();

  const start = faker.date.soon({ days: 10 });
  const end = new Date(start);
  end.setHours(end.getHours() + faker.number.int({ min: 1, max: 6 }));

  return {
    user_id: overrides.user_id ?? faker.number.int({ min: 1, max: 50 }),

    title: overrides.title ?? base.title,
    description: overrides.description ?? base.description,

    event_start_at: overrides.event_start_at ?? start,
    event_end_at: overrides.event_end_at ?? end,

    type,
    status,

    period_frequency: overrides.period_frequency ?? 0,
    period_unit: overrides.period_unit ?? "day",

    ...overrides,
  };
};

export const buildEvents = (
  count: number,
  overrides: EventFactoryInput = {}
): EventFactoryAttributes[] => {
  return Array.from({ length: count }, (_, i) =>
    buildEvent({
      ...overrides,
    })
  );
};

export default {
  buildEvent,
  buildEvents,
};