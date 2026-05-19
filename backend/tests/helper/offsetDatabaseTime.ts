import sequelize from "../../src/config/Database";

// Import all models to register them with sequelize
import "../../src/models";
import { logger } from "../../src/utils/logger";
import { DataTypes, Model, ModelStatic } from "sequelize";

/**
 * Offset all datetime attributes in the database by a specified amount.
 * This is useful for testing time-based functionality.
 *
 * @param offsetMs - The offset in milliseconds (can be positive or negative)
 */
export async function offsetDatabaseTime(offsetMs: number): Promise<void> {
  // Automatically discover all models from the sequelize instance
  const models = Object.values(sequelize.models) as ModelStatic<Model>[];

  let totalRecordsUpdated = 0;

  for (const model of models) {
    try {
      // Find all records for this model
      const records = await model.findAll({ raw: false });
      const dateFields = Object.entries(model.rawAttributes)
        .filter(([, attribute]) => {
          const attributeType = attribute.type as { key?: string } | undefined;
          return (
            attributeType?.key === DataTypes.DATE.key ||
            attributeType?.key === DataTypes.DATEONLY.key
          );
        })
        .map(([fieldName]) => fieldName);

      let recordsUpdatedInModel = 0;

      for (const record of records) {
        let hasChanges = false;

        // Iterate through declared date fields instead of runtime values.
        for (const fieldName of dateFields) {
          const currentValue = record.getDataValue(fieldName);

          if (currentValue === null || currentValue === undefined) {
            continue;
          }

          const currentDate =
            currentValue instanceof Date
              ? currentValue
              : new Date(currentValue);

          if (Number.isNaN(currentDate.getTime())) {
            continue;
          }

          const offsetDate = new Date(currentDate.getTime() + offsetMs);
          record.setDataValue(fieldName, offsetDate);
          (record as any).changed(fieldName, true);
          hasChanges = true;
        }

        // Save the record if there were any changes
        if (hasChanges) {
          await record.save({ silent: true });
          recordsUpdatedInModel++;
        }
      }

      if (recordsUpdatedInModel > 0) {
        console.log(
          `✓ Updated ${recordsUpdatedInModel} records in ${model.name}`,
        );
        totalRecordsUpdated += recordsUpdatedInModel;
      }
    } catch (error) {
      logger.warn(`Skipped ${model.name}: ${(error as Error).message}`);
    }
  }

  logger.info(
    `\n⏰ Successfully offset all database times by ${offsetMs}ms (${(offsetMs / 1000 / 60 / 60).toFixed(2)} hours)`,
  );
  logger.info(`📊 Total records updated: ${totalRecordsUpdated}`);
}

// If this script is run directly
const args = process.argv.slice(2);
function parseDirectRunOffset(inputArgs: string[]): number {
  const normalizedInput = inputArgs.join("").replace(/\s+/g, "").toUpperCase();

  if (!normalizedInput) {
    throw new Error("Please provide an offset value.");
  }

  if (/^-?\d+$/.test(normalizedInput)) {
    return Number(normalizedInput);
  }

  const tokenPattern = /([+-]?\d+)([DMH])/g;
  let match: RegExpExecArray | null;
  let matchedLength = 0;
  let offsetMs = 0;

  while ((match = tokenPattern.exec(normalizedInput)) !== null) {
    const amount = Number(match[1]);
    const unit = match[2];

    matchedLength += match[0].length;

    switch (unit) {
      case "D":
        offsetMs += amount * 24 * 60 * 60 * 1000;
        break;
      case "H":
        offsetMs += amount * 60 * 60 * 1000;
        break;
      case "M":
        offsetMs += amount * 60 * 1000;
        break;
      default:
        throw new Error(`Unsupported unit: ${unit}`);
    }
  }

  if (matchedLength !== normalizedInput.length) {
    throw new Error(
      "Invalid offset format. Use a combination like 1D2H30M or a plain millisecond value.",
    );
  }

  return offsetMs;
}

if (args.length > 0 && !args[0].startsWith("--")) {
  let offsetMs: number;

  try {
    offsetMs = parseDirectRunOffset(args);
  } catch (error) {
    logger.error(`Error: ${(error as Error).message}`);
    logger.error("Usage: npm run zawarudo -- <offset>");
    logger.error(
      "Examples: npm run zawarudo -- 1D2H30M | npm run zawarudo -- 86400000",
    );
    process.exit(1);
  }

  (async () => {
    try {
      await sequelize.authenticate();
      logger.info("Database connected successfully");
      await offsetDatabaseTime(offsetMs);
      await sequelize.close();
      process.exit(0);
    } catch (error) {
      logger.error("Error:", error);
      process.exit(1);
    }
  })();
}
