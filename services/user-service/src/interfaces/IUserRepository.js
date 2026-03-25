/**
 * @interface IUserRepository
 * Defines the contract for User data access operations.
 * Any concrete implementation (Prisma/Postgres, In-Memory, etc.) must fulfill this contract.
 */
class IUserRepository {
  /**
   * Find a single user by their email address.
   * @param {string} email
   * @returns {Promise<Object|null>} The user document or null if not found.
   */
  async findByEmail(email) {
    throw new Error('IUserRepository.findByEmail() not implemented');
  }

  /**
   * Find a single user by their ID.
   * @param {string} id
   * @param {string|Object} [projection] - Fields to include or exclude (e.g., '-password').
   * @returns {Promise<Object|null>}
   */
  async findById(id, projection) {
    throw new Error('IUserRepository.findById() not implemented');
  }

  /**
   * Find a single user by ID and return only the specified public fields.
   * @param {string} id
   * @param {string} selectFields - Space-separated field names.
   * @returns {Promise<Object|null>}
   */
  async findByIdSelect(id, selectFields) {
    throw new Error('IUserRepository.findByIdSelect() not implemented');
  }

  /**
   * Persist a new user record.
   * @param {Object} userData - { name, email, password (hashed), phoneNumber, role, avatar }
   * @returns {Promise<Object>} The created user document.
   */
  async create(userData) {
    throw new Error('IUserRepository.create() not implemented');
  }

  /**
   * Find all users, optionally filtering by criteria.
   * @param {Object} [filter={}] - Key-value filter object (e.g. { role: 'admin' }).
   * @param {string|Object} [projection] - Fields to include/exclude.
   * @returns {Promise<Array<Object>>}
   */
  async findAll(filter, projection) {
    throw new Error('IUserRepository.findAll() not implemented');
  }

  /**
   * Update a user by ID.
   * @param {string} id
   * @param {Object} updates
   * @param {Object} [options] - e.g., { new: true, runValidators: true }
   * @returns {Promise<Object|null>}
   */
  async updateById(id, updates, options) {
    throw new Error('IUserRepository.updateById() not implemented');
  }

  /**
   * Delete a single user by ID.
   * @param {string} id
   * @returns {Promise<Object|null>} The deleted user document or null.
   */
  async deleteById(id) {
    throw new Error('IUserRepository.deleteById() not implemented');
  }

  /**
   * Delete multiple users matching the given IDs.
   * @param {Array<string>} ids
   * @returns {Promise<{ deletedCount: number }>}
   */
  async deleteMany(ids) {
    throw new Error('IUserRepository.deleteMany() not implemented');
  }
}

module.exports = IUserRepository;
