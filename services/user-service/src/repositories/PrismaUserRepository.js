const IUserRepository = require('../interfaces/IUserRepository');

// UUID v4 regex for distinguishing PostgreSQL UUIDs from MongoDB ObjectIds
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * PrismaUserRepository
 * Concrete implementation of IUserRepository backed by Prisma + PostgreSQL.
 *
 * This class is the ONLY place in the application where Prisma User model
 * methods (findUnique, findMany, create, update, delete) should be called.
 *
 * ID Handling Strategy:
 * - If the incoming ID is a valid UUID → look up by `id`
 * - Otherwise (e.g. a 24-char MongoDB ObjectId) → look up by `legacyId`
 */
class PrismaUserRepository extends IUserRepository {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  /**
   * Build the correct `where` clause depending on whether
   * the caller passes a UUID or a legacy MongoDB ObjectId.
   */
  _whereById(id) {
    return UUID_REGEX.test(id) ? { id } : { legacyId: id };
  }

  /**
   * Convert Mongoose-style projection string (e.g. '-password') into
   * a Prisma `select` object.  If projection is falsy, returns undefined
   * (which means "select all fields").
   */
  _buildSelect(projection) {
    if (!projection) return undefined;

    const fields = typeof projection === 'string' ? projection.split(/\s+/) : [];
    if (fields.length === 0) return undefined;

    // All model fields
    const allFields = ['id', 'legacyId', 'name', 'email', 'password', 'role', 'phoneNumber', 'avatar', 'createdAt', 'updatedAt'];

    const hasExclusion = fields.some((f) => f.startsWith('-'));

    if (hasExclusion) {
      // Exclusion mode: e.g. '-password'
      const excluded = new Set(fields.filter((f) => f.startsWith('-')).map((f) => f.slice(1)));
      const select = {};
      for (const field of allFields) {
        select[field] = !excluded.has(field);
      }
      return select;
    }

    // Inclusion mode: e.g. 'name email phoneNumber'
    const select = {};
    for (const field of fields) {
      if (allFields.includes(field)) {
        select[field] = true;
      }
    }
    // Always include id
    select.id = true;
    return select;
  }

  /**
   * Normalize a Prisma result to look like a Mongoose document for
   * backward-compatibility with controllers that use `user._id` or `user.toObject()`.
   */
  _normalize(user) {
    if (!user) return null;

    const normalized = { ...user, _id: user.id };

    // Add a no-op toObject() so existing controller code doesn't break
    normalized.toObject = function () {
      const { toObject, ...plain } = this;
      return plain;
    };

    return normalized;
  }

  async findByEmail(email) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return this._normalize(user);
  }

  async findById(id, projection = '-password') {
    const select = this._buildSelect(projection);
    const user = await this.prisma.user.findUnique({
      where: this._whereById(id),
      ...(select ? { select } : {}),
    });
    return this._normalize(user);
  }

  async findByIdSelect(id, selectFields) {
    const select = this._buildSelect(selectFields);
    const user = await this.prisma.user.findUnique({
      where: this._whereById(id),
      ...(select ? { select } : {}),
    });
    return this._normalize(user);
  }

  async create(userData) {
    const user = await this.prisma.user.create({ data: userData });
    return this._normalize(user);
  }

  async findAll(filter = {}, projection = '-password') {
    const select = this._buildSelect(projection);

    // Convert Mongoose-style filter to Prisma `where`
    const where = {};
    for (const [key, value] of Object.entries(filter)) {
      if (key === '_id') {
        where.id = value;
      } else {
        where[key] = value;
      }
    }

    const users = await this.prisma.user.findMany({
      where,
      ...(select ? { select } : {}),
    });
    return users.map((u) => this._normalize(u));
  }

  async updateById(id, updates) {
    try {
      // Remove Mongoose-specific fields
      const { _id, __v, ...cleanUpdates } = updates;

      const user = await this.prisma.user.update({
        where: this._whereById(id),
        data: cleanUpdates,
      });

      // Return without password (mirroring old .select('-password') behavior)
      const { password, ...userWithoutPassword } = user;
      return this._normalize(userWithoutPassword);
    } catch (error) {
      // Prisma throws P2025 when the record doesn't exist
      if (error.code === 'P2025') return null;
      throw error;
    }
  }

  async deleteById(id) {
    try {
      const user = await this.prisma.user.delete({
        where: this._whereById(id),
      });
      return this._normalize(user);
    } catch (error) {
      if (error.code === 'P2025') return null;
      throw error;
    }
  }

  async deleteMany(ids) {
    // Convert each id to the right where clause
    const uuids = [];
    const legacyIds = [];
    for (const id of ids) {
      if (UUID_REGEX.test(id)) {
        uuids.push(id);
      } else {
        legacyIds.push(id);
      }
    }

    const result = await this.prisma.user.deleteMany({
      where: {
        OR: [
          ...(uuids.length ? [{ id: { in: uuids } }] : []),
          ...(legacyIds.length ? [{ legacyId: { in: legacyIds } }] : []),
        ],
      },
    });

    return { deletedCount: result.count };
  }
}

module.exports = PrismaUserRepository;
