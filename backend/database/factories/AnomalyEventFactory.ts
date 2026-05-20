import { faker } from "@faker-js/faker";

export type AnomalyEventFactoryAttributes = {
  id?: number;
  user_id: number;
  event_type:
    | "touching_plant"
    | "touching_animal"
    | "plucking_plants"
    | "hitting_animal"
    | "extended_plant_touch"
    | "extended_animal_touch"
    | "forest_fire"
    | "flooding"
    | "loud_noise"
    | "trespassing";
  metadata?: Record<string, any> | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
};

const SARAWAK_PARK_LOCATIONS = [
  "Talang Satang National Park - Zone A",
  "Talang Satang National Park - Zone B",
  "Talang Satang National Park - Zone C",

  "Santubong National Park - Zone A",
  "Santubong National Park - Zone B",
  "Santubong National Park - Zone C",

  "Bako National Park - Zone A",
  "Bako National Park - Zone B",
  "Bako National Park - Zone C",

  "Selabat Mudflats Nature Reserve - Zone A",
  "Selabat Mudflats Nature Reserve - Zone B",
  "Selabat Mudflats Nature Reserve - Zone C",

  "Sama Jaya Nature Reserve - Zone A",
  "Sama Jaya Nature Reserve - Zone B",
  "Sama Jaya Nature Reserve - Zone C",

  "Semenggoh Nature Reserve - Zone A",
  "Semenggoh Nature Reserve - Zone B",
  "Semenggoh Nature Reserve - Zone C",

  "Bungo Range National Park - Zone A",
  "Bungo Range National Park - Zone B",
  "Bungo Range National Park - Zone C",

  "Dered Krian National Park - Zone A",
  "Dered Krian National Park - Zone B",
  "Dered Krian National Park - Zone C",

  "Wind Cave and Fairy Cave Nature Reserve - Zone A",
  "Wind Cave and Fairy Cave Nature Reserve - Zone B",
  "Wind Cave and Fairy Cave Nature Reserve - Zone C",

  "Kuching Wetland National Park - Zone A",
  "Kuching Wetland National Park - Zone B",
  "Kuching Wetland National Park - Zone C",

  "Pulau Tukong Ara-Banun Wildlife Sanctuary - Zone A",
  "Pulau Tukong Ara-Banun Wildlife Sanctuary - Zone B",
  "Pulau Tukong Ara-Banun Wildlife Sanctuary - Zone C",
];

export type AnomalyEventFactoryInput = Partial<AnomalyEventFactoryAttributes>;

/**
 * Generates a single ComplianceEvent attributes object for seeding purposes.
 * @param userId User ID associated with the event
 * @param overrides Attributes to override
 * @returns ComplianceEvent attributes object
 */
export const buildComplianceEvent = (
  userId: number,
  overrides: AnomalyEventFactoryInput = {},
): AnomalyEventFactoryAttributes => {
  const eventTypesWithSeverity: Array<{
    type:
      | "plucking_plants"
      | "hitting_animal"
      | "extended_plant_touch"
      | "extended_animal_touch"
      | "forest_fire"
      | "flooding"
      | "loud_noise"
      | "trespassing";
  }> = [
    {
      type: "plucking_plants",
    },
    {
      type: "hitting_animal",
    },
    {
      type: "extended_plant_touch",
    },
    {
      type: "extended_animal_touch",
    },
    {
      type: "forest_fire",
    },
    {
      type: "loud_noise",
    },
    {
      type: "trespassing",
    },
    {
      type: "flooding",
    },
  ];

  const selectedEvent = faker.helpers.arrayElement(eventTypesWithSeverity);

  const defaultEvent: AnomalyEventFactoryAttributes = {
    user_id: userId,
    event_type: selectedEvent.type,
    location: faker.helpers.arrayElement(SARAWAK_PARK_LOCATIONS),
    metadata: {
      frame_number: faker.number.int({ min: 1, max: 10000 }),
      detection_confidence: faker.number.float({ min: 0.5, max: 0.99 }),
      pose_keypoints_detected: faker.number.int({ min: 10, max: 17 }),
    },
    latitude: faker.location.latitude({ min: 1.45, max: 1.6 }), // Kuching latitude
    longitude: faker.location.longitude({ min: 110.3, max: 110.45 }), // Kuching longitude
  };

  return {
    ...defaultEvent,
    ...overrides,
  };
};

/**
 * Generates an array of ComplianceEvent attributes for seeding purposes.
 * @param userId User ID associated with the events
 * @param count Number of events to generate
 * @param overrides Attributes to override
 * @returns Array of ComplianceEvent attributes
 */
export const buildComplianceEvents = (
  userId: number,
  count: number,
  overrides: AnomalyEventFactoryInput = {},
): AnomalyEventFactoryAttributes[] => {
  const events: AnomalyEventFactoryAttributes[] = [];

  for (let i = 0; i < count; i++) {
    events.push(buildComplianceEvent(userId, overrides));
  }

  return events;
};
