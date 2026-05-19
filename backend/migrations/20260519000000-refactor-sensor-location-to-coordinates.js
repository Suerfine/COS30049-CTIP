"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Add longitude and latitude columns
      await queryInterface.addColumn(
        "sensors",
        "longitude",
        {
          type: Sequelize.DECIMAL(10, 7),
          allowNull: true, // Temporarily allow null to handle existing records
          after: "type",
        },
        { transaction },
      );

      await queryInterface.addColumn(
        "sensors",
        "latitude",
        {
          type: Sequelize.DECIMAL(10, 7),
          allowNull: true, // Temporarily allow null to handle existing records
          after: "longitude",
        },
        { transaction },
      );

      // If there are existing sensors with location data, parse and migrate them
      // Assuming location format is "latitude,longitude"
      const sensors = await queryInterface.sequelize.query(
        "SELECT id, location FROM sensors WHERE location IS NOT NULL",
        { type: Sequelize.QueryTypes.SELECT, transaction },
      );

      for (const sensor of sensors) {
        const [latitude, longitude] = sensor.location
          .split(",")
          .map((coord) => parseFloat(coord.trim()));
        if (!isNaN(latitude) && !isNaN(longitude)) {
          await queryInterface.sequelize.query(
            "UPDATE sensors SET latitude = :latitude, longitude = :longitude WHERE id = :id",
            {
              replacements: { latitude, longitude, id: sensor.id },
              transaction,
            },
          );
        }
      }

      // Remove location column
      await queryInterface.removeColumn("sensors", "location", { transaction });

      // Now make longitude and latitude NOT NULL
      await queryInterface.changeColumn(
        "sensors",
        "longitude",
        {
          type: Sequelize.DECIMAL(10, 7),
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        "sensors",
        "latitude",
        {
          type: Sequelize.DECIMAL(10, 7),
          allowNull: false,
        },
        { transaction },
      );

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Add location column back
      await queryInterface.addColumn(
        "sensors",
        "location",
        {
          type: Sequelize.STRING,
          allowNull: true,
          after: "type",
        },
        { transaction },
      );

      // Reconstruct location from longitude and latitude
      const sensors = await queryInterface.sequelize.query(
        "SELECT id, latitude, longitude FROM sensors",
        { type: Sequelize.QueryTypes.SELECT, transaction },
      );

      for (const sensor of sensors) {
        const location = `${sensor.latitude},${sensor.longitude}`;
        await queryInterface.sequelize.query(
          "UPDATE sensors SET location = :location WHERE id = :id",
          {
            replacements: { location, id: sensor.id },
            transaction,
          },
        );
      }

      // Update location to NOT NULL
      await queryInterface.changeColumn(
        "sensors",
        "location",
        {
          type: Sequelize.STRING,
          allowNull: false,
        },
        { transaction },
      );

      // Remove longitude and latitude columns
      await queryInterface.removeColumn("sensors", "longitude", {
        transaction,
      });
      await queryInterface.removeColumn("sensors", "latitude", { transaction });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};
