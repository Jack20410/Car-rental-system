/**
 * @interface IRentalRepository
 * Defines the contract for Rental data access operations.
 * Any concrete implementation (Mongo, Postgres, In-Memory) must fulfill this contract.
 */
class IRentalRepository {
  /**
   * Persist a new rental record.
   * @param {Object} rentalData
   * @returns {Promise<Object>} The created rental document.
   */
  async create(rentalData) {
    throw new Error('IRentalRepository.create() not implemented');
  }

  /**
   * Find a single rental by ID.
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    throw new Error('IRentalRepository.findById() not implemented');
  }

  /**
   * Find rentals that overlap with a given date range for a specific vehicle.
   * Used for availability checking.
   * @param {string} vehicleId
   * @param {Date} startDate
   * @param {Date} endDate
   * @returns {Promise<Array<Object>>}
   */
  async findOverlappingRentals(vehicleId, startDate, endDate) {
    throw new Error('IRentalRepository.findOverlappingRentals() not implemented');
  }

  /**
   * Update a rental by ID (partial update via save).
   * Returns the updated document.
   * @param {string} id
   * @param {Object} updates
   * @returns {Promise<Object|null>}
   */
  async updateById(id, updates) {
    throw new Error('IRentalRepository.updateById() not implemented');
  }

  /**
   * Find rentals with filtering, sorting, and pagination.
   * @param {Object} filters - MongoDB query filter object.
   * @param {Object} sortOptions - e.g., { createdAt: -1 }
   * @param {number} skip - Number of documents to skip.
   * @param {number} limit - Maximum documents to return.
   * @returns {Promise<Array<Object>>}
   */
  async findWithPagination(filters, sortOptions, skip, limit) {
    throw new Error('IRentalRepository.findWithPagination() not implemented');
  }

  /**
   * Count documents matching filters.
   * @param {Object} filters - MongoDB query filter object.
   * @returns {Promise<number>}
   */
  async count(filters) {
    throw new Error('IRentalRepository.count() not implemented');
  }
}

module.exports = IRentalRepository;
