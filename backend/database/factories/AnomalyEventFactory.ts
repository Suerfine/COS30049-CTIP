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
  latitude?: number | null;
  longitude?: number | null;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
};

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
  }> = [
    {
      type: "touching_plant",
    },
    {
      type: "touching_animal",
    },
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
  ];

  const selectedEvent = faker.helpers.arrayElement(eventTypesWithSeverity);

  const defaultEvent: AnomalyEventFactoryAttributes = {
    user_id: userId,
    event_type: selectedEvent.type,
    metadata: {
      frame_number: faker.number.int({ min: 1, max: 10000 }),
      detection_confidence: faker.number.float({ min: 0.5, max: 0.99 }),
      pose_keypoints_detected: faker.number.int({ min: 10, max: 17 }),
    },
    latitude: faker.location.latitude({ min: 1.3, max: 1.6 }), // Malaysia coordinates
    longitude: faker.location.longitude({ min: 101, max: 104 }), // Malaysia coordinates
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
