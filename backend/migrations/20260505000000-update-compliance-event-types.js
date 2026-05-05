'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Update the event_type ENUM to include new event types
    // This migration adds the new event types while keeping the old ones for backward compatibility
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Change the ENUM type to include new values
      await queryInterface.changeColumn(
        'compliance_events',
        'event_type',
        {
          type: Sequelize.ENUM(
            'touching_plant',
            'touching_animal',
            'plucking_plants',
            'hitting_animal',
            'extended_plant_touch',
            'extended_animal_touch',
            'forest_fire',
            'other'
          ),
          allowNull: false,
        },
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Revert to old ENUM values
      await queryInterface.changeColumn(
        'compliance_events',
        'event_type',
        {
          type: Sequelize.ENUM('plucking', 'animal_strike', 'extended_touch', 'other'),
          allowNull: false,
        },
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
