/**
 * CONTRACT UNIT TEST — IRentalRepository
 * Validates the interface contract using a lightweight in-memory mock.
 * No MongoDB required. Runs in milliseconds.
 */
const IRentalRepository = require('../../src/interfaces/IRentalRepository');

class MockRentalRepository extends IRentalRepository {
  constructor() {
    super();
    this.rentals = [];
    this.idCounter = 1;
  }

  async create(rentalData) {
    const rental = {
      _id: String(this.idCounter++),
      ...rentalData,
      status: rentalData.status || 'pending',
      paymentStatus: rentalData.paymentStatus || 'unpaid',
      createdAt: new Date(),
    };
    this.rentals.push(rental);
    return rental;
  }

  async findById(id) {
    return this.rentals.find(r => r._id === id) || null;
  }

  async findOverlappingRentals(vehicleId, startDate, endDate) {
    return this.rentals.filter(
      r =>
        r.vehicleId === vehicleId &&
        !['cancelled', 'rejected'].includes(r.status) &&
        new Date(r.startDate) < endDate &&
        new Date(r.endDate) > startDate
    );
  }

  async updateById(id, updates) {
    const idx = this.rentals.findIndex(r => r._id === id);
    if (idx === -1) return null;
    this.rentals[idx] = { ...this.rentals[idx], ...updates };
    return this.rentals[idx];
  }

  async findWithPagination(filters, sortOptions, skip, limit) {
    let filtered = [...this.rentals];

    // Apply filters
    for (const [key, value] of Object.entries(filters)) {
      filtered = filtered.filter(r => r[key] === value);
    }

    // Apply pagination (0 means no limit)
    if (limit > 0) {
      filtered = filtered.slice(skip, skip + limit);
    }

    return filtered;
  }

  async count(filters) {
    let filtered = [...this.rentals];
    for (const [key, value] of Object.entries(filters)) {
      filtered = filtered.filter(r => r[key] === value);
    }
    return filtered.length;
  }
}

// ---- Contract Tests ----

describe('IRentalRepository Contract', () => {
  let repo;

  beforeEach(() => { repo = new MockRentalRepository(); });

  it('create() should persist and return a rental', async () => {
    const rental = await repo.create({
      userId: 'user-1',
      vehicleId: 'vehicle-1',
      car_providerId: 'provider-1',
      rentalType: 'daily',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-04-05'),
      totalPrice: 200,
    });
    expect(rental._id).toBeDefined();
    expect(rental.userId).toBe('user-1');
    expect(rental.status).toBe('pending');
    expect(rental.totalPrice).toBe(200);
  });

  it('findById() should return the rental or null', async () => {
    const rental = await repo.create({
      userId: 'user-1', vehicleId: 'v-1', car_providerId: 'p-1',
      rentalType: 'daily', startDate: new Date(), endDate: new Date(), totalPrice: 100,
    });
    expect(await repo.findById(rental._id)).not.toBeNull();
    expect(await repo.findById('ghost')).toBeNull();
  });

  it('findOverlappingRentals() should find date conflicts', async () => {
    await repo.create({
      userId: 'u-1', vehicleId: 'v-1', car_providerId: 'p-1',
      rentalType: 'daily',
      startDate: new Date('2026-04-01'), endDate: new Date('2026-04-05'),
      totalPrice: 200,
    });

    // Overlapping range
    const overlapping = await repo.findOverlappingRentals(
      'v-1', new Date('2026-04-03'), new Date('2026-04-07')
    );
    expect(overlapping.length).toBe(1);

    // Non-overlapping range
    const noOverlap = await repo.findOverlappingRentals(
      'v-1', new Date('2026-04-06'), new Date('2026-04-10')
    );
    expect(noOverlap.length).toBe(0);
  });

  it('findOverlappingRentals() should ignore cancelled/rejected rentals', async () => {
    await repo.create({
      userId: 'u-1', vehicleId: 'v-1', car_providerId: 'p-1',
      rentalType: 'daily', status: 'cancelled',
      startDate: new Date('2026-04-01'), endDate: new Date('2026-04-05'),
      totalPrice: 200,
    });

    const overlapping = await repo.findOverlappingRentals(
      'v-1', new Date('2026-04-02'), new Date('2026-04-04')
    );
    expect(overlapping.length).toBe(0);
  });

  it('updateById() should apply updates', async () => {
    const rental = await repo.create({
      userId: 'u-1', vehicleId: 'v-1', car_providerId: 'p-1',
      rentalType: 'daily', startDate: new Date(), endDate: new Date(), totalPrice: 100,
    });
    const updated = await repo.updateById(rental._id, { status: 'approved' });
    expect(updated.status).toBe('approved');
  });

  it('findWithPagination() should filter and paginate', async () => {
    await repo.create({
      userId: 'u-1', vehicleId: 'v-1', car_providerId: 'p-1',
      rentalType: 'daily', startDate: new Date(), endDate: new Date(), totalPrice: 100,
    });
    await repo.create({
      userId: 'u-1', vehicleId: 'v-2', car_providerId: 'p-1',
      rentalType: 'hourly', startDate: new Date(), endDate: new Date(), totalPrice: 50,
    });
    await repo.create({
      userId: 'u-2', vehicleId: 'v-3', car_providerId: 'p-2',
      rentalType: 'daily', startDate: new Date(), endDate: new Date(), totalPrice: 300,
    });

    // Filter by userId
    const userRentals = await repo.findWithPagination({ userId: 'u-1' }, {}, 0, 10);
    expect(userRentals.length).toBe(2);

    // Pagination
    const paged = await repo.findWithPagination({}, {}, 0, 2);
    expect(paged.length).toBe(2);
  });

  it('count() should return the number of matching documents', async () => {
    await repo.create({
      userId: 'u-1', vehicleId: 'v-1', car_providerId: 'p-1',
      rentalType: 'daily', startDate: new Date(), endDate: new Date(), totalPrice: 100,
    });
    await repo.create({
      userId: 'u-2', vehicleId: 'v-2', car_providerId: 'p-2',
      rentalType: 'daily', startDate: new Date(), endDate: new Date(), totalPrice: 200,
    });

    expect(await repo.count({})).toBe(2);
    expect(await repo.count({ userId: 'u-1' })).toBe(1);
    expect(await repo.count({ userId: 'ghost' })).toBe(0);
  });
});
