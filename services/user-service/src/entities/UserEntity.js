/**
 * UserEntity - A clean, framework-agnostic domain representation of a User.
 *
 * This entity is what the Application/Use-Case layer works with.
 * It is NOT a Prisma model object. Repositories are responsible for
 * converting Prisma records to/from this entity.
 */
class UserEntity {
  /**
   * @param {Object} props
   * @param {string} props.id
   * @param {string} props.name
   * @param {string} props.email
   * @param {string} [props.password] - Hashed. Excluded from public representations.
   * @param {string} props.phoneNumber
   * @param {string} props.avatar
   * @param {'admin'|'car_provider'|'customer'} props.role
   * @param {Date} props.createdAt
   */
  constructor({ id, name, email, password, phoneNumber, avatar, role, createdAt }) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.password = password;
    this.phoneNumber = phoneNumber;
    this.avatar = avatar;
    this.role = role;
    this.createdAt = createdAt;
  }

  /**
   * Return a plain object WITHOUT the password field.
   * Useful for API responses.
   * @returns {Object}
   */
  toPublicJSON() {
    const { password, ...publicFields } = this;
    return publicFields;
  }
}

module.exports = UserEntity;
