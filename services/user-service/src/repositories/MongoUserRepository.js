const IUserRepository = require('../interfaces/IUserRepository');
const User = require('../models/user.model');

/**
 * MongoUserRepository
 * Concrete implementation of IUserRepository backed by Mongoose.
 *
 * This class is the ONLY place in the application where Mongoose User model
 * methods (find, findOne, save, etc.) should be called.
 */
class MongoUserRepository extends IUserRepository {
  async findByEmail(email) {
    return User.findOne({ email });
  }

  async findById(id, projection = '-password') {
    return User.findById(id, projection);
  }

  async findByIdSelect(id, selectFields) {
    return User.findById(id).select(selectFields);
  }

  async create(userData) {
    const user = new User(userData);
    return user.save();
  }

  async findAll(filter = {}, projection = '-password') {
    return User.find(filter, projection);
  }

  async updateById(id, updates, options = { new: true, runValidators: true }) {
    return User.findByIdAndUpdate(
      id,
      { $set: updates },
      options
    ).select('-password');
  }

  async deleteById(id) {
    return User.findByIdAndDelete(id);
  }

  async deleteMany(ids) {
    return User.deleteMany({ _id: { $in: ids } });
  }
}

module.exports = MongoUserRepository;
