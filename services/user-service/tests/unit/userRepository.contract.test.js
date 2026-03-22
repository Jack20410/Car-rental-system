/**
 * CONTRACT UNIT TEST — IUserRepository
 *
 * Purpose: Verify the *contract* of the IUserRepository interface
 * using a lightweight in-memory mock. These tests do NOT touch MongoDB.
 * They run in milliseconds and validate that any implementation
 * fulfilling IUserRepository behaves correctly.
 *
 * Run:
 *   npx jest tests/unit/userRepository.contract.test.js
 */

const IUserRepository = require('../../src/interfaces/IUserRepository');

/**
 * MockUserRepository — an in-memory mock implementing IUserRepository.
 * Used exclusively for contract testing.
 */
class MockUserRepository extends IUserRepository {
  constructor() {
    super();
    this.users = [];
    this.idCounter = 1;
  }

  async findByEmail(email) {
    return this.users.find(u => u.email === email) || null;
  }

  async findById(id) {
    return this.users.find(u => u.id === id) || null;
  }

  async findByIdSelect(id, _selectFields) {
    return this.users.find(u => u.id === id) || null;
  }

  async create(userData) {
    const user = { id: String(this.idCounter++), ...userData, createdAt: new Date() };
    this.users.push(user);
    return user;
  }

  async findAll(filter = {}) {
    if (filter.role) {
      return this.users.filter(u => u.role === filter.role);
    }
    return [...this.users];
  }

  async updateById(id, updates) {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) return null;
    this.users[index] = { ...this.users[index], ...updates };
    return this.users[index];
  }

  async deleteById(id) {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) return null;
    return this.users.splice(index, 1)[0];
  }

  async deleteMany(ids) {
    const before = this.users.length;
    this.users = this.users.filter(u => !ids.includes(u.id));
    return { deletedCount: before - this.users.length };
  }
}

// ---- Contract Tests ----

describe('IUserRepository Contract', () => {
  let repo;

  beforeEach(() => {
    repo = new MockUserRepository();
  });

  it('create() should persist and return a user', async () => {
    const user = await repo.create({
      name: 'Alice',
      email: 'alice@test.com',
      password: 'hashed_pw',
      phoneNumber: '1234567890',
      role: 'customer',
    });
    expect(user.id).toBeDefined();
    expect(user.email).toBe('alice@test.com');
  });

  it('findByEmail() should return the user or null', async () => {
    await repo.create({ name: 'Bob', email: 'bob@test.com', password: 'pw', phoneNumber: '0', role: 'customer' });
    const found = await repo.findByEmail('bob@test.com');
    expect(found).not.toBeNull();
    expect(found.name).toBe('Bob');

    const notFound = await repo.findByEmail('ghost@test.com');
    expect(notFound).toBeNull();
  });

  it('findById() should return the user or null', async () => {
    const user = await repo.create({ name: 'Charlie', email: 'c@test.com', password: 'pw', phoneNumber: '0', role: 'customer' });
    const found = await repo.findById(user.id);
    expect(found.name).toBe('Charlie');
  });

  it('updateById() should apply updates and return the updated user', async () => {
    const user = await repo.create({ name: 'Dana', email: 'd@test.com', password: 'pw', phoneNumber: '0', role: 'customer' });
    const updated = await repo.updateById(user.id, { name: 'Dana Updated' });
    expect(updated.name).toBe('Dana Updated');
  });

  it('deleteById() should remove the user', async () => {
    const user = await repo.create({ name: 'Eve', email: 'e@test.com', password: 'pw', phoneNumber: '0', role: 'customer' });
    const deleted = await repo.deleteById(user.id);
    expect(deleted.name).toBe('Eve');
    const ghost = await repo.findById(user.id);
    expect(ghost).toBeNull();
  });

  it('deleteMany() should remove multiple users', async () => {
    const u1 = await repo.create({ name: 'F1', email: 'f1@t.com', password: 'pw', phoneNumber: '0', role: 'customer' });
    const u2 = await repo.create({ name: 'F2', email: 'f2@t.com', password: 'pw', phoneNumber: '0', role: 'customer' });
    await repo.create({ name: 'F3', email: 'f3@t.com', password: 'pw', phoneNumber: '0', role: 'customer' });
    const result = await repo.deleteMany([u1.id, u2.id]);
    expect(result.deletedCount).toBe(2);
    const remaining = await repo.findAll();
    expect(remaining.length).toBe(1);
  });
});
