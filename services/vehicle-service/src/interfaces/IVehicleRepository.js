/**
 * @interface IVehicleRepository
 * Defines the contract for Vehicle data access operations.
 * Any concrete implementation (Mongo, Postgres, In-Memory) must fulfill this contract.
 */
class IVehicleRepository {
  /**
   * Persist a new vehicle record.
   * @param {Object} vehicleData
   * @returns {Promise<Object>} The created vehicle document.
   */
  async create(vehicleData) {
    throw new Error('IVehicleRepository.create() not implemented');
  }

  /**
   * Find a single vehicle by ID.
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    throw new Error('IVehicleRepository.findById() not implemented');
  }

  /**
   * Find a single vehicle by license plate, optionally excluding a specific ID.
   * Used for duplicate license plate validation.
   * @param {string} licensePlate
   * @param {string|null} [excludeId=null] - Vehicle ID to exclude from the search.
   * @returns {Promise<Object|null>}
   */
  async findByLicensePlate(licensePlate, excludeId) {
    throw new Error('IVehicleRepository.findByLicensePlate() not implemented');
  }

  /**
   * Find vehicles with filtering, sorting, and pagination.
   * The filter-building logic (RegExp for brand, price ranges, city normalization)
   * is encapsulated inside the concrete implementation.
   * @param {Object} queryParams - Raw query parameters from req.query.
   * @returns {Promise<{ vehicles: Array<Object>, total: number, page: number, pages: number }>}
   */
  async findWithPagination(queryParams) {
    throw new Error('IVehicleRepository.findWithPagination() not implemented');
  }

  /**
   * Update a vehicle by ID.
   * @param {string} id
   * @param {Object} updates
   * @param {Object} [options] - e.g., { new: true, runValidators: true }
   * @returns {Promise<Object|null>}
   */
  async updateById(id, updates, options) {
    throw new Error('IVehicleRepository.updateById() not implemented');
  }

  /**
   * Update only the status field of a vehicle.
   * @param {string} id
   * @param {string} status
   * @returns {Promise<Object|null>}
   */
  async updateStatus(id, status) {
    throw new Error('IVehicleRepository.updateStatus() not implemented');
  }

  /**
   * Delete a vehicle by ID.
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async deleteById(id) {
    throw new Error('IVehicleRepository.deleteById() not implemented');
  }

  /**
   * Remove a specific image path from a vehicle's images array and save.
   * @param {string} id
   * @param {string} imagePath
   * @returns {Promise<Object|null>}
   */
  async removeImage(id, imagePath) {
    throw new Error('IVehicleRepository.removeImage() not implemented');
  }
}

module.exports = IVehicleRepository;
